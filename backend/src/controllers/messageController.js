import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import {
  emitNewMessage,
  updateConversationAfterCreateMessage,
} from "../utils/messageHelper.js";
import { io } from "../socket/index.js";
import { uploadImageFromBuffer } from "../middlewares/uploadMiddleware.js";

export const sendDirectMessage = async (req, res) => {
  try {
    const { recipientId, content, imgUrl, conversationId, replyTo } = req.body;
    const senderId = req.user._id;

    let conversation;

    if (!content && !imgUrl) {
      return res
        .status(400)
        .json({ message: "Thiếu nội dung tin nhắn hoặc hình ảnh" });
    }

    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
    }

    if (!conversation) {
      conversation = await Conversation.create({
        type: "direct",
        participants: [
          { userId: senderId, joinedAt: new Date() },
          { userId: recipientId, joinedAt: new Date() },
        ],
        lastMessageAt: new Date(),
        unreadCounts: new Map(),
      });
    }

    const message = await Message.create({
      conversationId: conversation._id,
      senderId,
      content: content || "",
      imgUrl: imgUrl || undefined,
      replyTo: replyTo || undefined,
    });

    if (replyTo) {
      await message.populate({
        path: "replyTo",
        select: "content senderId imgUrl",
        populate: {
          path: "senderId",
          select: " displayName avatarUrl",
        },
      });
    }

    updateConversationAfterCreateMessage(conversation, message, senderId);

    await conversation.save();

    emitNewMessage(io, conversation, message);

    return res.status(201).json({ message });
  } catch (error) {
    console.error("Lỗi xảy ra khi gửi tin nhắn trực tiếp", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const sendGroupMessage = async (req, res) => {
  try {
    const { conversationId, content, imgUrl, replyTo } = req.body;
    const senderId = req.user._id;
    const conversation = req.conversation;

    if (!content && !imgUrl) {
      return res
        .status(400)
        .json({ message: "Thiếu nội dung tin nhắn hoặc hình ảnh" });
    }

    const message = await Message.create({
      conversationId,
      senderId,
      content: content || "",
      imgUrl: imgUrl || undefined,
      replyTo: replyTo || undefined,
    });

    if (replyTo) {
      await message.populate({
        path: "replyTo",
        select: "content senderId imgUrl",
        populate: {
          path: "senderId",
          select: " displayName avatarUrl",
        },
      });
    }

    updateConversationAfterCreateMessage(conversation, message, senderId);

    await conversation.save();
    emitNewMessage(io, conversation, message);

    return res.status(201).json({ message });
  } catch (error) {
    console.error("Lỗi xảy ra khi gửi tin nhắn nhóm", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const uploadMessageImage = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: "Không tìm thấy file tải lên" });
    }

    const result = await uploadImageFromBuffer(file.buffer, {
      folder: "moji_chat/messages",
    });

    return res.status(200).json({ imgUrl: result.secure_url });
  } catch (error) {
    console.error("Lỗi khi tải ảnh tin nhắn lên", error);
    return res.status(500).json({ message: "Tải ảnh thất bại" });
  }
};

export const reactToMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    if (!emoji) {
      return res.status(400).json({ message: "Thiếu emoji cảm xúc" });
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Không tìm thấy tin nhắn" });
    }

    const existingIndex = message.reactions.findIndex(
      (r) => r.userId.toString() === userId.toString(),
    );

    if (existingIndex > -1) {
      if (message.reactions[existingIndex].emoji === emoji) {
        message.reactions.splice(existingIndex, 1);
      } else {
        message.reactions[existingIndex].emoji = emoji;
      }
    } else {
      message.reactions.push({ userId, emoji });
    }

    await message.save();

    io.to(message.conversationId.toString()).emit("message-reaction-updated", {
      messageId: message._id,
      conversationId: message.conversationId,
      reactions: message.reactions,
    });

    return res.status(200).json({ reactions: message.reactions });
  } catch (error) {
    console.error("Lỗi khi thêm emoji", error);
    return res.status(500).json({ message: "Thêm emoji thất bại" });
  }
};

export const revokeMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "không tím thấy tin nhắn" });
    }

    if (userId.toString() !== message.senderId.toString()) {
      return res
        .status(400)
        .json({ message: "Bạn không có quyền thu hồi tin nhắn này" });
    }

    message.revoked = true;
    message.content = "Tin nhắn đã bị thu hồi";
    message.imgUrl = undefined;
    message.reactions = [];

    await message.save();

    io.to(message.conversationId.toString()).emit("message-revoked", {
      messageId: message._id,
      conversationId: message.conversationId,
      revoked: message.revoked,
    });

    return res.status(200).json({ message });
  } catch (error) {
    console.error("Lỗi khi thu hồi tin nhắn", error);
    return res.status(500).json({ message: "Thu hồi tin nhắn thất bại" });
  }
};

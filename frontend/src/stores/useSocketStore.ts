import { create } from "zustand";
import { io, type Socket } from "socket.io-client";
import { useAuthStore } from "./useAuthStore";
import type { SocketState } from "@/types/store";
import { useChatStore } from "./useChatStore";
import { useFriendStore } from "./useFriendStore";
import { toast } from "sonner";
import { soundController } from "@/lib/soundUtils";

const baseURL = import.meta.env.VITE_SOCKET_URL;

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  onlineUsers: [],
  connectSocket: () => {
    const accessToken = useAuthStore.getState().accessToken;
    const existingSocket = get().socket;

    if (existingSocket) return; // tránh tạo nhiều socket

    const socket: Socket = io(baseURL, {
      auth: { token: accessToken },
      transports: ["websocket"],
    });

    set({ socket });

    socket.on("connect", () => {
      console.log("Đã kết nối với socket");
    });

    // online users
    socket.on("online-users", (userIds) => {
      set({ onlineUsers: userIds });
    });

    // new message
    socket.on("new-message", ({ message, conversation, unreadCounts }) => {
      useChatStore.getState().addMessage(message);

      const currentUserId = useAuthStore.getState().user?._id;
      // Phát âm thanh nếu tin nhắn gửi từ người khác
      if (message.senderId !== currentUserId) {
        soundController.playMessageSound();
      }

      const lastMessage = {
        _id: conversation.lastMessage._id,
        content: conversation.lastMessage.content,
        createdAt: conversation.lastMessage.createdAt,
        sender: {
          _id: conversation.lastMessage.senderId,
          displayName: "",
          avatarUrl: null,
        },
      };

      const updatedConversation = {
        ...conversation,
        lastMessage,
        unreadCounts,
      };

      if (useChatStore.getState().activeConversationId === message.conversationId) {
        useChatStore.getState().markAsSeen();
      }

      useChatStore.getState().updateConversation(updatedConversation);
    });

    // read message
    socket.on("read-message", ({ conversation, lastMessage }) => {
      const updated = {
        _id: conversation._id,
        lastMessage,
        lastMessageAt: conversation.lastMessageAt,
        unreadCounts: conversation.unreadCounts,
        seenBy: conversation.seenBy,
      };

      useChatStore.getState().updateConversation(updated);
    });

    // new group chat
    socket.on("new-group", (conversation) => {
      useChatStore.getState().addConvo(conversation);
      socket.emit("join-conversation", conversation._id);
    });

    // delete conversation
    socket.on("delete-conversation", ({ conversationId }) => {
      useChatStore.getState().removeConvoFromStore(conversationId);
    });

    // new friend request
    socket.on("new-friend-request", (request) => {
      soundController.playNotificationSound();
      useFriendStore.getState().addReceivedRequest(request);
      const senderName = request.from?.displayName || request.from?.username || "Ai đó";
      toast.info(`${senderName} đã gửi cho bạn một lời mời kết bạn!`);
    });

    // friend request accepted
    socket.on("friend-request-accepted", ({ acceptedBy }) => {
      soundController.playNotificationSound();
      useFriendStore.getState().getFriends();
      const name = acceptedBy?.displayName || acceptedBy?.username || "Ai đó";
      toast.success(`${name} đã chấp nhận lời mời kết bạn của bạn!`);
    });
  },

  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },
}));

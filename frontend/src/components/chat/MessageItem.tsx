import { cn, formatMessageTime } from "@/lib/utils";
import { MoreHorizontal, Reply, Smile, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";

import type {
  Conversation,
  Message,
  Participant,
  Reaction,
} from "@/types/chat";
import UserAvatar from "./UserAvatar";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";

interface MessageItemProps {
  message: Message;
  index: number;
  messages: Message[];
  selectedConvo: Conversation;
  lastMessageStatus: "delivered" | "seen";
  onReply: (message: Message) => void;
}

const EMOJI_LIST = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

const MessageItem = ({
  message,
  index,
  messages,
  selectedConvo,
  lastMessageStatus,
  onReply,
}: MessageItemProps) => {
  const { user } = useAuthStore();
  const { reactToMessage, revokeMessage } = useChatStore();

  const prev = index + 1 < messages.length ? messages[index + 1] : undefined;

  const isShowTime =
    index === messages.length - 1 ||
    new Date(message.createdAt).getTime() -
      new Date(prev?.createdAt || 0).getTime() >
      300000; // 5 phút

  const senderIdString =
    typeof message.senderId === "object"
      ? (message.senderId as any)?._id?.toString()
      : message.senderId?.toString();

  const prevSenderIdString =
    typeof prev?.senderId === "object"
      ? (prev.senderId as any)?._id?.toString()
      : prev?.senderId?.toString();

  const isGroupBreak = isShowTime || senderIdString !== prevSenderIdString;

  const isOwn = message.isOwn ?? (senderIdString === user?._id?.toString());

  const participant = selectedConvo?.participants?.find(
    (p: Participant) => p._id?.toString() === senderIdString,
  );

  const formattedTime = formatMessageTime(new Date(message.createdAt));

  // Gom nhóm danh sách cảm xúc theo emoji và đếm số lượng
  const groupedReactions = (message.reactions || []).reduce(
    (
      acc: Record<string, { count: number; reactedByMe: boolean }>,
      r: Reaction,
    ) => {
      if (!acc[r.emoji]) {
        acc[r.emoji] = { count: 0, reactedByMe: false };
      }
      acc[r.emoji].count += 1;
      if (r.userId?.toString() === user?._id?.toString()) {
        acc[r.emoji].reactedByMe = true;
      }
      return acc;
    },
    {} as Record<string, { count: number; reactedByMe: boolean }>,
  );

  const replyToData: any =
    message.replyTo && typeof message.replyTo === "object"
      ? message.replyTo
      : message.replyToMessage && typeof message.replyToMessage === "object"
        ? message.replyToMessage
        : null;

  return (
    <div className="w-full flex flex-col py-1 overflow-x-hidden">
      {/* time header (hiển thị phía trên tin nhắn) */}
      {isShowTime && (
        <div className="flex justify-center my-1.5">
          <span className="text-[11px] font-medium text-muted-foreground bg-muted/60 px-2.5 py-0.5 rounded-full">
            {formattedTime}
          </span>
        </div>
      )}

      <div
        className={cn(
          "w-full flex gap-2 message-bounce min-w-0 overflow-x-hidden",
          isOwn ? "justify-end" : "justify-start",
        )}
      >
        {/* avatar */}
        {!isOwn && (
          <div className="w-8 shrink-0">
            {isGroupBreak && (
              <UserAvatar
                type="chat"
                name={participant?.displayName ?? "Moji"}
                avatarUrl={participant?.avatarUrl ?? undefined}
              />
            )}
          </div>
        )}

        {/* tin nhắn */}
        <div
          className={cn(
            "max-w-[85%] sm:max-w-[80%] md:max-w-[80%] flex flex-col space-y-0.5 min-w-0",
            isOwn ? "items-end" : "items-start",
          )}
        >
          <div className="relative group/msg flex items-center gap-1.5 w-full min-w-0 hover:z-30">
            {/* Thanh Nút Thao Tác (Smile + 3 Chấm) - Fade in khi hover */}
            {!message.revoked && !message.isRevoked && (
              <div
                className={cn(
                  "opacity-0 group-hover/msg:opacity-100 flex items-center gap-0.5 shrink-0 transition-opacity duration-200",
                  isOwn ? "order-first" : "order-last",
                )}
              >
                {/* 1. Nút Icon Thả Emoji */}
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      className="p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors cursor-pointer"
                      title="Thả cảm xúc"
                    >
                      <Smile className="w-4 h-4" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    side="top"
                    align={isOwn ? "end" : "start"}
                    className="w-auto p-1.5 rounded-full flex items-center gap-1 bg-background border shadow-md z-50 animate-in fade-in zoom-in duration-150"
                  >
                    {EMOJI_LIST.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => reactToMessage(message._id, emoji)}
                        className="hover:scale-125 transition-transform text-base p-1 cursor-pointer"
                      >
                        {emoji}
                      </button>
                    ))}
                  </PopoverContent>
                </Popover>

                {/* 2. Nút 3 chấm Dropdown Menu (Trả lời & Thu hồi) */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors cursor-pointer"
                      title="Tùy chọn"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align={isOwn ? "end" : "start"}>
                    {/* Nút Trả lời */}
                    <DropdownMenuItem
                      onClick={() => onReply?.(message)}
                      className="cursor-pointer gap-2"
                    >
                      <Reply className="w-4 h-4" />
                      <span>Trả lời</span>
                    </DropdownMenuItem>

                    {/* Nút Thu hồi (chỉ với tin nhắn của chính mình & chưa thu hồi) */}
                    {isOwn && (
                      <DropdownMenuItem
                        onClick={() => revokeMessage(message._id)}
                        className="text-destructive focus:text-destructive cursor-pointer gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Thu hồi tin nhắn</span>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {/* Bong bóng tin nhắn */}
            <Card
              title={formattedTime}
              className={cn(
                "p-3 overflow-hidden min-w-0 flex-1 break-words [overflow-wrap:anywhere]",
                isOwn
                  ? "chat-bubble-sent border-0"
                  : "chat-bubble-received",
                (message.revoked || message.isRevoked) &&
                  "opacity-75 bg-muted/50 text-muted-foreground border-dashed",
              )}
            >
              {/* Render tin nhắn bị thu hồi */}
              {message.revoked || message.isRevoked ? (
                <p className="text-sm italic text-muted-foreground/80">
                  Tin nhắn đã được thu hồi
                </p>
              ) : (
                <>
                  {/* Khung trích dẫn Reply (Quote Box) */}
                  {replyToData && (
                    <div className="mb-2 p-2 rounded-md bg-muted/60 border-l-2 border-primary text-xs space-y-0.5">
                      <p className="font-semibold text-primary/90">
                        {replyToData.senderId?.displayName || "Moji User"}
                      </p>
                      <p className="text-muted-foreground line-clamp-2 break-all">
                        {replyToData.content ||
                          (replyToData.imgUrl ? "[Hình ảnh]" : "")}
                      </p>
                    </div>
                  )}

                  {message.imgUrl && (
                    <a
                      href={message.imgUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block mb-1.5"
                    >
                      <img
                        src={message.imgUrl}
                        alt="Attachment"
                        className="max-h-64 max-w-full rounded-md object-cover hover:opacity-95 transition-opacity cursor-pointer"
                      />
                    </a>
                  )}

                  {message.content && (
                    <p className="text-sm leading-relaxed break-all [overflow-wrap:anywhere]">
                      {message.content}
                    </p>
                  )}
                </>
              )}
            </Card>
          </div>

          {/* 2. Danh sách Emoji đã được thả phía dưới tin nhắn */}
          {!message.revoked &&
            !message.isRevoked &&
            message.reactions &&
            message.reactions.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {Object.entries(groupedReactions).map(
                  ([emoji, { count, reactedByMe }]) => (
                    <button
                      key={emoji}
                      onClick={() => reactToMessage(message._id, emoji)}
                      className={cn(
                        "flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border transition-all cursor-pointer",
                        reactedByMe
                          ? "bg-primary/20 border-primary text-primary font-medium shadow-sm"
                          : "bg-background/80 border-border hover:bg-muted",
                      )}
                    >
                      <span>{emoji}</span>
                      <span className="text-[10px]">{count}</span>
                    </button>
                  ),
                )}
              </div>
            )}

          {/* seen/ delivered */}
          {isOwn && message._id === selectedConvo.lastMessage?._id && (
            <Badge
              variant="outline"
              className={cn(
                "text-xs px-1.5 py-0.5 h-4 border-0 mt-0.5",
                lastMessageStatus === "seen"
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {lastMessageStatus}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageItem;

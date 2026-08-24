import { cn, formatMessageTime } from "@/lib/utils";
import type { Conversation, Message, Participant } from "@/types/chat";
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
}

const EMOJI_LIST = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

const MessageItem = ({
  message,
  index,
  messages,
  selectedConvo,
  lastMessageStatus,
}: MessageItemProps) => {
  const { user } = useAuthStore();
  const { reactToMessage } = useChatStore();

  const prev = index + 1 < messages.length ? messages[index + 1] : undefined;

  const isShowTime =
    index === messages.length - 1 ||
    new Date(message.createdAt).getTime() -
      new Date(prev?.createdAt || 0).getTime() >
      300000; // 5 phút

  const isGroupBreak = isShowTime || message.senderId !== prev?.senderId;

  const participant = selectedConvo.participants.find(
    (p: Participant) => p._id.toString() === message.senderId.toString(),
  );

  const formattedTime = formatMessageTime(new Date(message.createdAt));

  return (
    <div className="w-full flex flex-col py-1">
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
          "flex gap-2 message-bounce",
          message.isOwn ? "justify-end" : "justify-start",
        )}
      >
        {/* avatar */}
        {!message.isOwn && (
          <div className="w-8">
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
            "max-w-xs lg:max-w-md space-y-0.5 flex flex-col",
            message.isOwn ? "items-end" : "items-start",
          )}
        >
          {/* Thời gian hiển thị ngay phía trên khung tin nhắn */}
          <span className="text-[10px] text-muted-foreground px-1 select-none">
            {formattedTime}
          </span>

          <div className="relative group">
            {/* 1. Thanh chọn Emoji hiện lên khi RÊ CHUỘT (Hover) vào tin nhắn */}
            <div
              className={cn(
                "absolute -top-9 hidden group-hover:flex items-center gap-1 bg-background border shadow-md rounded-full px-2 py-1 z-10 animate-in fade-in zoom-in duration-150",
                message.isOwn ? "right-0" : "left-0"
              )}
            >
              {EMOJI_LIST.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => reactToMessage(message._id, emoji)}
                  className="hover:scale-125 transition-transform text-base p-0.5 cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Bong bóng tin nhắn */}
            <Card
              className={cn(
                "p-3 overflow-hidden",
                message.isOwn
                  ? "chat-bubble-sent border-0"
                  : "chat-bubble-received"
              )}
            >
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
                <p className="text-sm leading-relaxed break-words">
                  {message.content}
                </p>
              )}
            </Card>
          </div>

          {/* 2. Danh sách Emoji đã được thả phía dưới tin nhắn */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {Object.entries(
                message.reactions.reduce<
                  Record<string, { count: number; reactedByMe: boolean }>
                >((acc, r) => {
                  if (!acc[r.emoji]) {
                    acc[r.emoji] = { count: 0, reactedByMe: false };
                  }
                  acc[r.emoji].count += 1;
                  if (r.userId === user?._id) {
                    acc[r.emoji].reactedByMe = true;
                  }
                  return acc;
                }, {})
              ).map(([emoji, { count, reactedByMe }]) => (
                <button
                  key={emoji}
                  onClick={() => reactToMessage(message._id, emoji)}
                  className={cn(
                    "flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border transition-all cursor-pointer",
                    reactedByMe
                      ? "bg-primary/20 border-primary text-primary font-medium shadow-sm"
                      : "bg-background/80 border-border hover:bg-muted"
                  )}
                >
                  <span>{emoji}</span>
                  <span className="text-[10px]">{count}</span>
                </button>
              ))}
            </div>
          )}

          {/* seen/ delivered */}
          {message.isOwn && message._id === selectedConvo.lastMessage?._id && (
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

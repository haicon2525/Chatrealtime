import { cn, formatMessageTime } from "@/lib/utils";
import type { Conversation, Message, Participant } from "@/types/chat";
import UserAvatar from "./UserAvatar";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";

interface MessageItemProps {
  message: Message;
  index: number;
  messages: Message[];
  selectedConvo: Conversation;
  lastMessageStatus: "delivered" | "seen";
}

const MessageItem = ({
  message,
  index,
  messages,
  selectedConvo,
  lastMessageStatus,
}: MessageItemProps) => {
  const prev = index + 1 < messages.length ? messages[index + 1] : undefined;

  const isShowTime =
    index === messages.length - 1 ||
    new Date(message.createdAt).getTime() -
      new Date(prev?.createdAt || 0).getTime() >
      300000; // 5 phút

  const isGroupBreak = isShowTime || message.senderId !== prev?.senderId;

  const participant = selectedConvo.participants.find(
    (p: Participant) => p._id.toString() === message.senderId.toString()
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
          message.isOwn ? "justify-end" : "justify-start"
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
            message.isOwn ? "items-end" : "items-start"
          )}
        >
          {/* Thời gian hiển thị ngay phía trên khung tin nhắn */}
          <span className="text-[10px] text-muted-foreground px-1 select-none">
            {formattedTime}
          </span>

          <Card
            className={cn(
              "p-3 overflow-hidden",
              message.isOwn ? "chat-bubble-sent border-0" : "chat-bubble-received"
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
              <p className="text-sm leading-relaxed break-words">{message.content}</p>
            )}
          </Card>

          {/* seen/ delivered */}
          {message.isOwn && message._id === selectedConvo.lastMessage?._id && (
            <Badge
              variant="outline"
              className={cn(
                "text-xs px-1.5 py-0.5 h-4 border-0 mt-0.5",
                lastMessageStatus === "seen"
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
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

import { useChatStore } from "@/stores/useChatStore";
import ChatWelcomeScreen from "./ChatWelcomeScreen";
import { SidebarInset } from "../ui/sidebar";
import ChatWindowHeader from "./ChatWindowHeader";
import ChatWindowBody from "./ChatWindowBody";
import MessageInput from "./MessageInput";
import { useState, useEffect } from "react";
import type { Message } from "@/types/chat";
import ChatWindowSkeleton from "../skeleton/ChatWindowSkeleton";

const ChatWindowLayout = () => {
  const {
    activeConversationId,
    conversations,
    messageLoading: loading,
    markAsSeen,
  } = useChatStore();

  const [replyingMessage, setReplyingMessage] = useState<Message | null>(null);

  const selectedConvo =
    conversations.find((c) => c._id === activeConversationId) ?? null;

  useEffect(() => {
    setReplyingMessage(null);
  }, [activeConversationId]);

  useEffect(() => {
    if (!selectedConvo) {
      return;
    }

    const markSeen = async () => {
      try {
        await markAsSeen();
      } catch (error) {
        console.error("Lỗi khi markSeen", error);
      }
    };

    markSeen();
  }, [markAsSeen, selectedConvo]);

  if (!selectedConvo) {
    return <ChatWelcomeScreen />;
  }

  if (loading) {
    return <ChatWindowSkeleton />;
  }

  return (
    <SidebarInset className="flex flex-col h-full flex-1 overflow-hidden rounded-sm shadow-md">
      {/* Header */}
      <ChatWindowHeader chat={selectedConvo} />

      {/* Body */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden bg-primary-foreground">
        <ChatWindowBody onReply={(msg) => setReplyingMessage(msg)} />
      </div>

      {/* Footer */}
      <MessageInput
        selectedConvo={selectedConvo}
        replyingMessage={replyingMessage}
        onClearReply={() => setReplyingMessage(null)}
      />
    </SidebarInset>
  );
};

export default ChatWindowLayout;

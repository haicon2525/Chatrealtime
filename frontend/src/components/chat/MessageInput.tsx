import { useAuthStore } from "@/stores/useAuthStore";
import type { Conversation, Message } from "@/types/chat";
import { useRef, useState } from "react";
import { Button } from "../ui/button";
import { ImagePlus, Loader2, Send, X, Reply } from "lucide-react";
import { Input } from "../ui/input";
import EmojiPicker from "./EmojiPicker";
import { useChatStore } from "@/stores/useChatStore";
import { chatService } from "@/services/chatService";
import { toast } from "sonner";

interface MessageInputProps {
  selectedConvo: Conversation;
  replyingMessage?: Message | null;
  onClearReply?: () => void;
}

const MessageInput = ({
  selectedConvo,
  replyingMessage,
  onClearReply,
}: MessageInputProps) => {
  const { user } = useAuthStore();
  const { sendDirectMessage, sendGroupMessage } = useChatStore();
  const [value, setValue] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!user) return null;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Dung lượng ảnh không được vượt quá 5MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file hình ảnh hợp lệ");
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const removeSelectedImage = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const sendMessage = async () => {
    if (!value.trim() && !selectedFile) return;

    const currValue = value;
    const currFile = selectedFile;
    const replyToId = replyingMessage?._id;

    setValue("");
    removeSelectedImage();
    if (onClearReply) onClearReply();
    setIsUploading(true);

    try {
      let uploadedImgUrl: string | undefined = undefined;

      if (currFile) {
        uploadedImgUrl = await chatService.uploadImage(currFile);
      }

      if (selectedConvo.type === "direct") {
        const participants = selectedConvo.participants;
        const otherUser = participants.filter((p) => p._id !== user._id)[0];
        await sendDirectMessage(
          otherUser._id,
          currValue,
          uploadedImgUrl,
          replyToId,
        );
      } else {
        await sendGroupMessage(
          selectedConvo._id,
          currValue,
          uploadedImgUrl,
          replyToId,
        );
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi xảy ra khi gửi tin nhắn. Bạn hãy thử lại!");
    } finally {
      setIsUploading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col border-t bg-background">
      {/* Box xem trước tin nhắn đang Reply */}
      {replyingMessage && (
        <div className="p-2.5 px-3 border-b bg-muted/40 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 min-w-0 border-l-2 border-primary pl-2">
            <Reply className="size-3.5 text-primary shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="font-semibold text-primary block truncate">
                Đang trả lời tin nhắn
              </span>
              <span className="text-muted-foreground truncate block">
                {replyingMessage.content ||
                  (replyingMessage.imgUrl ? "[Hình ảnh]" : "")}
              </span>
            </div>
          </div>
          <button
            onClick={onClearReply}
            className="p-1 hover:bg-muted rounded-full transition-colors shrink-0 text-muted-foreground hover:text-foreground cursor-pointer"
            title="Hủy trả lời"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Box xem trước ảnh đã chọn */}
      {previewUrl && (
        <div className="p-2 border-b bg-muted/30 flex items-center gap-2">
          <div className="relative group">
            <img
              src={previewUrl}
              alt="Preview"
              className="h-16 w-16 object-cover rounded-md border"
            />
            <button
              onClick={removeSelectedImage}
              className="absolute -top-1.5 -right-1.5 bg-destructive text-white rounded-full p-0.5 shadow-sm hover:scale-110 transition-transform"
              title="Xóa ảnh"
            >
              <X className="size-3.5" />
            </button>
          </div>
          <span className="text-xs text-muted-foreground truncate max-w-[200px]">
            {selectedFile?.name}
          </span>
        </div>
      )}

      {/* Input bar */}
      <div className="flex items-center gap-2 p-3 min-h-[56px]">
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageSelect}
          className="hidden"
        />

        <Button
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="hover:bg-primary/10 transition-smooth"
          title="Chọn hình ảnh"
        >
          <ImagePlus className="size-4 text-muted-foreground hover:text-primary" />
        </Button>

        <div className="flex-1 relative">
          <Input
            onKeyDown={handleKeyPress}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={selectedFile ? "Viết chú thích cho ảnh..." : "Soạn tin nhắn..."}
            disabled={isUploading}
            className="pr-10 h-9 bg-white border-border/50 focus:border-primary/50 transition-smooth resize-none"
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="size-8 hover:bg-primary/10 transition-smooth"
            >
              <div>
                <EmojiPicker
                  onChange={(emoji: string) => setValue(`${value}${emoji}`)}
                />
              </div>
            </Button>
          </div>
        </div>

        <Button
          onClick={sendMessage}
          className="bg-gradient-chat hover:shadow-glow transition-smooth hover:scale-105"
          disabled={(!value.trim() && !selectedFile) || isUploading}
        >
          {isUploading ? (
            <Loader2 className="size-4 animate-spin text-white" />
          ) : (
            <Send className="size-4 text-white" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default MessageInput;

import { cn } from "@/lib/utils";
import type { ChatMessage as ChatMessageType } from "@/lib/conversation";

interface ChatMessageProps {
  message: ChatMessageType;
  isRTL: boolean;
}

export function ChatMessage({ message, isRTL }: ChatMessageProps) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  if (isSystem) {
    return (
      <div className="flex justify-center px-4 py-2">
        <div className="max-w-md rounded-lg bg-muted/50 px-4 py-2 text-center text-sm text-muted-foreground">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex w-full px-4 py-2",
        isUser ? (isRTL ? "justify-start" : "justify-end") : (isRTL ? "justify-end" : "justify-start")
      )}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-card border border-border shadow-card"
        )}
        dir={isRTL ? "rtl" : "ltr"}
      >
        {/* Avatar for assistant */}
        {!isUser && (
          <div className="mb-2 flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              R
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              {isRTL ? "רוטרי קונקט" : "Rotary Connect"}
            </span>
          </div>
        )}

        {/* Message content with proper text direction */}
        <div
          className={cn(
            "whitespace-pre-wrap select-text",
            isRTL ? "text-right" : "text-left"
          )}
        >
          {message.content}
        </div>

        {/* Timestamp */}
        <div
          className={cn(
            "mt-1.5 text-[11px] opacity-60",
            isUser ? "text-primary-foreground/70" : "text-muted-foreground"
          )}
        >
          {new Date(message.timestamp).toLocaleTimeString(isRTL ? "he-IL" : "en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
}

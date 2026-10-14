import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { ChatMessage as ChatMessageType, QuickReply } from "@/lib/conversation";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { TypingIndicator } from "./TypingIndicator";
import { QuickReplies } from "./QuickReplies";

interface ChatContainerProps {
  messages: ChatMessageType[];
  quickReplies: QuickReply[];
  onSendMessage: (message: string) => void;
  onQuickReplySelect: (reply: QuickReply) => void;
  isLoading?: boolean;
  disabled?: boolean;
  isRTL: boolean;
  placeholder?: string;
  className?: string;
}

export function ChatContainer({
  messages,
  quickReplies,
  onSendMessage,
  onQuickReplySelect,
  isLoading,
  disabled,
  isRTL,
  placeholder,
  className,
}: ChatContainerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const isUserScrolling = useRef(false);

  // Auto-scroll to bottom on new messages, but respect user scrolling
  useEffect(() => {
    if (!isUserScrolling.current && lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  // Track if user is scrolling
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isAtBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 100;
    isUserScrolling.current = !isAtBottom;
  };

  return (
    <div className={cn("flex h-full flex-col bg-background", className)}>
      {/* Messages area - scrollable */}
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto"
        onScroll={handleScroll}
      >
        <div className="py-4">
          {messages.map((message, index) => (
            <div
              key={message.id}
              ref={index === messages.length - 1 ? lastMessageRef : undefined}
            >
              <ChatMessage message={message} isRTL={isRTL} />
            </div>
          ))}

          {/* Typing indicator */}
          {isLoading && <TypingIndicator isRTL={isRTL} />}

          {/* Quick replies - show at the bottom of messages */}
          {!isLoading && quickReplies.length > 0 && (
            <div ref={messages.length === 0 ? lastMessageRef : undefined}>
              <QuickReplies
                replies={quickReplies}
                onSelect={onQuickReplySelect}
                isRTL={isRTL}
                disabled={disabled}
              />
            </div>
          )}
        </div>
      </div>

      {/* Input area - fixed at bottom, never moves */}
      <div className="shrink-0">
        <ChatInput
          onSend={onSendMessage}
          disabled={disabled}
          isLoading={isLoading}
          isRTL={isRTL}
          placeholder={placeholder}
          autoFocus
        />
      </div>
    </div>
  );
}

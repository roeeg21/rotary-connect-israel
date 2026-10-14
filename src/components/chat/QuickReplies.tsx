import { cn } from "@/lib/utils";
import type { QuickReply } from "@/lib/conversation";

interface QuickRepliesProps {
  replies: QuickReply[];
  onSelect: (reply: QuickReply) => void;
  isRTL: boolean;
  disabled?: boolean;
}

export function QuickReplies({ replies, onSelect, isRTL, disabled }: QuickRepliesProps) {
  if (!replies.length) return null;

  return (
    <div
      className={cn(
        "flex flex-wrap gap-2 px-4 py-2",
        isRTL ? "justify-end" : "justify-start"
      )}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {replies.map((reply) => (
        <button
          key={reply.id}
          type="button"
          onClick={() => onSelect(reply)}
          disabled={disabled}
          className={cn(
            "rounded-full border border-primary bg-primary-soft px-4 py-2 text-sm font-medium text-primary",
            "transition-all duration-200",
            "hover:bg-primary hover:text-primary-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
        >
          {reply.label}
        </button>
      ))}
    </div>
  );
}

import { useCallback, useRef, useState } from "react";
import { ArrowUp, Loader2, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
  isRTL: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  disabled,
  isLoading,
  isRTL,
  placeholder,
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled || isLoading) return;
    onSend(trimmed);
    setValue("");

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value, disabled, isLoading, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Enter to send, Shift+Enter for new line
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);

    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  }, []);

  const defaultPlaceholder = isRTL
    ? "הקלידו את התשובה שלכם..."
    : "Type your answer...";

  return (
    <div className="border-t border-border bg-card px-4 py-3">
      <div
        className={cn(
          "flex items-end gap-2 rounded-2xl border border-border bg-surface px-3 py-2",
          "transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10"
        )}
        dir={isRTL ? "rtl" : "ltr"}
      >
        {/* Attachment button (future feature) */}
        {/* <button
          type="button"
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          disabled={disabled}
        >
          <Paperclip className="size-5" />
        </button> */}

        {/* Text input */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled || isLoading}
          placeholder={placeholder || defaultPlaceholder}
          rows={1}
          className={cn(
            "max-h-40 min-h-[44px] flex-1 resize-none bg-transparent py-2 text-[15px] leading-relaxed outline-none",
            "placeholder:text-muted-foreground",
            "disabled:cursor-not-allowed disabled:opacity-60",
            isRTL ? "text-right" : "text-left"
          )}
          style={{ direction: isRTL ? "rtl" : "ltr" }}
        />

        {/* Send button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!value.trim() || disabled || isLoading}
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full",
            "bg-primary text-primary-foreground",
            "transition-all duration-200",
            "hover:bg-primary/90 hover:shadow-raised",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
          )}
          aria-label={isRTL ? "שליחה" : "Send"}
        >
          {isLoading ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <ArrowUp className="size-5" />
          )}
        </button>
      </div>

      {/* Helper text */}
      <p className="mt-2 text-center text-xs text-muted-foreground">
        {isRTL
          ? "Enter לשליחה · Shift+Enter לשורה חדשה"
          : "Enter to send · Shift+Enter for new line"}
      </p>
    </div>
  );
}

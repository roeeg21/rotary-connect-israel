import { cn } from "@/lib/utils";

interface TypingIndicatorProps {
  isRTL: boolean;
}

export function TypingIndicator({ isRTL }: TypingIndicatorProps) {
  return (
    <div
      className={cn(
        "flex w-full px-4 py-2",
        isRTL ? "justify-end" : "justify-start"
      )}
    >
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 shadow-card">
        {/* Avatar */}
        <div className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
          R
        </div>

        {/* Animated dots */}
        <div className="flex items-center gap-1">
          <span
            className="size-2 animate-pulse rounded-full bg-muted-foreground"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="size-2 animate-pulse rounded-full bg-muted-foreground"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="size-2 animate-pulse rounded-full bg-muted-foreground"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    </div>
  );
}

import { cn } from "@/lib/utils";

export function Tag({
  children,
  tone = "default",
  className,
}: {
  children: React.ReactNode;
  tone?: "default" | "gold" | "outline" | "primary";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium leading-none transition-colors",
        tone === "default" && "bg-secondary text-secondary-foreground",
        tone === "gold" && "bg-gold-soft text-gold-foreground",
        tone === "outline" && "border border-border text-muted-foreground hover:bg-secondary",
        tone === "primary" && "bg-primary-soft text-primary",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function MetaRow({ items }: { items: (string | undefined)[] }) {
  const list = items.filter(Boolean) as string[];
  return (
    <p className="text-sm text-muted-foreground">
      {list.map((item, i) => (
        <span key={item + i}>
          {i > 0 && <span className="mx-1.5 text-border-strong">·</span>}
          {item}
        </span>
      ))}
    </p>
  );
}

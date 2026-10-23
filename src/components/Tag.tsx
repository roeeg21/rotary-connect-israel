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
        "inline-flex items-center rounded-full px-3 py-1.5 text-[11px] font-semibold leading-none tracking-tight transition-all",
        tone === "default" && "bg-secondary text-secondary-foreground",
        tone === "gold" && "bg-gold-soft text-gold-foreground border border-gold/20",
        tone === "outline" && "border border-border text-muted-foreground hover:bg-secondary hover:text-foreground",
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
          {i > 0 && <span className="mx-2 text-border-strong">·</span>}
          {item}
        </span>
      ))}
    </p>
  );
}

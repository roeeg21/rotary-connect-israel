import { cn } from "@/lib/utils";

export function Tag({
  children,
  tone = "default",
  className,
}: {
  children: React.ReactNode;
  tone?: "default" | "gold" | "outline";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-1 text-xs leading-none font-medium",
        tone === "default" && "bg-secondary text-secondary-foreground",
        tone === "gold" && "bg-gold-soft text-gold-foreground",
        tone === "outline" && "border border-border text-muted-foreground",
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
    <p className="text-muted-foreground text-sm">
      {list.map((item, i) => (
        <span key={item + i}>
          {i > 0 && <span className="mx-1.5 opacity-50">·</span>}
          {item}
        </span>
      ))}
    </p>
  );
}

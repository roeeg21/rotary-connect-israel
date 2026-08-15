import { cn } from "@/lib/utils";

const TONES = [
  "bg-primary-soft text-primary",
  "bg-gold-soft text-gold-foreground",
  "bg-secondary text-secondary-foreground",
  "bg-accent text-accent-foreground",
];

function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]).join("");
}

export function PersonAvatar({
  name,
  photo,
  size = "md",
  className,
}: {
  name: string;
  photo?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const dims = {
    sm: "size-9 text-xs",
    md: "size-12 text-sm",
    lg: "size-16 text-lg",
    xl: "size-24 text-2xl",
  }[size];
  const tone = TONES[name.length % TONES.length];

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border font-heading font-semibold select-none",
        dims,
        !photo && tone,
        className,
      )}
      aria-hidden={!!photo}
    >
      {photo ? (
        <img src={photo} alt={name} className="h-full w-full object-cover" loading="lazy" />
      ) : (
        initials(name)
      )}
    </span>
  );
}

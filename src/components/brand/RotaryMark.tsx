export function RotaryWheel({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <img
      src="/app_logo.png"
      alt="Rotary"
      className={className}
    />
  );
}

export function Logo({
  size = "md",
  subtitle = true,
}: {
  size?: "sm" | "md" | "lg";
  subtitle?: boolean;
}) {
  const wheel = size === "lg" ? "h-9 w-9" : size === "sm" ? "h-6 w-6" : "h-7 w-7";
  const title = size === "lg" ? "text-xl" : size === "sm" ? "text-sm" : "text-base";
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="shrink-0">
        <RotaryWheel className={wheel} />
      </span>
      <span className="flex flex-col leading-none">
        <span className={`font-heading font-bold tracking-tight text-primary ${title}`}>
          Rotary Connect
        </span>
        {subtitle && (
          <span className="mt-1 text-[11px] font-medium tracking-wide text-muted-foreground">
            Israel · District 2490
          </span>
        )}
      </span>
    </span>
  );
}

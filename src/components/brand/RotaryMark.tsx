export function RotaryWheel({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      role="img"
      aria-label="Rotary"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g fill="currentColor">
        {Array.from({ length: 24 }).map((_, i) => (
          <rect
            key={i}
            x="23.1"
            y="1.5"
            width="1.8"
            height="5"
            rx="0.6"
            transform={`rotate(${i * 15} 24 24)`}
          />
        ))}
      </g>
      <circle cx="24" cy="24" r="17.2" stroke="currentColor" strokeWidth="2.6" />
      <circle cx="24" cy="24" r="6.4" stroke="currentColor" strokeWidth="2.6" />
      <g stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
        <path d="M24 17.6V6.9" />
        <path d="M24 30.4v10.7" />
        <path d="M17.6 24H6.9" />
        <path d="M30.4 24h10.7" />
      </g>
      <rect x="22.6" y="21.4" width="2.8" height="6.6" rx="1.2" fill="currentColor" />
    </svg>
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
      <span className="text-gold shrink-0">
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

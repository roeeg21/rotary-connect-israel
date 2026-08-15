import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState, type FormEvent } from "react";

import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function SearchField({
  defaultValue = "",
  size = "lg",
  autoFocus = false,
}: {
  defaultValue?: string;
  size?: "md" | "lg";
  autoFocus?: boolean;
}) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [value, setValue] = useState(defaultValue);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const q = value.trim();
    if (!q) return;
    void navigate({ to: "/search", search: { q } });
  }

  return (
    <form onSubmit={onSubmit} role="search" className="relative w-full">
      <Search
        className="text-muted-foreground pointer-events-none absolute top-1/2 size-5 -translate-y-1/2 start-4"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t("searchPlaceholder")}
        aria-label={t("searchPlaceholder")}
        className={cn(
          "bg-card focus:border-primary w-full rounded-lg border border-border ps-12 pe-4 text-[15px] shadow-card transition-colors outline-none placeholder:text-muted-foreground",
          size === "lg" ? "h-14" : "h-11",
        )}
      />
    </form>
  );
}

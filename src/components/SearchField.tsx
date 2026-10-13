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
  const [isFocused, setIsFocused] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const q = value.trim();
    if (!q) return;
    void navigate({ to: "/search", search: { q } });
  }

  return (
    <form onSubmit={onSubmit} role="search" className="relative w-full">
      <Search
        className={cn(
          "pointer-events-none absolute top-1/2 -translate-y-1/2 transition-colors duration-200 start-4",
          isFocused ? "text-primary" : "text-muted-foreground",
          size === "lg" ? "size-5" : "size-4",
        )}
        strokeWidth={1.8}
        aria-hidden
      />
      <input
        type="search"
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={t("searchPlaceholder")}
        aria-label={t("searchPlaceholder")}
        className={cn(
          "w-full rounded-xl border bg-card text-[15px] shadow-card transition-all duration-200 outline-none placeholder:text-muted-foreground",
          "focus:border-primary focus:shadow-raised focus:ring-4 focus:ring-primary/10",
          size === "lg" ? "h-14 ps-12 pe-4" : "h-11 ps-10 pe-4",
        )}
      />
    </form>
  );
}

import { Link, useRouterState } from "@tanstack/react-router";
import { Bookmark, Compass, Search, User } from "lucide-react";

import { Logo } from "@/components/brand/RotaryMark";
import { PersonAvatar } from "@/components/PersonAvatar";
import { useAppState } from "@/lib/app-state";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const navItems = [
  { to: "/", key: "navSearch", icon: Search },
  { to: "/network", key: "navNetwork", icon: Compass },
  { to: "/saved", key: "navSaved", icon: Bookmark },
  { to: "/me", key: "navMe", icon: User },
] as const;

function LanguageToggle() {
  const { lang, setLang } = useI18n();
  return (
    <div
      className="inline-flex items-center rounded-md border border-border p-0.5"
      role="group"
      aria-label="Language"
    >
      {(["he", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={cn(
            "rounded-[5px] px-2 py-1 text-xs font-semibold transition-colors",
            lang === l
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {l === "he" ? "עב" : "EN"}
        </button>
      ))}
    </div>
  );
}

export function AppHeader() {
  const { t, lang } = useI18n();
  const { account } = useAppState();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header className="bg-background/90 sticky top-0 z-40 border-b border-border backdrop-blur">
      <div className="container-app flex h-16 items-center justify-between gap-4">
        <Link to="/" aria-label="Rotary Connect Israel">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t(item.key)}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageToggle />
          {account ? (
            <Link to="/me" aria-label={t("myProfile")}>
              <PersonAvatar name={`${account.firstName} ${account.lastName}`} size="sm" />
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-muted-foreground hover:text-foreground hidden rounded-md px-3 py-2 text-sm font-medium sm:inline-flex"
              >
                {t("signIn")}
              </Link>
              <Link
                to="/register"
                className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold transition-colors"
              >
                {lang === "he" ? "הרשמה" : "Join"}
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, Bookmark, Compass, MessageCircle, Search, User } from "lucide-react";

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
      className="inline-flex items-center gap-0.5 rounded-full bg-secondary p-0.5"
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
            "rounded-full px-2.5 py-1 text-xs font-medium transition-all duration-200",
            lang === l
              ? "bg-card text-foreground shadow-xs"
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
    <header className="glass sticky top-0 z-40 border-b border-border">
      <div className="container-wide flex h-14 items-center justify-between gap-6">
        {/* Logo */}
        <Link to="/" className="transition-opacity hover:opacity-80" aria-label="Rotary Connect Israel">
          <Logo size="sm" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
                )}
              >
                <Icon className="size-4" strokeWidth={active ? 2.2 : 1.8} aria-hidden />
                <span>{t(item.key)}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          <LanguageToggle />

          {account ? (
            <div className="flex items-center gap-2">
              {/* Notifications - hidden on mobile */}
              <button
                type="button"
                className="hidden rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground md:flex"
                aria-label="Notifications"
              >
                <Bell className="size-5" strokeWidth={1.8} />
              </button>

              {/* Messages - hidden on mobile */}
              <button
                type="button"
                className="hidden rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground md:flex"
                aria-label="Messages"
              >
                <MessageCircle className="size-5" strokeWidth={1.8} />
              </button>

              {/* Profile */}
              <Link
                to="/me"
                className="rounded-full ring-2 ring-transparent transition-all hover:ring-primary/20"
                aria-label={t("myProfile")}
              >
                <PersonAvatar name={`${account.firstName} ${account.lastName}`} size="sm" />
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="hidden rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
              >
                {t("signIn")}
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all duration-200 hover:bg-primary/90 hover:shadow-raised"
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

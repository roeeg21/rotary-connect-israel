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
      className="inline-flex items-center gap-0.5 rounded-full bg-secondary/80 p-0.5"
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
            "btn-press rounded-full px-2.5 py-1.5 text-xs font-medium transition-all",
            lang === l
              ? "bg-card text-foreground shadow-sm"
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
    <header className="sticky top-0 z-40 border-b border-border/30 bg-white/80 backdrop-blur-xl backdrop-saturate-150">
      <div className="container-wide flex h-[72px] items-center justify-between gap-6">
        {/* Logo */}
        <Link
          to="/"
          className="transition-all duration-200 hover:opacity-70 active:scale-95"
          aria-label="Rotary Connect Israel"
        >
          <Logo size="sm" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-2 md:flex">
          {navItems.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "relative flex items-center gap-2.5 rounded-xl px-5 py-3 text-sm font-semibold transition-all duration-200",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                <Icon className="size-[18px]" strokeWidth={active ? 2.2 : 1.75} aria-hidden />
                <span>{t(item.key)}</span>
                {active && (
                  <span className="absolute -bottom-[1px] start-4 end-4 h-0.5 rounded-full bg-primary" />
                )}
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
                className="hidden size-11 items-center justify-center rounded-xl text-muted-foreground transition-all duration-200 hover:bg-secondary hover:text-foreground md:flex"
                aria-label="Notifications"
              >
                <Bell className="size-5" strokeWidth={1.75} />
              </button>

              {/* Messages - hidden on mobile */}
              <button
                type="button"
                className="hidden size-11 items-center justify-center rounded-xl text-muted-foreground transition-all duration-200 hover:bg-secondary hover:text-foreground md:flex"
                aria-label="Messages"
              >
                <MessageCircle className="size-5" strokeWidth={1.75} />
              </button>

              {/* Profile */}
              <Link
                to="/me"
                className="rounded-full ring-2 ring-transparent transition-all duration-200 hover:ring-primary/30 hover:ring-offset-2"
                aria-label={t("myProfile")}
              >
                <PersonAvatar name={`${account.firstName} ${account.lastName}`} size="sm" />
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="hidden rounded-xl px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-all duration-200 hover:text-foreground sm:inline-flex"
              >
                {t("signIn")}
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center rounded-xl bg-gradient-to-r from-primary to-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-all duration-200 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:scale-95"
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

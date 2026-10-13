import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Bookmark, Briefcase, Building2, Clock, MapPin, Sparkles, Users, X } from "lucide-react";

import { RotaryWheel } from "@/components/brand/RotaryMark";
import { MemberCard } from "@/components/MemberCard";
import { SearchField } from "@/components/SearchField";
import { members, memberById } from "@/data/members";
import { useAppState } from "@/lib/app-state";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Rotary Connect Israel — הקשרים של רוטרי, בחיפוש אחד" },
      {
        name: "description",
        content:
          "חיפוש חברי רוטרי ישראל לפי מקצוע, חברה, תחום מומחיות, מועדון או עיר. רשת מקצועית פרטית ומאומתת.",
      },
      { property: "og:title", content: "Rotary Connect Israel" },
      {
        property: "og:description",
        content: "Search the Rotary Israel network by profession, company, expertise or club.",
      },
    ],
  }),
  component: Home,
});

const SUGGESTIONS: { he: string; en: string }[] = [
  { he: "עורך דין", en: "Lawyer" },
  { he: "בריאות", en: "Healthcare" },
  { he: "טכנולוגיה", en: "Technology" },
  { he: "השקעות", en: "Investments" },
  { he: "עסקים בינלאומיים", en: "International Business" },
  { he: "סייבר", en: "Cybersecurity" },
];

const CATEGORIES = [
  { key: "industries", icon: Building2 },
  { key: "professions", icon: Briefcase },
  { key: "locations", icon: MapPin },
] as const;

function SidebarCard({
  title,
  icon,
  children,
  className,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-5 shadow-card", className)}>
      <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {icon}
        {title}
      </h3>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Home() {
  const { t, lang, dir } = useI18n();
  const navigate = useNavigate();
  const { account, recentSearches, recentlyViewed, saved: savedIds, clearRecentSearches, isGuest } =
    useAppState();
  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;

  const viewed = recentlyViewed.map(memberById).filter(Boolean).slice(0, 3);
  const savedMembers = savedIds.map(memberById).filter(Boolean).slice(0, 3);
  const suggested = members.filter((m) => m.isNew).slice(0, 4);

  return (
    <div className="container-wide py-8 lg:py-12">
      <div className="grid gap-6 lg:grid-cols-[280px_1fr_320px] lg:gap-8">
        {/* Left Sidebar - Desktop Only */}
        <aside className="hidden space-y-5 lg:block">
          {/* Profile Card */}
          {account ? (
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
              <div className="h-16 bg-gradient-to-r from-primary/10 to-primary/5" />
              <div className="-mt-8 px-5 pb-5">
                <div className="flex size-16 items-center justify-center rounded-full border-4 border-card bg-secondary text-xl font-semibold">
                  {account.firstName.charAt(0)}
                  {account.lastName.charAt(0)}
                </div>
                <h3 className="mt-3 font-semibold">
                  {account.firstName} {account.lastName}
                </h3>
                <p className="text-sm text-muted-foreground">{account.club}</p>
                <Link
                  to="/me"
                  className="mt-4 flex w-full items-center justify-center rounded-lg border border-border py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                >
                  {t("myProfile")}
                </Link>
              </div>
            </div>
          ) : (
            <SidebarCard
              title={lang === "he" ? "הצטרפו לרשת" : "Join the Network"}
              icon={<RotaryWheel className="size-4 text-gold" />}
            >
              <p className="text-sm text-muted-foreground">{t("guestOneSearch")}</p>
              <Link
                to="/register"
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {t("createAccount")}
                <Arrow className="size-4" aria-hidden />
              </Link>
            </SidebarCard>
          )}

          {/* Quick Links */}
          <SidebarCard title={t("exploreTitle")} icon={<Users className="size-3.5" />}>
            <nav className="space-y-1">
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat.key}
                  to="/network"
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-secondary"
                >
                  <cat.icon className="size-4 text-muted-foreground" strokeWidth={1.8} aria-hidden />
                  <span>{t(cat.key)}</span>
                </Link>
              ))}
            </nav>
          </SidebarCard>

          {/* Saved Members - if any */}
          {savedMembers.length > 0 && (
            <SidebarCard title={t("saved")} icon={<Bookmark className="size-3.5" />}>
              <ul className="space-y-3">
                {savedMembers.map(
                  (m) =>
                    m && (
                      <li key={m.id}>
                        <Link
                          to="/profile/$id"
                          params={{ id: m.id }}
                          className="flex items-center gap-3 text-sm hover:text-primary"
                        >
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium">
                            {m.name[lang].charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium">{m.name[lang]}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {m.company}
                            </p>
                          </div>
                        </Link>
                      </li>
                    ),
                )}
              </ul>
              <Link
                to="/saved"
                className="mt-4 block text-center text-sm font-medium text-primary hover:underline"
              >
                {t("savedTitle")} →
              </Link>
            </SidebarCard>
          )}
        </aside>

        {/* Main Content */}
        <main className="min-w-0">
          {/* Hero Section */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card sm:p-8">
            <p className="flex items-center gap-2 text-sm font-semibold text-gold-foreground">
              <RotaryWheel className="size-5 text-gold" />
              {t("tagline")}
            </p>
            <h1 className="mt-3 text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
              {t("homeQuestion")}
            </h1>

            <div className="mt-6">
              <SearchField />
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">{t("try")}</span>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.en}
                  type="button"
                  onClick={() => void navigate({ to: "/search", search: { q: s[lang] } })}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-[13px] font-medium transition-all hover:border-border-strong hover:bg-secondary"
                >
                  {s[lang]}
                </button>
              ))}
            </div>
          </section>

          {/* CTA Banner for Guests - Mobile & Tablet */}
          {isGuest && (
            <section className="mt-6 overflow-hidden rounded-xl bg-primary p-5 text-primary-foreground shadow-raised lg:hidden">
              <div className="flex items-start gap-4">
                <RotaryWheel className="mt-0.5 size-10 shrink-0 text-gold" />
                <div className="flex-1">
                  <p className="text-base font-bold">
                    {lang === "he" ? "הצטרפו לרשת של רוטרי ישראל" : "Join the Rotary Israel network"}
                  </p>
                  <p className="mt-1 text-sm opacity-90">{t("guestOneSearch")}</p>
                  <Link
                    to="/register"
                    className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-gold px-4 py-2.5 text-sm font-bold text-gold-foreground transition-opacity hover:opacity-90"
                  >
                    {t("createAccount")}
                    <Arrow className="size-4" aria-hidden />
                  </Link>
                </div>
              </div>
            </section>
          )}

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <section className="mt-6 rounded-xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Clock className="size-3.5" aria-hidden />
                  {t("recentSearches")}
                </h2>
                <button
                  type="button"
                  onClick={clearRecentSearches}
                  className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <X className="size-4" aria-hidden />
                  <span className="sr-only">{t("clearFilters")}</span>
                </button>
              </div>
              <ul className="mt-4 divide-y divide-border">
                {recentSearches.slice(0, 5).map((q) => (
                  <li key={q}>
                    <Link
                      to="/search"
                      search={{ q }}
                      className="flex items-center justify-between py-3 text-sm transition-colors hover:text-primary"
                    >
                      {q}
                      <Arrow className="size-4 text-muted-foreground" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Recently Viewed */}
          {viewed.length > 0 && (
            <section className="mt-6">
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("recentlyViewed")}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {viewed.map((m) => m && <MemberCard key={m.id} member={m} compact />)}
              </div>
            </section>
          )}

          {/* New to Network */}
          <section className="mt-6">
            <h2 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Sparkles className="size-3.5" aria-hidden />
              {t("newToNetwork")}
            </h2>
            {suggested.length > 0 ? (
              <div className="grid gap-4">
                {suggested.map((m) => (
                  <MemberCard key={m.id} member={m} />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-card p-6 text-center shadow-card">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-secondary">
                  <Users className="size-6 text-muted-foreground" />
                </div>
                <p className="mt-4 font-medium">{t("networkEmpty")}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t("networkEmptyHint")}</p>
              </div>
            )}
          </section>
        </main>

        {/* Right Sidebar - Desktop Only */}
        <aside className="hidden space-y-5 lg:block">
          {/* Suggested Connections */}
          <SidebarCard
            title={t("suggested")}
            icon={<Sparkles className="size-3.5" />}
          >
            <ul className="space-y-4">
              {members.slice(0, 4).map((m) => (
                <li key={m.id}>
                  <Link
                    to="/profile/$id"
                    params={{ id: m.id }}
                    className="group flex items-start gap-3"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-medium">
                      {m.name[lang].charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium group-hover:text-primary">
                        {m.name[lang]}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {m.position[lang]}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-primary/80">
                        {m.clubName[lang]}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              to="/network"
              className="mt-5 block text-center text-sm font-medium text-primary hover:underline"
            >
              {t("navNetwork")} →
            </Link>
          </SidebarCard>

        </aside>
      </div>
    </div>
  );
}

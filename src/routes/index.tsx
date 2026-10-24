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
    <div className={cn("rounded-2xl border border-border/50 bg-card p-6 shadow-lg", className)}>
      <h3 className="flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80">
        {icon}
        {title}
      </h3>
      <div className="mt-5">{children}</div>
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
      <div className="grid gap-6 lg:grid-cols-[280px_1fr_300px] lg:gap-10">
        {/* Left Sidebar - Desktop Only */}
        <aside className="hidden space-y-5 lg:block">
          {/* Profile Card */}
          {account ? (
            <div className="card-premium overflow-hidden">
              <div className="h-20 bg-gradient-to-br from-primary/12 via-primary/8 to-gold/6" />
              <div className="-mt-10 px-5 pb-5">
                <div className="flex size-20 items-center justify-center rounded-full border-4 border-card bg-secondary text-xl font-semibold shadow-sm">
                  {account.firstName.charAt(0)}
                  {account.lastName.charAt(0)}
                </div>
                <h3 className="mt-3 text-base font-semibold tracking-tight">
                  {account.firstName} {account.lastName}
                </h3>
                <p className="text-sm text-muted-foreground">{account.club}</p>
                <Link
                  to="/me"
                  className="btn-press mt-4 flex w-full items-center justify-center rounded-lg border border-border py-2.5 text-sm font-medium text-foreground transition-all hover:bg-secondary hover:border-border-strong"
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
              <p className="text-sm leading-relaxed text-muted-foreground">{t("guestOneSearch")}</p>
              <Link
                to="/register-form"
                className="btn-press mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-[var(--primary-hover)] hover:shadow-raised"
              >
                {t("createAccount")}
                <Arrow className="size-4" aria-hidden />
              </Link>
            </SidebarCard>
          )}

          {/* Quick Links */}
          <SidebarCard title={t("exploreTitle")} icon={<Users className="size-3.5" />}>
            <nav className="space-y-0.5">
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat.key}
                  to="/network"
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:bg-secondary active:scale-[0.98]"
                >
                  <cat.icon className="size-[18px] text-muted-foreground" strokeWidth={1.75} aria-hidden />
                  <span>{t(cat.key)}</span>
                </Link>
              ))}
            </nav>
          </SidebarCard>

          {/* Saved Members - if any */}
          {savedMembers.length > 0 && (
            <SidebarCard title={t("saved")} icon={<Bookmark className="size-3.5" />}>
              <ul className="space-y-2">
                {savedMembers.map(
                  (m) =>
                    m && (
                      <li key={m.id}>
                        <Link
                          to="/profile/$id"
                          params={{ id: m.id }}
                          className="group flex items-center gap-3 rounded-lg p-2 -m-2 text-sm transition-colors hover:bg-secondary/50"
                        >
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold transition-transform group-hover:scale-105">
                            {m.name[lang].charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold tracking-tight transition-colors group-hover:text-primary">{m.name[lang]}</p>
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
                className="mt-5 flex items-center justify-center gap-1 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
              >
                {t("savedTitle")}
                <Arrow className="size-4" aria-hidden />
              </Link>
            </SidebarCard>
          )}
        </aside>

        {/* Main Content */}
        <main className="min-w-0">
          {/* Hero Section */}
          <section className="relative overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-br from-white via-white to-primary/[0.03] p-8 shadow-xl sm:p-10">
            {/* Decorative gradient orb */}
            <div className="pointer-events-none absolute -top-24 -end-24 size-48 rounded-full bg-gradient-to-br from-primary/20 to-gold/20 blur-3xl" />

            <div className="relative">
              <p className="flex items-center gap-2.5 text-sm font-bold">
                <RotaryWheel className="size-6 text-gold drop-shadow-sm" />
                <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{t("tagline")}</span>
              </p>

              <div className="mt-6">
                <SearchField />
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-2.5">
                <span className="text-xs font-semibold text-muted-foreground">{t("try")}</span>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.en}
                    type="button"
                    onClick={() => void navigate({ to: "/search", search: { q: s[lang] } })}
                    className="rounded-full border border-border/60 bg-white px-4 py-2 text-[13px] font-semibold shadow-sm transition-all duration-200 hover:border-primary/30 hover:bg-primary/5 hover:shadow-md active:scale-95"
                  >
                    {s[lang]}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* CTA Banner for Guests - Mobile & Tablet */}
          {isGuest && (
            <section className="mt-8 overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-blue-700 p-7 text-white shadow-2xl lg:hidden">
              <div className="flex items-start gap-5">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm shadow-inner">
                  <RotaryWheel className="size-8 text-gold drop-shadow" />
                </div>
                <div className="flex-1">
                  <p className="text-xl font-extrabold tracking-tight">
                    {lang === "he" ? "הצטרפו לרשת של רוטרי ישראל" : "Join the Rotary Israel network"}
                  </p>
                  <p className="mt-2 text-sm font-medium text-white/80 leading-relaxed">{t("guestOneSearch")}</p>
                  <Link
                    to="/register-form"
                    className="mt-6 inline-flex items-center justify-center gap-2.5 rounded-xl bg-gold px-6 py-3.5 text-sm font-extrabold text-black shadow-lg transition-all duration-200 hover:bg-yellow-400 hover:shadow-xl active:scale-95"
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
            <section className="card-premium mt-6 p-5">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <Clock className="size-3.5" aria-hidden />
                  {t("recentSearches")}
                </h2>
                <button
                  type="button"
                  onClick={clearRecentSearches}
                  className="btn-press size-8 flex items-center justify-center rounded-full text-muted-foreground transition-all hover:bg-secondary hover:text-foreground"
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
                      className="flex items-center justify-between py-3.5 text-sm font-medium transition-all hover:text-primary"
                    >
                      {q}
                      <Arrow className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Recently Viewed */}
          {viewed.length > 0 && (
            <section className="mt-8">
              <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t("recentlyViewed")}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {viewed.map((m) => m && <MemberCard key={m.id} member={m} compact />)}
              </div>
            </section>
          )}

          {/* New to Network */}
          <section className="mt-8">
            <h2 className="mb-5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
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
              <div className="card-premium p-8 text-center">
                <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-secondary">
                  <Users className="size-7 text-muted-foreground" strokeWidth={1.5} />
                </div>
                <p className="mt-5 text-base font-semibold">{t("networkEmpty")}</p>
                <p className="mt-2 text-sm text-muted-foreground">{t("networkEmptyHint")}</p>
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
                    className="group flex items-start gap-3 rounded-lg p-2 -m-2 transition-colors hover:bg-secondary/50"
                  >
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold transition-transform group-hover:scale-105">
                      {m.name[lang].charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <p className="truncate text-sm font-semibold tracking-tight transition-colors group-hover:text-primary">
                        {m.name[lang]}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {m.position[lang]}
                      </p>
                      <p className="mt-0.5 truncate text-xs font-medium text-primary/70">
                        {m.clubName[lang]}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              to="/network"
              className="mt-6 flex items-center justify-center gap-1 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
            >
              {t("navNetwork")}
              <Arrow className="size-4" aria-hidden />
            </Link>
          </SidebarCard>
        </aside>
      </div>
    </div>
  );
}

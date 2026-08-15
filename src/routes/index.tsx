import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Clock, Sparkles, X } from "lucide-react";

import { RotaryWheel } from "@/components/brand/RotaryMark";
import { MemberCard } from "@/components/MemberCard";
import { SearchField } from "@/components/SearchField";
import { members, memberById } from "@/data/members";
import { useAppState } from "@/lib/app-state";
import { useI18n } from "@/lib/i18n";

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

function Home() {
  const { t, lang, dir } = useI18n();
  const navigate = useNavigate();
  const { recentSearches, recentlyViewed, clearRecentSearches, isGuest } = useAppState();
  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;

  const viewed = recentlyViewed.map(memberById).filter(Boolean).slice(0, 4);
  const suggested = members.filter((m) => m.isNew).slice(0, 3);

  return (
    <div className="container-app py-10 sm:py-14">
      <section className="mx-auto max-w-2xl">
        <p className="text-gold-foreground flex items-center gap-2 text-sm font-semibold">
          <RotaryWheel className="text-gold h-5 w-5" />
          {t("tagline")}
        </p>
        <h1 className="mt-3 font-heading text-2xl leading-tight font-bold sm:text-[32px]">
          {t("homeQuestion")}
        </h1>

        <div className="mt-5">
          <SearchField />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-xs font-semibold">{t("try")}</span>
          {SUGGESTIONS.map((s) => (
            <button
              key={s.en}
              type="button"
              onClick={() => void navigate({ to: "/search", search: { q: s[lang] } })}
              className="bg-card hover:border-border-strong rounded-md border border-border px-2.5 py-1.5 text-[13px] font-medium transition-colors"
            >
              {s[lang]}
            </button>
          ))}
        </div>

        {isGuest && (
          <div className="bg-primary text-primary-foreground mt-8 flex flex-col gap-4 rounded-lg p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <RotaryWheel className="text-gold mt-0.5 h-8 w-8 shrink-0" />
              <div>
                <p className="font-heading text-base font-bold">
                  {lang === "he"
                    ? "הצטרפו לרשת של רוטרי ישראל"
                    : "Join the Rotary Israel network"}
                </p>
                <p className="mt-1 text-sm opacity-85">{t("guestOneSearch")}</p>
              </div>
            </div>
            <Link
              to="/register"
              className="bg-gold text-gold-foreground inline-flex shrink-0 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-bold transition-opacity hover:opacity-90"
            >
              {t("createAccount")}
              <Arrow className="size-4" aria-hidden />
            </Link>
          </div>
        )}
      </section>

      {recentSearches.length > 0 && (
        <section className="mx-auto mt-12 max-w-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
              <Clock className="size-3.5" aria-hidden />
              {t("recentSearches")}
            </h2>
            <button
              type="button"
              onClick={clearRecentSearches}
              className="text-muted-foreground hover:text-foreground text-xs"
            >
              <X className="size-3.5" aria-hidden />
              <span className="sr-only">{t("clearFilters")}</span>
            </button>
          </div>
          <ul className="mt-3 divide-y divide-border border-y border-border">
            {recentSearches.map((q) => (
              <li key={q}>
                <Link
                  to="/search"
                  search={{ q }}
                  className="hover:bg-secondary flex items-center justify-between px-1 py-3 text-sm"
                >
                  {q}
                  <Arrow className="text-muted-foreground size-4" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {viewed.length > 0 && (
        <section className="mt-12">
          <h2 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            {t("recentlyViewed")}
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {viewed.map((m) => m && <MemberCard key={m.id} member={m} compact />)}
          </div>
        </section>
      )}

      <section className="mt-12">
        <h2 className="text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
          <Sparkles className="size-3.5" aria-hidden />
          {t("newToNetwork")}
        </h2>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          {suggested.map((m) => (
            <MemberCard key={m.id} member={m} />
          ))}
        </div>
      </section>
    </div>
  );
}

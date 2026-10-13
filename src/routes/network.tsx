import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Building2, Briefcase, Lightbulb, MapPin, Users } from "lucide-react";

import { members } from "@/data/members";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/network")({
  head: () => ({
    meta: [
      { title: "גילוי הרשת | Rotary Connect Israel" },
      {
        name: "description",
        content: "עיון בענפים, תחומי מומחיות, מקצועות ואזורים ברשת רוטרי ישראל.",
      },
      { property: "og:title", content: "Explore the Rotary Israel network" },
      {
        property: "og:description",
        content: "Browse industries, expertise, professions and regions across Rotary Israel.",
      },
    ],
  }),
  component: NetworkPage,
});

function countBy(get: (m: (typeof members)[number]) => { he: string; en: string }[]) {
  const map = new Map<string, { he: string; en: string; count: number }>();
  members.forEach((m) =>
    get(m).forEach((v) => {
      const cur = map.get(v.en);
      map.set(v.en, { ...v, count: (cur?.count ?? 0) + 1 });
    }),
  );
  return [...map.values()].sort((a, b) => b.count - a.count);
}

function CategoryCard({
  title,
  icon: Icon,
  items,
}: {
  title: string;
  icon: React.ElementType;
  items: { he: string; en: string; count: number }[];
}) {
  const { lang, t, dir } = useI18n();
  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;

  return (
    <section className="rounded-xl border border-border bg-card shadow-card">
      <div className="flex items-center gap-3 border-b border-border p-5">
        <div className="flex size-10 items-center justify-center rounded-full bg-secondary">
          <Icon className="size-5 text-muted-foreground" strokeWidth={1.8} />
        </div>
        <h2 className="text-base font-semibold">{title}</h2>
      </div>
      <ul className="divide-y divide-border">
        {items.slice(0, 8).map((item) => (
          <li key={item.en}>
            <Link
              to="/search"
              search={{ q: item[lang] }}
              className="flex items-center justify-between px-5 py-4 text-sm transition-colors hover:bg-secondary/50"
            >
              <span className="font-medium">{item[lang]}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {item.count} {t("people")}
                </span>
                <Arrow className="size-4 text-muted-foreground" />
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {items.length > 8 && (
        <div className="border-t border-border p-4 text-center">
          <Link to="/search" className="text-sm font-medium text-primary hover:underline">
            {t("viewAll")} ({items.length})
          </Link>
        </div>
      )}
    </section>
  );
}

function NetworkPage() {
  const { t } = useI18n();
  const industries = countBy((m) => [m.industry]);
  const expertise = countBy((m) => m.expertise).slice(0, 12);
  const professions = countBy((m) => [m.profession]);
  const locations = countBy((m) => [m.city]);
  const hasMembers = members.length > 0;

  return (
    <div className="container-wide py-8 lg:py-12">
      {/* Header */}
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("exploreTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("guestOneSearch")}</p>
      </div>

      {hasMembers ? (
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <CategoryCard title={t("industries")} icon={Building2} items={industries} />
          <CategoryCard title={t("expertise")} icon={Lightbulb} items={expertise} />
          <CategoryCard title={t("professions")} icon={Briefcase} items={professions} />
          <CategoryCard title={t("locations")} icon={MapPin} items={locations} />
        </div>
      ) : (
        <div className="mx-auto mt-10 max-w-md rounded-xl border border-border bg-card p-10 text-center shadow-card">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-secondary">
            <Users className="size-7 text-muted-foreground" strokeWidth={1.8} />
          </div>
          <p className="mt-5 text-lg font-semibold">{t("networkEmpty")}</p>
          <p className="mt-2 text-sm text-muted-foreground">{t("networkEmptyHint")}</p>
        </div>
      )}
    </div>
  );
}

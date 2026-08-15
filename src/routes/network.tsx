import { createFileRoute, Link } from "@tanstack/react-router";

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

function Group({
  title,
  items,
}: {
  title: string;
  items: { he: string; en: string; count: number }[];
}) {
  const { lang, t } = useI18n();
  return (
    <section className="mt-10 first:mt-0">
      <h2 className="font-heading text-base font-bold">{title}</h2>
      <ul className="mt-3 divide-y divide-border border-y border-border">
        {items.map((item) => (
          <li key={item.en}>
            <Link
              to="/search"
              search={{ q: item[lang] }}
              className="hover:bg-secondary flex items-center justify-between px-1 py-3.5 text-sm"
            >
              <span className="font-medium">{item[lang]}</span>
              <span className="text-muted-foreground text-xs">
                {item.count} {t("people")}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function NetworkPage() {
  const { t } = useI18n();
  const industries = countBy((m) => [m.industry]);
  const expertise = countBy((m) => m.expertise).slice(0, 12);
  const professions = countBy((m) => [m.profession]);
  const locations = countBy((m) => [m.city]);

  return (
    <div className="container-app max-w-3xl py-8 sm:py-12">
      <h1 className="font-heading text-2xl font-bold">{t("exploreTitle")}</h1>
      <p className="text-muted-foreground mt-1 text-sm">{t("guestOneSearch")}</p>
      <Group title={t("industries")} items={industries} />
      <Group title={t("expertise")} items={expertise} />
      <Group title={t("professions")} items={professions} />
      <Group title={t("locations")} items={locations} />
    </div>
  );
}

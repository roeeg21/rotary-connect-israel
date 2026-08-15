import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Bookmark,
  BookmarkCheck,
  Building2,
  MapPin,
  Share2,
} from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";

import { PersonAvatar } from "@/components/PersonAvatar";
import { Tag } from "@/components/Tag";
import { memberById } from "@/data/members";
import { useAppState } from "@/lib/app-state";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/profile/$id")({
  loader: ({ params }) => {
    const member = memberById(params.id);
    if (!member) throw notFound();
    return { member };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Profile unavailable" }, { name: "robots", content: "noindex" }],
      };
    }
    const m = loaderData.member;
    const title = `${m.name.en} — ${m.position.en}, ${m.company} | Rotary Connect Israel`;
    const description = `${m.name.en}, ${m.position.en} at ${m.company}. ${m.clubName.en}. Can help with ${m.helpWith.map((h) => h.en).join(", ")}.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: ProfilePage,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border py-6">
      <h2 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function ProfilePage() {
  const { member } = Route.useLoaderData();
  const { t, lang, dir } = useI18n();
  const { isSaved, toggleSaved, addRecentlyViewed } = useAppState();
  const saved = isSaved(member.id);
  const Back = dir === "rtl" ? ArrowRight : ArrowLeft;

  useEffect(() => {
    addRecentlyViewed(member.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member.id]);

  const name = member.name[lang];

  return (
    <div className="container-app max-w-3xl py-6 sm:py-10">
      <Link
        to="/"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm"
      >
        <Back className="size-4" aria-hidden />
        {t("backToSearch")}
      </Link>

      <header className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
        <PersonAvatar name={name} photo={member.photo} size="xl" />
        <div className="min-w-0 flex-1">
          <h1 className="font-heading text-2xl leading-tight font-bold">{name}</h1>
          <p className="mt-1 text-base">{member.position[lang]}</p>
          <p className="text-muted-foreground flex items-center gap-1.5 text-base">
            <Building2 className="size-4" aria-hidden />
            {member.company}
          </p>
          <div className="text-muted-foreground mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
            <span className="text-primary inline-flex items-center gap-1.5 font-medium">
              <BadgeCheck className="text-gold size-4" aria-hidden />
              {member.clubName[lang]}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-4" aria-hidden />
              {member.city[lang]}
            </span>
            {member.accountType === "family" && member.familyOf && (
              <span>
                {t("familyOf")} {member.familyOf[lang]}
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => toast.success(`${t("contactPerson")} ${name}`)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 h-11 flex-1 rounded-md px-5 text-sm font-semibold transition-colors sm:flex-none"
        >
          {t("contactPerson")} {member.name[lang].split(" ")[0]}
        </button>
        <button
          type="button"
          onClick={() => toast.success(t("requestIntro"))}
          className="hover:bg-secondary h-11 flex-1 rounded-md border border-border px-5 text-sm font-semibold transition-colors sm:flex-none"
        >
          {t("requestIntro")}
        </button>
        <button
          type="button"
          onClick={() => toggleSaved(member.id)}
          aria-pressed={saved}
          className="hover:bg-secondary inline-flex h-11 items-center justify-center rounded-md border border-border px-3.5"
          aria-label={saved ? t("saved") : t("save")}
        >
          {saved ? (
            <BookmarkCheck className="text-gold-foreground size-4" />
          ) : (
            <Bookmark className="size-4" />
          )}
        </button>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard?.writeText(window.location.href);
            toast.success(t("share"));
          }}
          className="hover:bg-secondary inline-flex h-11 items-center justify-center rounded-md border border-border px-3.5"
          aria-label={t("share")}
        >
          <Share2 className="size-4" />
        </button>
      </div>

      <div className="mt-6">
        <Section title={t("about")}>
          <p className="text-[15px] leading-relaxed">{member.about[lang]}</p>
        </Section>

        <Section title={t("professional")}>
          <dl className="grid gap-4 sm:grid-cols-2">
            {[
              [t("company"), member.company],
              [t("position"), member.position[lang]],
              [t("profession"), member.profession[lang]],
              [t("specialty"), member.specialty[lang]],
              [t("industry"), member.industry[lang]],
              [t("city"), member.city[lang]],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-muted-foreground text-xs">{k}</dt>
                <dd className="mt-0.5 text-sm font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section title={t("expertise")}>
          <div className="flex flex-wrap gap-2">
            {member.expertise.map((e) => (
              <Tag key={e.en}>{e[lang]}</Tag>
            ))}
          </div>
        </Section>

        <Section title={t("canHelpWith")}>
          <ul className="grid gap-2 sm:grid-cols-2">
            {member.helpWith.map((h) => (
              <li key={h.en} className="flex items-center gap-2 text-sm">
                <span className="bg-gold size-1.5 rounded-full" aria-hidden />
                {h[lang]}
              </li>
            ))}
          </ul>
        </Section>

        <Section title={t("rotary")}>
          <p className="text-sm">
            {member.clubName[lang]} · {t("memberSince")} {member.memberSince}
          </p>
          {member.rotaryRole && (
            <p className="text-muted-foreground mt-1 text-sm">{member.rotaryRole[lang]}</p>
          )}
        </Section>

        <Section title={t("languages")}>
          <p className="text-sm">{member.languages.map((l) => l[lang]).join(" · ")}</p>
        </Section>
      </div>
    </div>
  );
}

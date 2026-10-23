import { createFileRoute, Link } from "@tanstack/react-router";
import { Bookmark } from "lucide-react";

import { MemberCard } from "@/components/MemberCard";
import { memberById } from "@/data/members";
import { useAppState } from "@/lib/app-state";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/saved")({
  head: () => ({
    meta: [
      { title: "אנשי קשר שמורים | Rotary Connect Israel" },
      { name: "description", content: "הרשימה הפרטית שלכם של חברי רוטרי ששמרתם." },
      { property: "og:title", content: "Saved contacts" },
      { property: "og:description", content: "Your private list of saved Rotary members." },
    ],
  }),
  component: SavedPage,
});

function SavedPage() {
  const { t } = useI18n();
  const { saved } = useAppState();
  const list = saved.map(memberById).filter(Boolean);

  return (
    <div className="container-app max-w-3xl py-8 sm:py-14">
      <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-[1.75rem]">{t("savedTitle")}</h1>

      {list.length > 0 ? (
        <div className="mt-8 grid gap-4">
          {list.map((m) => m && <MemberCard key={m.id} member={m} />)}
        </div>
      ) : (
        <div className="card-premium mt-10 flex flex-col items-center py-16 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-secondary">
            <Bookmark className="text-muted-foreground size-8" strokeWidth={1.5} aria-hidden />
          </div>
          <p className="mt-5 text-lg font-bold tracking-tight">{t("savedEmpty")}</p>
          <p className="text-muted-foreground mt-2 max-w-xs text-sm leading-relaxed">{t("savedEmptyHint")}</p>
          <Link
            to="/"
            className="btn-press bg-primary text-primary-foreground hover:bg-[var(--primary-hover)] hover:shadow-raised mt-6 rounded-xl px-6 py-3 text-sm font-semibold shadow-sm transition-all"
          >
            {t("startSearching")}
          </Link>
        </div>
      )}
    </div>
  );
}

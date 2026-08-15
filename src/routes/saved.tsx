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
    <div className="container-app max-w-3xl py-8 sm:py-12">
      <h1 className="font-heading text-2xl font-bold">{t("savedTitle")}</h1>

      {list.length > 0 ? (
        <div className="mt-6 grid gap-3">
          {list.map((m) => m && <MemberCard key={m.id} member={m} />)}
        </div>
      ) : (
        <div className="mt-8 flex flex-col items-center rounded-lg border border-dashed border-border py-16 text-center">
          <Bookmark className="text-muted-foreground size-8" aria-hidden />
          <p className="mt-4 font-heading font-semibold">{t("savedEmpty")}</p>
          <p className="text-muted-foreground mt-1 max-w-xs text-sm">{t("savedEmptyHint")}</p>
          <Link
            to="/"
            className="bg-primary text-primary-foreground hover:bg-primary/90 mt-5 rounded-md px-4 py-2.5 text-sm font-semibold"
          >
            {t("startSearching")}
          </Link>
        </div>
      )}
    </div>
  );
}

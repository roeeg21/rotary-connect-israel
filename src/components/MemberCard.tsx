import { Link } from "@tanstack/react-router";
import { Bookmark, BookmarkCheck, MapPin } from "lucide-react";

import { PersonAvatar } from "@/components/PersonAvatar";
import { Tag } from "@/components/Tag";
import type { Member } from "@/data/members";
import { useAppState } from "@/lib/app-state";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function MemberCard({
  member,
  reasons = [],
  compact = false,
}: {
  member: Member;
  reasons?: string[];
  compact?: boolean;
}) {
  const { lang, t } = useI18n();
  const { isSaved, toggleSaved } = useAppState();
  const saved = isSaved(member.id);
  const name = member.name[lang];

  return (
    <article className="group bg-card hover:border-border-strong relative rounded-lg border border-border transition-colors">
      <Link
        to="/profile/$id"
        params={{ id: member.id }}
        className="flex gap-3.5 p-4 sm:gap-4 sm:p-5"
        aria-label={name}
      >
        <PersonAvatar name={name} photo={member.photo} size={compact ? "md" : "lg"} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate font-heading text-[15px] leading-tight font-semibold sm:text-base">
                {name}
              </h3>
              <p className="text-muted-foreground mt-1 truncate text-sm">
                {member.position[lang]} · {member.company}
              </p>
            </div>
          </div>

          <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5 opacity-70" aria-hidden />
              {member.city[lang]}
            </span>
            <span className="text-primary/80">{member.clubName[lang]}</span>
            {member.accountType === "family" && member.familyOf && (
              <span>
                {t("familyOf")} {member.familyOf[lang]}
              </span>
            )}
          </div>

          {!compact && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {member.helpWith.slice(0, 3).map((h) => (
                <Tag key={h.en}>{h[lang]}</Tag>
              ))}
            </div>
          )}

          {reasons.length > 0 && (
            <p className="text-muted-foreground mt-3 border-t border-border pt-2.5 text-xs">
              <span className="text-gold-foreground font-semibold">{t("matched")}:</span>{" "}
              {reasons.join(" · ")}
            </p>
          )}
        </div>
      </Link>

      <button
        type="button"
        onClick={() => toggleSaved(member.id)}
        aria-label={saved ? t("saved") : t("save")}
        aria-pressed={saved}
        className={cn(
          "absolute top-3 rounded-md p-2 transition-colors end-3",
          saved
            ? "text-gold-foreground bg-gold-soft"
            : "text-muted-foreground hover:bg-secondary hover:text-foreground",
        )}
      >
        {saved ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
      </button>
    </article>
  );
}

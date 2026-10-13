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
    <article className="group relative rounded-xl bg-card border border-border shadow-card transition-all duration-200 hover:shadow-raised hover:border-border-strong">
      <Link
        to="/profile/$id"
        params={{ id: member.id }}
        className="flex gap-4 p-5"
        aria-label={name}
      >
        <PersonAvatar name={name} photo={member.photo} size={compact ? "md" : "lg"} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold leading-tight tracking-tight">
                {name}
              </h3>
              <p className="mt-1.5 truncate text-sm text-muted-foreground">
                {member.position[lang]}
                <span className="mx-1.5 text-border-strong">·</span>
                <span className="font-medium text-foreground/80">{member.company}</span>
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-3.5" strokeWidth={1.8} aria-hidden />
              {member.city[lang]}
            </span>
            <span className="text-primary font-medium">{member.clubName[lang]}</span>
            {member.accountType === "family" && member.familyOf && (
              <span>
                {t("familyOf")} {member.familyOf[lang]}
              </span>
            )}
          </div>

          {!compact && member.helpWith.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {member.helpWith.slice(0, 3).map((h) => (
                <Tag key={h.en}>{h[lang]}</Tag>
              ))}
            </div>
          )}

          {reasons.length > 0 && (
            <div className="mt-4 rounded-lg bg-primary-soft/50 px-3 py-2">
              <p className="text-xs">
                <span className="font-semibold text-primary">{t("matched")}:</span>{" "}
                <span className="text-muted-foreground">{reasons.join(" · ")}</span>
              </p>
            </div>
          )}
        </div>
      </Link>

      <button
        type="button"
        onClick={() => toggleSaved(member.id)}
        aria-label={saved ? t("saved") : t("save")}
        aria-pressed={saved}
        className={cn(
          "absolute top-4 rounded-full p-2.5 transition-all duration-200 end-4",
          saved
            ? "bg-gold-soft text-gold-foreground"
            : "bg-secondary/0 text-muted-foreground hover:bg-secondary hover:text-foreground",
        )}
      >
        {saved ? (
          <BookmarkCheck className="size-4" strokeWidth={2} />
        ) : (
          <Bookmark className="size-4" strokeWidth={1.8} />
        )}
      </button>
    </article>
  );
}

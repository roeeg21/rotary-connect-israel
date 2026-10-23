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
    <article className="group relative rounded-2xl border border-border/50 bg-white shadow-lg transition-all duration-300 hover:shadow-xl hover:border-primary/20 hover:-translate-y-1">
      <Link
        to="/profile/$id"
        params={{ id: member.id }}
        className="flex gap-5 p-6"
        aria-label={name}
      >
        <PersonAvatar name={name} photo={member.photo} size={compact ? "md" : "lg"} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-base font-bold leading-tight tracking-tight transition-colors group-hover:text-primary">
                {name}
              </h3>
              <p className="mt-2 truncate text-sm text-muted-foreground">
                {member.position[lang]}
                <span className="mx-2 text-border">·</span>
                <span className="font-semibold text-foreground/80">{member.company}</span>
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-4 text-muted-foreground/60" strokeWidth={1.5} aria-hidden />
              {member.city[lang]}
            </span>
            <span className="font-bold text-primary">{member.clubName[lang]}</span>
            {member.accountType === "family" && member.familyOf && (
              <span>
                {t("familyOf")} {member.familyOf[lang]}
              </span>
            )}
          </div>

          {!compact && member.helpWith.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {member.helpWith.slice(0, 3).map((h) => (
                <Tag key={h.en}>{h[lang]}</Tag>
              ))}
            </div>
          )}

          {reasons.length > 0 && (
            <div className="mt-5 rounded-xl bg-primary/5 border border-primary/10 px-4 py-3">
              <p className="text-xs">
                <span className="font-bold text-primary">{t("matched")}:</span>{" "}
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
          "absolute top-5 rounded-xl p-3 transition-all duration-200 end-5",
          saved
            ? "bg-gold/20 text-gold shadow-sm"
            : "bg-secondary/50 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-secondary hover:text-foreground",
        )}
      >
        {saved ? (
          <BookmarkCheck className="size-5" strokeWidth={2} />
        ) : (
          <Bookmark className="size-5" strokeWidth={1.5} />
        )}
      </button>
    </article>
  );
}

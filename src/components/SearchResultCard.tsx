import { Link } from "@tanstack/react-router";
import { BadgeCheck, Bookmark, BookmarkCheck, Building2, MapPin, Users } from "lucide-react";

import { PersonAvatar } from "@/components/PersonAvatar";
import { Tag } from "@/components/Tag";
import type { SearchResult } from "@/lib/smart-search";
import { useAppState } from "@/lib/app-state";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { getRelationshipLabel, type Relationship } from "@/data/family-members";

interface SearchResultCardProps {
  result: SearchResult;
  compact?: boolean;
}

export function SearchResultCard({ result, compact }: SearchResultCardProps) {
  const { t, lang } = useI18n();
  const { isSaved, toggleSaved } = useAppState();

  const name = result.name[lang];
  const profession = result.profession?.[lang];
  const location = result.location?.[lang];
  const workplace = result.workplace;
  const industry = result.industry?.[lang];

  // For family members, show relationship to primary member
  const isFamilyMember = result.type === "family";
  const relationshipLabel = isFamilyMember && result.relationship
    ? getRelationshipLabel(result.relationship as Relationship, lang)
    : null;
  const primaryMemberName = result.primaryMemberName?.[lang];

  // Determine the link - for members go to their profile, for family go to primary member's profile
  const linkTo = result.type === "member"
    ? `/profile/${result.id}`
    : `/profile/${result.primaryMemberId}`;

  // Only members can be saved
  const canSave = result.type === "member";
  const saved = canSave && isSaved(result.id);

  return (
    <article
      className={cn(
        "group relative rounded-xl border border-border bg-card transition-all duration-200",
        "hover:border-border-strong hover:shadow-raised",
        compact ? "p-4" : "p-5"
      )}
    >
      <Link to={linkTo} className="absolute inset-0 z-0" aria-label={`View ${name}`} />

      <div className="relative z-10 flex gap-4">
        {/* Avatar */}
        <div className="shrink-0">
          <PersonAvatar
            name={name}
            photo={result.member?.photo}
            size={compact ? "md" : "lg"}
          />
          {/* Badge for family members */}
          {isFamilyMember && (
            <div className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Users className="size-3" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              {/* Name and badge */}
              <div className="flex items-center gap-2">
                <h3
                  className={cn(
                    "truncate font-semibold transition-colors group-hover:text-primary",
                    compact ? "text-base" : "text-lg"
                  )}
                >
                  {name}
                </h3>
                {result.type === "member" && (
                  <BadgeCheck className="size-4 shrink-0 text-gold" aria-label={t("verified")} />
                )}
              </div>

              {/* Profession / Job Title */}
              {(profession || result.jobTitle) && (
                <p className="mt-0.5 truncate text-sm text-muted-foreground">
                  {result.jobTitle?.[lang] || profession}
                </p>
              )}

              {/* Workplace & Location */}
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {workplace && (
                  <span className="inline-flex items-center gap-1">
                    <Building2 className="size-3.5" aria-hidden />
                    {workplace}
                  </span>
                )}
                {location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3.5" aria-hidden />
                    {location}
                  </span>
                )}
              </div>

              {/* Relationship badge for family members */}
              {isFamilyMember && relationshipLabel && primaryMemberName && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                    <Users className="size-3" />
                    {relationshipLabel}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {lang === "he" ? "של" : "of"} {primaryMemberName}
                  </span>
                </div>
              )}

              {/* Club name for members */}
              {result.type === "member" && result.member?.clubName && !compact && (
                <p className="mt-1.5 text-xs font-medium text-primary/80">
                  {result.member.clubName[lang]}
                </p>
              )}
            </div>

            {/* Save button - only for members */}
            {canSave && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleSaved(result.id);
                }}
                aria-pressed={saved}
                className={cn(
                  "relative z-20 rounded-full p-2 transition-colors",
                  "hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  saved && "text-gold-foreground"
                )}
                aria-label={saved ? t("saved") : t("save")}
              >
                {saved ? (
                  <BookmarkCheck className="size-5" />
                ) : (
                  <Bookmark className="size-5" />
                )}
              </button>
            )}
          </div>

          {/* Match reasons */}
          {result.reasons.length > 0 && !compact && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {result.reasons.map((reason) => (
                <Tag key={reason} variant="outline" size="sm">
                  {reason}
                </Tag>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

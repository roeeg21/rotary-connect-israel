import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SlidersHorizontal, Sparkles, UserSearch, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { SearchResultCard } from "@/components/SearchResultCard";
import { SearchField } from "@/components/SearchField";
import { clubs } from "@/data/clubs";
import { useAppState } from "@/lib/app-state";
import { useI18n } from "@/lib/i18n";
import {
  smartSearch,
  getSmartSearchFacets,
  suggestSpellingCorrection,
  getSearchStats,
  type SearchResult,
} from "@/lib/smart-search";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export const Route = createFileRoute("/search")({
  validateSearch: (s: Record<string, unknown>) => ({ q: typeof s["q"] === "string" ? s["q"] : "" }),
  head: () => ({
    meta: [
      { title: "חיפוש ברשת רוטרי | Rotary Connect Israel" },
      {
        name: "description",
        content: "חיפוש חברי רוטרי ישראל ובני משפחתם לפי מקצוע, חברה, מומחיות ועיר.",
      },
      { property: "og:title", content: "Search the Rotary network" },
      {
        property: "og:description",
        content: "Find Rotary members and family by profession, company, expertise, and city.",
      },
    ],
  }),
  component: SearchPage,
});

type RelationshipFilter = "all" | "member" | "spouse" | "child" | "family";

function FilterGroup({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | undefined;
  options: { value: string; label: string }[];
  onChange: (v: string | undefined) => void;
}) {
  return (
    <div>
      <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || undefined)}
        className="mt-2 h-11 w-full rounded-xl border bg-card px-3 text-sm outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
      >
        <option value="">—</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function RelationshipTabs({
  value,
  onChange,
}: {
  value: RelationshipFilter;
  onChange: (v: RelationshipFilter) => void;
}) {
  const { t } = useI18n();

  const tabs: { value: RelationshipFilter; label: string; icon?: React.ReactNode }[] = [
    { value: "all", label: t("allPeople") },
    { value: "member", label: t("membersOnly") },
    { value: "spouse", label: t("spouses"), icon: <Users className="size-3.5" /> },
    { value: "child", label: t("children"), icon: <Users className="size-3.5" /> },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all",
            value === tab.value
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
          )}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function SearchPage() {
  const { q } = Route.useSearch();
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const { addRecentSearch, consumeGuestSearch, isGuest } = useAppState();

  const [relationshipFilter, setRelationshipFilter] = useState<RelationshipFilter>("all");
  const [locationFilter, setLocationFilter] = useState<string | undefined>();
  const [industryFilter, setIndustryFilter] = useState<string | undefined>();
  const [blocked, setBlocked] = useState(false);

  const facetOptions = useMemo(() => getSmartSearchFacets(), []);
  const stats = useMemo(() => getSearchStats(), []);

  // Spelling suggestion
  const spellingSuggestion = useMemo(() => {
    if (!q || q.length < 3) return null;
    const words = q.split(/\s+/);
    const suggestions = words.map((w) => suggestSpellingCorrection(w)).filter(Boolean);
    if (suggestions.length === 0) return null;
    return suggestions[0];
  }, [q]);

  useEffect(() => {
    if (!q) return;
    if (!consumeGuestSearch()) {
      setBlocked(true);
      return;
    }
    addRecentSearch(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const results = useMemo(() => {
    if (blocked) return [];

    let filteredResults = smartSearch(q, {
      relationshipFilter: relationshipFilter === "all" ? undefined : relationshipFilter,
      locationFilter,
      limit: 100,
    });

    // Apply industry filter
    if (industryFilter) {
      filteredResults = filteredResults.filter(
        (r) => r.industry?.en?.toLowerCase() === industryFilter.toLowerCase()
      );
    }

    return filteredResults;
  }, [q, relationshipFilter, locationFilter, industryFilter, blocked]);

  const activeFiltersCount = [locationFilter, industryFilter].filter(Boolean).length +
    (relationshipFilter !== "all" ? 1 : 0);

  const clearFilters = () => {
    setRelationshipFilter("all");
    setLocationFilter(undefined);
    setIndustryFilter(undefined);
  };

  const filters = (
    <div className="space-y-5">
      {/* Relationship filter (desktop sidebar) */}
      <div className="hidden lg:block">
        <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t("filters")}
        </label>
        <div className="mt-3 flex flex-col gap-2">
          {(["all", "member", "spouse", "child"] as const).map((rel) => (
            <button
              key={rel}
              type="button"
              onClick={() => setRelationshipFilter(rel)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-start",
                relationshipFilter === rel
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-secondary"
              )}
            >
              {rel !== "all" && rel !== "member" && <Users className="size-4" />}
              {rel === "all"
                ? t("allPeople")
                : rel === "member"
                  ? t("membersOnly")
                  : rel === "spouse"
                    ? t("spouses")
                    : t("children")}
            </button>
          ))}
        </div>
      </div>

      <FilterGroup
        label={t("city")}
        value={locationFilter}
        options={facetOptions.locations.map((c) => ({ value: c, label: c }))}
        onChange={setLocationFilter}
      />
      <FilterGroup
        label={t("industry")}
        value={industryFilter}
        options={facetOptions.industries.map((c) => ({ value: c, label: c }))}
        onChange={setIndustryFilter}
      />

      {activeFiltersCount > 0 && (
        <button
          type="button"
          onClick={clearFilters}
          className="text-sm font-semibold text-primary transition-colors hover:text-primary/80"
        >
          {t("clearFilters")}
        </button>
      )}
    </div>
  );

  return (
    <div className="container-wide py-8 lg:py-12">
      {/* Search Bar */}
      <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-none">
        <div className="rounded-xl border border-border bg-card p-4 shadow-card sm:p-5">
          <SearchField defaultValue={q} size="md" />

          {/* Spelling suggestion */}
          {spellingSuggestion && (
            <div className="mt-3 flex items-center gap-2 text-sm">
              <Sparkles className="size-4 text-gold" />
              <span className="text-muted-foreground">{t("searchSuggestion")}:</span>
              <button
                type="button"
                onClick={() =>
                  void navigate({ to: "/search", search: { q: spellingSuggestion } })
                }
                className="font-medium text-primary hover:underline"
              >
                {spellingSuggestion}
              </button>
            </div>
          )}
        </div>

        {/* Mobile relationship tabs */}
        <div className="mt-4 lg:hidden">
          <RelationshipTabs value={relationshipFilter} onChange={setRelationshipFilter} />
        </div>
      </div>

      <div className="mt-8 lg:grid lg:grid-cols-[280px_1fr] lg:gap-8">
        {/* Filters Sidebar - Desktop */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 rounded-xl border border-border bg-card p-5 shadow-card">
            {filters}

            {/* Stats */}
            <div className="mt-6 border-t border-border pt-4">
              <p className="text-xs text-muted-foreground">
                {stats.totalMembers} {t("membersOnly").toLowerCase()} · {stats.totalFamilyMembers}{" "}
                {t("familyMembers").toLowerCase()}
              </p>
            </div>
          </div>
        </aside>

        {/* Results */}
        <div>
          <div className="mb-6 flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{blocked ? "—" : results.length}</span>{" "}
              {t("results")}
              {q && <span className="ms-1 font-medium text-foreground">· {q}</span>}
            </p>

            {/* Mobile Filters */}
            <Sheet>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium transition-all lg:hidden",
                    activeFiltersCount > 0 && "border-primary text-primary"
                  )}
                >
                  <SlidersHorizontal className="size-4" strokeWidth={1.8} aria-hidden />
                  {t("filters")}
                  {activeFiltersCount > 0 && (
                    <span className="flex size-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
                <SheetHeader>
                  <SheetTitle>{t("filters")}</SheetTitle>
                </SheetHeader>
                <div className="px-4 pb-10 pt-4">{filters}</div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Results Grid */}
          {!blocked && results.length > 0 && (
            <div className="grid gap-4">
              {results.map((result) => (
                <SearchResultCard key={`${result.type}-${result.id}`} result={result} />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!blocked && results.length === 0 && (
            <div className="rounded-xl border border-border bg-card p-12 text-center shadow-card">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-secondary">
                <UserSearch className="size-7 text-muted-foreground" strokeWidth={1.8} aria-hidden />
              </div>
              <p className="mt-5 text-lg font-semibold">{t("noResults")}</p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{t("noResultsHint")}</p>
            </div>
          )}
        </div>
      </div>

      {/* Guest Limit Dialog */}
      <Dialog open={blocked} onOpenChange={(o) => !o && void navigate({ to: "/" })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("guestLimitTitle")}</DialogTitle>
            <DialogDescription>{t("guestLimitBody")}</DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row-reverse">
            <Link
              to="/register"
              className="inline-flex flex-1 items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90"
            >
              {t("registerNow")}
            </Link>
            <Link
              to="/"
              className="inline-flex flex-1 items-center justify-center rounded-xl border border-border px-4 py-3 text-sm font-medium transition-colors hover:bg-secondary"
            >
              {t("later")}
            </Link>
          </div>
          {isGuest && (
            <p className="mt-2 text-center text-xs text-muted-foreground">{t("guestOneSearch")}</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

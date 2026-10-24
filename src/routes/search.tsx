import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Bot, Briefcase, MapPin, SlidersHorizontal, Sparkles, UserSearch, Users } from "lucide-react";
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
import { useAISearch } from "@/lib/useAISearch";
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
      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || undefined)}
        className="mt-2.5 h-12 w-full rounded-xl border border-border bg-card px-4 text-sm font-medium outline-none transition-all hover:border-border-strong focus:border-primary focus:ring-4 focus:ring-primary/10"
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
            "btn-press inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-all",
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

  // AI-powered search
  const {
    results: aiResults,
    isLoading: isSearching,
    intent: searchIntent,
    suggestedCorrections: aiCorrections,
    notFound: aiNotFound,
    isAIPowered,
  } = useAISearch({
    query: q,
    limit: 100,
    relationshipFilter,
    locationFilter,
    enabled: !blocked,
  });

  // Spelling suggestion (from AI or fallback)
  const spellingSuggestion = useMemo(() => {
    // First check AI corrections
    if (aiCorrections && aiCorrections.length > 0) {
      return aiCorrections[0].suggested;
    }
    // Fallback to local spell check
    if (!q || q.length < 3) return null;
    const words = q.split(/\s+/);
    const suggestions = words.map((w) => suggestSpellingCorrection(w)).filter(Boolean);
    if (suggestions.length === 0) return null;
    return suggestions[0];
  }, [q, aiCorrections]);

  useEffect(() => {
    if (!q) return;
    if (!consumeGuestSearch()) {
      setBlocked(true);
      return;
    }
    addRecentSearch(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  // Apply additional industry filter on top of AI results
  const results = useMemo(() => {
    if (blocked) return [];

    let filteredResults = aiResults;

    // Apply industry filter if not already handled by AI
    if (industryFilter) {
      filteredResults = filteredResults.filter(
        (r) => r.industry?.en?.toLowerCase() === industryFilter.toLowerCase()
      );
    }

    return filteredResults;
  }, [aiResults, industryFilter, blocked]);

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
        <div className="card-elevated p-5 sm:p-6">
          <SearchField defaultValue={q} size="md" />

          {/* Spelling suggestion */}
          {spellingSuggestion && (
            <div className="mt-4 flex items-center gap-2.5 text-sm">
              <Sparkles className="size-4 text-gold" />
              <span className="text-muted-foreground">{t("searchSuggestion")}:</span>
              <button
                type="button"
                onClick={() =>
                  void navigate({ to: "/search", search: { q: spellingSuggestion } })
                }
                className="font-semibold text-primary hover:underline"
              >
                {spellingSuggestion}
              </button>
            </div>
          )}
        </div>

        {/* Mobile relationship tabs */}
        <div className="mt-5 lg:hidden">
          <RelationshipTabs value={relationshipFilter} onChange={setRelationshipFilter} />
        </div>
      </div>

      <div className="mt-8 lg:grid lg:grid-cols-[280px_1fr] lg:gap-10">
        {/* Filters Sidebar - Desktop */}
        <aside className="hidden lg:block">
          <div className="card-premium sticky top-20 p-5">
            {filters}

            {/* Stats */}
            <div className="mt-6 border-t border-border pt-5">
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
            <div className="flex items-center gap-3">
              <p className="text-sm text-muted-foreground">
                <span className="font-bold text-foreground">{blocked ? "—" : results.length}</span>{" "}
                {t("results")}
                {q && <span className="ms-1.5 font-medium text-foreground/80">· {q}</span>}
              </p>
              {isAIPowered && q && !isSearching && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                  <Bot className="size-3" />
                  AI
                </span>
              )}
              {isSearching && (
                <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="size-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  {lang === "he" ? "מחפש..." : "Searching..."}
                </span>
              )}
            </div>

            {/* Mobile Filters */}
            <Sheet>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "btn-press inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold transition-all lg:hidden",
                    activeFiltersCount > 0 && "border-primary text-primary"
                  )}
                >
                  <SlidersHorizontal className="size-4" strokeWidth={1.75} aria-hidden />
                  {t("filters")}
                  {activeFiltersCount > 0 && (
                    <span className="flex size-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-3xl">
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

          {/* Empty State - AI Powered */}
          {!blocked && results.length === 0 && !isSearching && (
            <div className="card-premium overflow-hidden">
              {/* AI Bar Header */}
              <div className="flex items-center gap-3 border-b border-border bg-gradient-to-r from-primary/5 to-transparent px-6 py-4">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                  <Bot className="size-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-primary">
                    {lang === "he" ? "חיפוש חכם" : "Smart Search"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {lang === "he" ? "לא נמצאו תוצאות" : "No results found"}
                  </p>
                </div>
              </div>

              {/* Not Found Message */}
              <div className="p-6 text-center">
                <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-secondary">
                  <UserSearch className="size-7 text-muted-foreground" strokeWidth={1.5} aria-hidden />
                </div>

                {aiNotFound ? (
                  <>
                    <p className="mt-5 text-base font-bold tracking-tight">
                      {aiNotFound.message[lang]}
                    </p>
                    <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground leading-relaxed">
                      {lang === "he"
                        ? "נסו לחפש במילים אחרות או בחרו מההצעות הבאות:"
                        : "Try different keywords or choose from these suggestions:"}
                    </p>

                    {/* Alternative Suggestions */}
                    {aiNotFound.alternatives.length > 0 && (
                      <div className="mt-6 flex flex-wrap justify-center gap-2">
                        {aiNotFound.alternatives.map((alt, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => void navigate({ to: "/search", search: { q: alt.query } })}
                            className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2.5 text-sm font-semibold shadow-sm transition-all duration-200 hover:border-primary/30 hover:bg-primary/5 hover:shadow-md active:scale-95"
                          >
                            {alt.type === "profession" && <Briefcase className="size-3.5 text-muted-foreground" />}
                            {alt.type === "location" && <MapPin className="size-3.5 text-muted-foreground" />}
                            {alt.label[lang]}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <p className="mt-5 text-base font-bold tracking-tight">{t("noResults")}</p>
                    <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground leading-relaxed">
                      {t("noResultsHint")}
                    </p>
                  </>
                )}
              </div>
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
              to="/register-form"
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

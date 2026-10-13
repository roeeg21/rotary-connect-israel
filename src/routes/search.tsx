import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SlidersHorizontal, UserSearch } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { MemberCard } from "@/components/MemberCard";
import { SearchField } from "@/components/SearchField";
import { clubs } from "@/data/clubs";
import { useAppState } from "@/lib/app-state";
import { useI18n } from "@/lib/i18n";
import { facetValues, searchMembers, type Facets } from "@/lib/search";
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
        content: "תוצאות חיפוש חברי רוטרי ישראל לפי חברה, מקצוע, מומחיות, עיר ומועדון.",
      },
      { property: "og:title", content: "Search the Rotary network" },
      {
        property: "og:description",
        content: "Find Rotary Israel members by company, profession, expertise, city and club.",
      },
    ],
  }),
  component: SearchPage,
});

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

function SearchPage() {
  const { q } = Route.useSearch();
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const { addRecentSearch, consumeGuestSearch, isGuest } = useAppState();
  const [facets, setFacets] = useState<Facets>({});
  const [blocked, setBlocked] = useState(false);
  const values = useMemo(() => facetValues(), []);

  useEffect(() => {
    if (!q) return;
    if (!consumeGuestSearch()) {
      setBlocked(true);
      return;
    }
    addRecentSearch(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const hits = useMemo(() => (blocked ? [] : searchMembers(q, facets)), [q, facets, blocked]);
  const activeCount = Object.values(facets).filter(Boolean).length;

  const filters = (
    <div className="space-y-5">
      <FilterGroup
        label={t("company")}
        value={facets.company}
        options={values.companies.map((c) => ({ value: c, label: c }))}
        onChange={(v) => setFacets((f) => ({ ...f, company: v }))}
      />
      <FilterGroup
        label={t("profession")}
        value={facets.profession}
        options={values.professions.map((c) => ({ value: c, label: c }))}
        onChange={(v) => setFacets((f) => ({ ...f, profession: v }))}
      />
      <FilterGroup
        label={t("industry")}
        value={facets.industry}
        options={values.industries.map((c) => ({ value: c, label: c }))}
        onChange={(v) => setFacets((f) => ({ ...f, industry: v }))}
      />
      <FilterGroup
        label={t("city")}
        value={facets.city}
        options={values.cities.map((c) => ({ value: c, label: c }))}
        onChange={(v) => setFacets((f) => ({ ...f, city: v }))}
      />
      <FilterGroup
        label={t("club")}
        value={facets.club}
        options={values.clubs.map((id) => ({
          value: id,
          label: clubs.find((c) => c.id === id)?.[lang] ?? id,
        }))}
        onChange={(v) => setFacets((f) => ({ ...f, club: v }))}
      />
      {activeCount > 0 && (
        <button
          type="button"
          onClick={() => setFacets({})}
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
        </div>
      </div>

      <div className="mt-8 lg:grid lg:grid-cols-[280px_1fr] lg:gap-8">
        {/* Filters Sidebar - Desktop */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 rounded-xl border border-border bg-card p-5 shadow-card">
            <h2 className="mb-5 text-sm font-semibold">{t("filters")}</h2>
            {filters}
          </div>
        </aside>

        {/* Results */}
        <div>
          <div className="mb-6 flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{blocked ? "—" : hits.length}</span>{" "}
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
                    activeCount > 0 && "border-primary text-primary",
                  )}
                >
                  <SlidersHorizontal className="size-4" strokeWidth={1.8} aria-hidden />
                  {t("filters")}
                  {activeCount > 0 && (
                    <span className="flex size-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                      {activeCount}
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
          {!blocked && hits.length > 0 && (
            <div className="grid gap-4">
              {hits.map((hit) => (
                <MemberCard key={hit.member.id} member={hit.member} reasons={hit.reasons} />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!blocked && hits.length === 0 && (
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

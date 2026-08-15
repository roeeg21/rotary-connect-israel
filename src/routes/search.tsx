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
      <label className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
        {label}
      </label>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || undefined)}
        className="bg-card focus:border-primary mt-2 h-10 w-full rounded-md border border-border px-3 text-sm outline-none"
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
    <div className="space-y-4">
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
          className="text-primary text-sm font-semibold"
        >
          {t("clearFilters")}
        </button>
      )}
    </div>
  );

  return (
    <div className="container-app py-6 sm:py-10">
      <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-none">
        <SearchField defaultValue={q} size="md" />
      </div>

      <div className="mt-6 lg:grid lg:grid-cols-[240px_1fr] lg:gap-10">
        <aside className="hidden lg:block">
          <h2 className="mb-4 font-heading text-sm font-bold">{t("filters")}</h2>
          {filters}
        </aside>

        <div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-muted-foreground text-sm">
              {blocked ? "—" : hits.length} {t("results")}
              {q && <span className="text-foreground font-medium"> · {q}</span>}
            </p>
            <Sheet>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "bg-card inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium lg:hidden",
                    activeCount > 0 && "border-primary text-primary",
                  )}
                >
                  <SlidersHorizontal className="size-4" aria-hidden />
                  {t("filters")}
                  {activeCount > 0 && ` (${activeCount})`}
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto rounded-t-xl">
                <SheetHeader>
                  <SheetTitle>{t("filters")}</SheetTitle>
                </SheetHeader>
                <div className="px-4 pb-8">{filters}</div>
              </SheetContent>
            </Sheet>
          </div>

          {!blocked && hits.length > 0 && (
            <div className="mt-4 grid gap-3">
              {hits.map((hit) => (
                <MemberCard key={hit.member.id} member={hit.member} reasons={hit.reasons} />
              ))}
            </div>
          )}

          {!blocked && hits.length === 0 && (
            <div className="mt-10 flex flex-col items-center rounded-lg border border-dashed border-border py-16 text-center">
              <UserSearch className="text-muted-foreground size-8" aria-hidden />
              <p className="mt-4 font-heading font-semibold">{t("noResults")}</p>
              <p className="text-muted-foreground mt-1 max-w-xs text-sm">{t("noResultsHint")}</p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={blocked} onOpenChange={(o) => !o && void navigate({ to: "/" })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("guestLimitTitle")}</DialogTitle>
            <DialogDescription>{t("guestLimitBody")}</DialogDescription>
          </DialogHeader>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row-reverse">
            <Link
              to="/register"
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex flex-1 items-center justify-center rounded-md px-4 py-2.5 text-sm font-semibold"
            >
              {t("registerNow")}
            </Link>
            <Link
              to="/"
              className="hover:bg-secondary inline-flex flex-1 items-center justify-center rounded-md border border-border px-4 py-2.5 text-sm font-medium"
            >
              {t("later")}
            </Link>
          </div>
          {isGuest && (
            <p className="text-muted-foreground text-xs">{t("guestOneSearch")}</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

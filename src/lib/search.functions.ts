/**
 * Search Server Functions
 * Exposes AI-powered search through TanStack Start server functions
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { interpretQuery, intentToSearchOptions, type SearchIntent } from "./ai-query-interpreter.server";
import { smartSearch, type SearchResult } from "./smart-search";

// Input validation schema
const SearchQuerySchema = z.object({
  query: z.string().min(1).max(500),
  limit: z.number().min(1).max(100).default(50),
  relationshipFilter: z.enum(["all", "member", "spouse", "child", "family"]).optional(),
  locationFilter: z.string().optional(),
});

// Not found message type
export interface NotFoundInfo {
  message: { he: string; en: string };
  searchedFor: { he: string; en: string };
  alternatives: Array<{
    type: "profession" | "location" | "query";
    label: { he: string; en: string };
    query: string;
  }>;
}

// Response type
export interface AISearchResponse {
  results: SearchResult[];
  intent: SearchIntent;
  totalCount: number;
  hasMore: boolean;
  suggestedCorrections: Array<{ original: string; suggested: string }>;
  notFound?: NotFoundInfo;
}

// Alternative suggestions for common searches
const PROFESSION_ALTERNATIVES: Record<string, Array<{ he: string; en: string; query: string }>> = {
  "lawyer": [
    { he: "רואה חשבון", en: "Accountant", query: "רואה חשבון" },
    { he: "יועץ משפטי", en: "Legal Consultant", query: "יועץ משפטי" },
    { he: "נוטריון", en: "Notary", query: "נוטריון" },
  ],
  "doctor": [
    { he: "רופא שיניים", en: "Dentist", query: "רופא שיניים" },
    { he: "פסיכולוג", en: "Psychologist", query: "פסיכולוג" },
    { he: "פיזיותרפיסט", en: "Physiotherapist", query: "פיזיותרפיסט" },
  ],
  "engineer": [
    { he: "אדריכל", en: "Architect", query: "אדריכל" },
    { he: "מתכנת", en: "Software Developer", query: "מתכנת" },
    { he: "מנהל פרויקטים", en: "Project Manager", query: "מנהל פרויקטים" },
  ],
  "accountant": [
    { he: "יועץ מס", en: "Tax Consultant", query: "יועץ מס" },
    { he: "עורך דין", en: "Lawyer", query: "עורך דין" },
    { he: "יועץ פיננסי", en: "Financial Advisor", query: "יועץ פיננסי" },
  ],
};

const LOCATION_ALTERNATIVES: Record<string, Array<{ he: string; en: string; query: string }>> = {
  "tel aviv": [
    { he: "רמת גן", en: "Ramat Gan", query: "רמת גן" },
    { he: "הרצליה", en: "Herzliya", query: "הרצליה" },
    { he: "גבעתיים", en: "Givatayim", query: "גבעתיים" },
  ],
  "jerusalem": [
    { he: "מודיעין", en: "Modiin", query: "מודיעין" },
    { he: "בית שמש", en: "Beit Shemesh", query: "בית שמש" },
    { he: "מעלה אדומים", en: "Maale Adumim", query: "מעלה אדומים" },
  ],
  "haifa": [
    { he: "קריות", en: "Krayot", query: "קריות" },
    { he: "נהריה", en: "Nahariya", query: "נהריה" },
    { he: "עכו", en: "Acre", query: "עכו" },
  ],
};

function generateNotFoundInfo(query: string, intent: SearchIntent): NotFoundInfo {
  const alternatives: NotFoundInfo["alternatives"] = [];

  // Generate message based on what was searched for
  let searchedForHe = query;
  let searchedForEn = query;

  if (intent.entities.professions.length > 0) {
    const prof = intent.entities.professions[0];
    searchedForHe = prof;
    searchedForEn = intent.entities.professions[1] || prof;

    // Add profession alternatives
    const profLower = prof.toLowerCase();
    for (const [key, alts] of Object.entries(PROFESSION_ALTERNATIVES)) {
      if (profLower.includes(key) || key.includes(profLower)) {
        alternatives.push(...alts.slice(0, 3).map(alt => ({
          type: "profession" as const,
          label: { he: alt.he, en: alt.en },
          query: alt.query,
        })));
        break;
      }
    }
  }

  if (intent.entities.locations.length > 0) {
    const loc = intent.entities.locations[0];
    if (searchedForHe !== query) {
      searchedForHe += ` ב${loc}`;
      searchedForEn += ` in ${intent.entities.locations[1] || loc}`;
    } else {
      searchedForHe = loc;
      searchedForEn = intent.entities.locations[1] || loc;
    }

    // Add location alternatives
    const locLower = loc.toLowerCase();
    for (const [key, alts] of Object.entries(LOCATION_ALTERNATIVES)) {
      if (locLower.includes(key) || key.includes(locLower)) {
        alternatives.push(...alts.slice(0, 2).map(alt => ({
          type: "location" as const,
          label: { he: alt.he, en: alt.en },
          query: intent.entities.professions.length > 0
            ? `${intent.entities.professions[0]} ${alt.query}`
            : alt.query,
        })));
        break;
      }
    }
  }

  // Add general alternatives if we don't have enough
  if (alternatives.length < 3) {
    const generalAlternatives = [
      { type: "query" as const, label: { he: "עורך דין", en: "Lawyer" }, query: "עורך דין" },
      { type: "query" as const, label: { he: "רופא", en: "Doctor" }, query: "רופא" },
      { type: "query" as const, label: { he: "מהנדס", en: "Engineer" }, query: "מהנדס" },
      { type: "query" as const, label: { he: "רואה חשבון", en: "Accountant" }, query: "רואה חשבון" },
    ];

    const remaining = 3 - alternatives.length;
    alternatives.push(...generalAlternatives.slice(0, remaining));
  }

  return {
    message: {
      he: `לא מצאנו תוצאות עבור "${searchedForHe}"`,
      en: `We couldn't find results for "${searchedForEn}"`,
    },
    searchedFor: {
      he: searchedForHe,
      en: searchedForEn,
    },
    alternatives: alternatives.slice(0, 4),
  };
}

/**
 * AI-powered search server function
 * Interprets natural language queries and returns relevant results
 */
export const aiSearch = createServerFn({ method: "GET" })
  .validator((input: unknown) => SearchQuerySchema.parse(input))
  .handler(async ({ data }): Promise<AISearchResponse> => {
    const { query, limit, relationshipFilter, locationFilter } = data;

    // Use AI to interpret the query
    const intent = await interpretQuery(query);

    // Convert intent to search options
    const searchOptions = intentToSearchOptions(intent);

    // Override with explicit filters if provided
    const effectiveOptions = {
      limit,
      relationshipFilter: relationshipFilter || searchOptions.relationshipFilter,
      locationFilter: locationFilter || searchOptions.locationFilter,
    };

    // Build search query from intent
    const searchQuery = searchOptions.searchTerms.join(" ");

    // Perform the search
    const results = smartSearch(searchQuery || query, effectiveOptions);

    // Generate not found info if no results
    const notFound = results.length === 0 ? generateNotFoundInfo(query, intent) : undefined;

    return {
      results: results.slice(0, limit),
      intent,
      totalCount: results.length,
      hasMore: results.length > limit,
      suggestedCorrections: intent.corrections,
      notFound,
    };
  });

/**
 * Get search intent only (for UI hints)
 */
export const getSearchIntent = createServerFn({ method: "GET" })
  .validator((input: unknown) => z.object({ query: z.string().min(1) }).parse(input))
  .handler(async ({ data }): Promise<SearchIntent> => {
    return interpretQuery(data.query);
  });

/**
 * Simple search without AI (fallback)
 */
export const simpleSearch = createServerFn({ method: "GET" })
  .validator((input: unknown) => SearchQuerySchema.parse(input))
  .handler(async ({ data }): Promise<SearchResult[]> => {
    const { query, limit, relationshipFilter, locationFilter } = data;

    return smartSearch(query, {
      limit,
      relationshipFilter: relationshipFilter === "all" ? undefined : relationshipFilter,
      locationFilter,
    });
  });

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

// Response type
export interface AISearchResponse {
  results: SearchResult[];
  intent: SearchIntent;
  totalCount: number;
  hasMore: boolean;
  suggestedCorrections: Array<{ original: string; suggested: string }>;
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

    return {
      results: results.slice(0, limit),
      intent,
      totalCount: results.length,
      hasMore: results.length > limit,
      suggestedCorrections: intent.corrections,
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

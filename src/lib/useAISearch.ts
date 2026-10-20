/**
 * AI-Powered Search Hook
 * Uses Claude to interpret natural language queries when available
 */

import { useQuery } from "@tanstack/react-query";
import { aiSearch, type AISearchResponse } from "./search.functions";
import { smartSearch, type SearchResult } from "./smart-search";

type RelationshipFilter = "all" | "member" | "spouse" | "child" | "family";

interface UseAISearchOptions {
  query: string;
  limit?: number;
  relationshipFilter?: RelationshipFilter;
  locationFilter?: string;
  enabled?: boolean;
}

interface AISearchResult {
  results: SearchResult[];
  isLoading: boolean;
  error: Error | null;
  intent?: AISearchResponse["intent"];
  suggestedCorrections?: Array<{ original: string; suggested: string }>;
  isAIPowered: boolean;
}

/**
 * Hook for AI-powered search
 * Falls back to local search if AI is unavailable
 */
export function useAISearch({
  query,
  limit = 50,
  relationshipFilter = "all",
  locationFilter,
  enabled = true,
}: UseAISearchOptions): AISearchResult {
  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["aiSearch", query, limit, relationshipFilter, locationFilter],
    queryFn: async () => {
      try {
        // Try AI-powered search
        const response = await aiSearch({
          data: {
            query,
            limit,
            relationshipFilter,
            locationFilter,
          },
        });
        return {
          ...response,
          isAIPowered: true,
        };
      } catch (err) {
        console.warn("AI search failed, falling back to local search:", err);

        // Fall back to local smart search
        const results = smartSearch(query, {
          limit,
          relationshipFilter: relationshipFilter === "all" ? undefined : relationshipFilter,
          locationFilter,
        });

        return {
          results,
          intent: undefined,
          totalCount: results.length,
          hasMore: false,
          suggestedCorrections: [],
          isAIPowered: false,
        };
      }
    },
    enabled: enabled && query.length > 0,
    staleTime: 30000, // Cache results for 30 seconds
    gcTime: 60000, // Keep in cache for 1 minute
  });

  // When no query, return empty results
  if (!query) {
    const emptyResults = smartSearch("", {
      limit,
      relationshipFilter: relationshipFilter === "all" ? undefined : relationshipFilter,
      locationFilter,
    });

    return {
      results: emptyResults,
      isLoading: false,
      error: null,
      isAIPowered: false,
    };
  }

  return {
    results: data?.results || [],
    isLoading,
    error: error as Error | null,
    intent: data?.intent,
    suggestedCorrections: data?.suggestedCorrections,
    isAIPowered: data?.isAIPowered || false,
  };
}

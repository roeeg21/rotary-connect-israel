import { json } from "@tanstack/start";
import { createAPIFileRoute } from "@tanstack/start/api";
import { smartSearch } from "@/lib/smart-search";

export const APIRoute = createAPIFileRoute("/api/search")({
  POST: async ({ request }) => {
    try {
      const body = await request.json();
      const { query, limit = 20, relationshipFilter = "all", locationFilter, industryFilter } = body;

      if (!query || typeof query !== "string") {
        return json({ error: "Query is required" }, { status: 400 });
      }

      // Use smart search
      const results = smartSearch(query, {
        limit,
        relationshipFilter,
        locationFilter,
        industryFilter,
      });

      return json({
        results: results.map((r) => ({
          id: r.id,
          type: r.type,
          name: r.name,
          profession: r.profession,
          workplace: r.workplace,
          location: r.location,
          industry: r.industry,
          relationship: r.relationship,
          primaryMemberId: r.primaryMemberId,
          score: r.score,
          reasons: r.reasons,
          photo: r.member?.photo || r.familyMember?.profileImage,
        })),
        query,
        totalResults: results.length,
      });
    } catch (error) {
      console.error("Search error:", error);
      return json({ error: "Search failed" }, { status: 500 });
    }
  },
});

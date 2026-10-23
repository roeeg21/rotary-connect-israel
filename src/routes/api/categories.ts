import { json } from "@tanstack/start";
import { createAPIFileRoute } from "@tanstack/start/api";
import { members } from "@/data/members";
import type { Bi } from "@/data/members";

// Helper to count occurrences and create category objects
function countByField(
  field: keyof Pick<typeof members[number], "industry" | "city" | "profession">,
  type: "industry" | "location" | "profession"
): { id: string; name: Bi; count: number; type: string }[] {
  const counts = new Map<string, { name: Bi; count: number }>();

  for (const member of members) {
    const value = member[field] as Bi;
    if (value?.he || value?.en) {
      const key = value.en.toLowerCase();
      const existing = counts.get(key);
      if (existing) {
        existing.count++;
      } else {
        counts.set(key, { name: value, count: 1 });
      }
    }
  }

  return Array.from(counts.entries())
    .map(([key, { name, count }]) => ({
      id: key.replace(/\s+/g, "-"),
      name,
      count,
      type,
    }))
    .sort((a, b) => b.count - a.count);
}

// Get unique expertise areas
function getExpertise(): { id: string; name: Bi; count: number; type: string }[] {
  const counts = new Map<string, { name: Bi; count: number }>();

  for (const member of members) {
    if (member.expertise) {
      for (const exp of member.expertise) {
        const key = exp.en.toLowerCase();
        const existing = counts.get(key);
        if (existing) {
          existing.count++;
        } else {
          counts.set(key, { name: exp, count: 1 });
        }
      }
    }
  }

  return Array.from(counts.entries())
    .map(([key, { name, count }]) => ({
      id: key.replace(/\s+/g, "-"),
      name,
      count,
      type: "expertise",
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12); // Limit to top 12
}

export const APIRoute = createAPIFileRoute("/api/categories")({
  GET: async () => {
    try {
      const industries = countByField("industry", "industry").slice(0, 10);
      const locations = countByField("city", "location").slice(0, 10);
      const professions = countByField("profession", "profession").slice(0, 10);
      const expertise = getExpertise();

      return json({
        industries,
        locations,
        professions,
        expertise,
      });
    } catch (error) {
      console.error("Error fetching categories:", error);
      return json({ error: "Failed to fetch categories" }, { status: 500 });
    }
  },
});

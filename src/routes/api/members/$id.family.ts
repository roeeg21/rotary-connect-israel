import { json } from "@tanstack/start";
import { createAPIFileRoute } from "@tanstack/start/api";
import { familyMembers } from "@/data/family-members";

export const APIRoute = createAPIFileRoute("/api/members/$id/family")({
  GET: async ({ params }) => {
    try {
      const { id } = params;
      const family = familyMembers.filter((fm) => fm.memberId === id);
      return json(family);
    } catch (error) {
      console.error("Error fetching family members:", error);
      return json({ error: "Failed to fetch family members" }, { status: 500 });
    }
  },
});

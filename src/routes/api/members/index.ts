import { json } from "@tanstack/start";
import { createAPIFileRoute } from "@tanstack/start/api";
import { members } from "@/data/members";

export const APIRoute = createAPIFileRoute("/api/members")({
  // GET all members with optional pagination
  GET: async ({ request }) => {
    try {
      const url = new URL(request.url);
      const limit = parseInt(url.searchParams.get("limit") || "50");
      const offset = parseInt(url.searchParams.get("offset") || "0");

      const paginatedMembers = members.slice(offset, offset + limit);

      return json({
        members: paginatedMembers,
        total: members.length,
      });
    } catch (error) {
      console.error("Error fetching members:", error);
      return json({ error: "Failed to fetch members" }, { status: 500 });
    }
  },

  // POST to get specific members by IDs
  POST: async ({ request }) => {
    try {
      const body = await request.json();
      const { ids } = body;

      if (!Array.isArray(ids)) {
        return json({ error: "IDs array is required" }, { status: 400 });
      }

      const foundMembers = members.filter((m) => ids.includes(m.id));
      return json(foundMembers);
    } catch (error) {
      console.error("Error fetching members:", error);
      return json({ error: "Failed to fetch members" }, { status: 500 });
    }
  },
});

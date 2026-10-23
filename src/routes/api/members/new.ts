import { json } from "@tanstack/start";
import { createAPIFileRoute } from "@tanstack/start/api";
import { members } from "@/data/members";

export const APIRoute = createAPIFileRoute("/api/members/new")({
  GET: async ({ request }) => {
    try {
      const url = new URL(request.url);
      const limit = parseInt(url.searchParams.get("limit") || "5");

      // Get members marked as new or most recently added
      const newMembers = members
        .filter((m) => m.isNew)
        .slice(0, limit);

      return json(newMembers);
    } catch (error) {
      console.error("Error fetching new members:", error);
      return json({ error: "Failed to fetch new members" }, { status: 500 });
    }
  },
});

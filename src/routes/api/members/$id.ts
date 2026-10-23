import { json } from "@tanstack/start";
import { createAPIFileRoute } from "@tanstack/start/api";
import { members } from "@/data/members";

export const APIRoute = createAPIFileRoute("/api/members/$id")({
  GET: async ({ params }) => {
    try {
      const { id } = params;
      const member = members.find((m) => m.id === id);

      if (!member) {
        return json({ error: "Member not found" }, { status: 404 });
      }

      return json(member);
    } catch (error) {
      console.error("Error fetching member:", error);
      return json({ error: "Failed to fetch member" }, { status: 500 });
    }
  },
});

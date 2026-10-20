import { json } from "@tanstack/start";
import { createAPIFileRoute } from "@tanstack/start/api";
import { findOrCreateSocialUser, type SocialAuthInput } from "../../../lib/users.server";

export const APIRoute = createAPIFileRoute("/api/auth/social")({
  POST: async ({ request }) => {
    try {
      const body = await request.json() as SocialAuthInput;

      // Validate required fields
      if (!body.provider || !body.providerId || !body.email) {
        return json(
          { error: "Missing required fields: provider, providerId, email" },
          { status: 400 }
        );
      }

      // Validate provider
      if (body.provider !== "apple" && body.provider !== "google") {
        return json(
          { error: "Invalid provider. Must be 'apple' or 'google'" },
          { status: 400 }
        );
      }

      // Find or create user
      const user = await findOrCreateSocialUser(body);

      return json({
        success: true,
        user: {
          email: user.email,
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          photo: user.photo,
          club: user.club || "",
          onboarded: user.onboarded,
          provider: user.provider,
        },
      });
    } catch (error) {
      console.error("Social auth error:", error);
      return json(
        { error: "Authentication failed" },
        { status: 500 }
      );
    }
  },
});

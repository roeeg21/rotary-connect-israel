import { createFileRoute } from "@tanstack/react-router";
import { verifyPassword } from "../../../lib/password.server";

export const Route = createFileRoute("/api/auth/verify-password")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { email, password } = body as { email: string; password: string };

          if (!email || typeof email !== "string") {
            return new Response(JSON.stringify({ success: false, error: "Email is required" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          if (!password || typeof password !== "string") {
            return new Response(JSON.stringify({ success: false, error: "Password is required" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const result = await verifyPassword(email, password);

          if (!result.success) {
            return new Response(JSON.stringify({ success: false, error: result.error }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }

          // Return success with user info
          return new Response(
            JSON.stringify({
              success: true,
              email: result.email,
              user: result.user,
              message: "Password verified successfully",
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        } catch (error) {
          console.error("Verify password error:", error);
          return new Response(JSON.stringify({ success: false, error: "Failed to verify password" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});

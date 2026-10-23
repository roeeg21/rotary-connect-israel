import { createFileRoute } from "@tanstack/react-router";
import { verifyOTP } from "../../../lib/otp.server";

export const Route = createFileRoute("/api/auth/verify-otp")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { sessionKey, code } = body as { sessionKey: string; code: string };

          if (!sessionKey || typeof sessionKey !== "string") {
            return new Response(JSON.stringify({ success: false, error: "Session key is required" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          if (!code || typeof code !== "string") {
            return new Response(JSON.stringify({ success: false, error: "Code is required" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          // Validate code format (4 digits)
          if (!/^\d{4}$/.test(code.trim())) {
            return new Response(JSON.stringify({ success: false, error: "Code must be 4 digits" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const result = await verifyOTP(sessionKey, code);

          if (!result.success) {
            return new Response(JSON.stringify({ success: false, error: result.error }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          // Return success with user email
          return new Response(
            JSON.stringify({
              success: true,
              email: result.email,
              message: "Code verified successfully",
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        } catch (error) {
          console.error("Verify OTP error:", error);
          return new Response(JSON.stringify({ success: false, error: "Failed to verify code" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});

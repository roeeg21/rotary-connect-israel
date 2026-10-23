import { createFileRoute } from "@tanstack/react-router";
import { sendOTP } from "../../../lib/otp.server";

export const Route = createFileRoute("/api/auth/send-otp")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { email } = body as { email: string };

          if (!email || typeof email !== "string") {
            return new Response(JSON.stringify({ success: false, error: "Email is required" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const result = await sendOTP(email);

          if (!result.success) {
            return new Response(JSON.stringify({ success: false, error: result.error }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          return new Response(
            JSON.stringify({
              success: true,
              sessionKey: result.sessionKey,
              message: "OTP sent successfully",
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        } catch (error) {
          console.error("Send OTP error:", error);
          return new Response(JSON.stringify({ success: false, error: "Failed to send OTP" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});

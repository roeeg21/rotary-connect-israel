import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Mail } from "lucide-react";
import { useState } from "react";

import { Logo, RotaryWheel } from "@/components/brand/RotaryMark";
import { SearchField } from "@/components/SearchField";
import { useAppState } from "@/lib/app-state";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "כניסה לחשבון | Rotary Connect Israel" },
      { name: "description", content: "כניסה לרוטרי קונקט ישראל — רשת הקשרים של חברי רוטרי." },
      { property: "og:title", content: "Sign in to Rotary Connect Israel" },
      { property: "og:description", content: "Sign in to the Rotary Israel professional network." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { lang, t, dir } = useI18n();
  const navigate = useNavigate();
  const { guestSearches } = useAppState();
  const [email, setEmail] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const he = lang === "he";
  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center py-10">
      <div className="container-narrow">
        {/* Card Container */}
        <div className="mx-auto max-w-md">
          {/* Logo & Title */}
          <div className="text-center">
            <div className="flex justify-center">
              <Logo size="lg" />
            </div>
            <h1 className="mt-6 text-2xl font-bold tracking-tight">
              {he ? "כניסה לחשבון" : "Sign in"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">{t("tagline")}</p>
          </div>

          {/* Login Form */}
          <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void navigate({ to: "/register" });
              }}
            >
              <label className="block">
                <span className="text-xs font-medium text-muted-foreground">
                  {he ? "דוא״ל או טלפון" : "Email or phone"}
                </span>
                <div className="relative mt-2">
                  <Mail
                    className={`pointer-events-none absolute top-1/2 -translate-y-1/2 start-4 size-4 transition-colors ${
                      isFocused ? "text-primary" : "text-muted-foreground"
                    }`}
                    strokeWidth={1.8}
                  />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className="h-12 w-full rounded-xl border bg-card ps-11 pe-4 text-[15px] transition-all outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10"
                    placeholder="name@example.com"
                  />
                </div>
              </label>

              <button
                type="submit"
                className="mt-4 flex h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-raised"
              >
                {he ? "שליחת קוד חד־פעמי" : "Send one-time code"}
              </button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center gap-4">
              <span className="h-px flex-1 bg-border" />
              <span className="text-xs font-medium text-muted-foreground">{he ? "או" : "or"}</span>
              <span className="h-px flex-1 bg-border" />
            </div>

            {/* Google Sign In */}
            <button
              type="button"
              onClick={() => void navigate({ to: "/register" })}
              className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-border bg-card text-sm font-semibold transition-all hover:bg-secondary"
            >
              <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.9Z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.1-4 1.1-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24Z"
                />
                <path fill="#FBBC05" d="M5.4 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.4a12 12 0 0 0 0 10.8l4-3.1Z" />
                <path
                  fill="#EA4335"
                  d="M12 4.8c1.8 0 3.3.6 4.5 1.8l3.4-3.4A12 12 0 0 0 1.4 6.6l4 3.1C6.3 6.9 8.9 4.8 12 4.8Z"
                />
              </svg>
              {he ? "המשך עם Google" : "Continue with Google"}
            </button>

            <p className="mt-3 text-center text-xs text-muted-foreground">
              {he
                ? "גם בכניסה עם Google יש להשלים את שאלון ההרשמה."
                : "Even with Google sign-in you must complete the registration questionnaire."}
            </p>
          </div>

          {/* Try Before Register */}
          <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="flex items-start gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gold-soft">
                <RotaryWheel className="size-5 text-gold" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">
                  {he ? "רוצים לנסות לפני ההרשמה?" : "Want to try before registering?"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {guestSearches >= 1 ? t("guestLimitBody") : t("guestOneSearch")}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <SearchField size="md" />
            </div>
          </div>

          {/* Create Account Link */}
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              {he ? "אין לכם חשבון?" : "No account yet?"}{" "}
            </p>
            <Link
              to="/register"
              className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            >
              {t("createAccount")}
              <Arrow className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

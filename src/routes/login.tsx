import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
  const { lang, t } = useI18n();
  const navigate = useNavigate();
  const { guestSearches } = useAppState();
  const [email, setEmail] = useState("");

  const he = lang === "he";

  return (
    <div className="container-app max-w-md py-10 sm:py-16">
      <div className="flex justify-center">
        <Logo size="lg" />
      </div>

      <h1 className="mt-8 text-center font-heading text-xl font-bold">
        {he ? "כניסה לחשבון" : "Sign in"}
      </h1>
      <p className="text-muted-foreground mt-1 text-center text-sm">{t("tagline")}</p>

      <form
        className="mt-6 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          void navigate({ to: "/register" });
        }}
      >
        <label className="block">
          <span className="text-muted-foreground text-xs font-semibold">
            {he ? "דוא״ל או טלפון" : "Email or phone"}
          </span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-card focus:border-primary mt-1.5 h-11 w-full rounded-md border border-border px-3 text-sm outline-none"
            placeholder="name@example.com"
          />
        </label>
        <button
          type="submit"
          className="bg-primary text-primary-foreground hover:bg-primary/90 h-11 w-full rounded-md text-sm font-semibold"
        >
          {he ? "שליחת קוד חד־פעמי" : "Send one-time code"}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-muted-foreground text-xs">{he ? "או" : "or"}</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <button
        type="button"
        onClick={() => void navigate({ to: "/register" })}
        className="hover:bg-secondary flex h-11 w-full items-center justify-center gap-3 rounded-md border border-border text-sm font-semibold"
      >
        <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
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
      <p className="text-muted-foreground mt-2 text-center text-xs">
        {he
          ? "גם בכניסה עם Google יש להשלים את שאלון ההרשמה."
          : "Even with Google sign-in you must complete the registration questionnaire."}
      </p>

      <section className="bg-surface mt-10 rounded-lg border border-border p-5">
        <p className="flex items-center gap-2 font-heading text-sm font-bold">
          <RotaryWheel className="text-gold h-5 w-5" />
          {he ? "רוצים לנסות לפני ההרשמה?" : "Want to try before registering?"}
        </p>
        <p className="text-muted-foreground mt-1 text-sm">
          {guestSearches >= 1 ? t("guestLimitBody") : t("guestOneSearch")}
        </p>
        <div className="mt-3">
          <SearchField size="md" />
        </div>
      </section>

      <p className="text-muted-foreground mt-6 text-center text-sm">
        {he ? "אין לכם חשבון?" : "No account yet?"}{" "}
        <Link to="/register" className="text-primary font-semibold">
          {t("createAccount")}
        </Link>
      </p>
    </div>
  );
}

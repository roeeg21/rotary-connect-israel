import { createFileRoute, Link } from "@tanstack/react-router";
import { LogOut, UserRound } from "lucide-react";

import { PersonAvatar } from "@/components/PersonAvatar";
import { clubs } from "@/data/clubs";
import { useAppState } from "@/lib/app-state";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/me")({
  head: () => ({
    meta: [
      { title: "הפרופיל שלי | Rotary Connect Israel" },
      { name: "description", content: "ניהול הפרופיל האישי, הפרטיות והחשבון ברוטרי קונקט." },
      { property: "og:title", content: "My Rotary Connect profile" },
      { property: "og:description", content: "Manage your profile, privacy and account." },
    ],
  }),
  component: MePage,
});

function MePage() {
  const { t, lang, setLang } = useI18n();
  const { account, signOut, saved } = useAppState();

  if (!account) {
    return (
      <div className="container-app max-w-md py-12">
        <div className="flex flex-col items-center rounded-lg border border-dashed border-border py-16 text-center">
          <UserRound className="text-muted-foreground size-8" aria-hidden />
          <p className="mt-4 font-heading font-semibold">{t("notSignedIn")}</p>
          <p className="text-muted-foreground mt-1 max-w-xs text-sm">{t("notSignedInHint")}</p>
          <div className="mt-5 flex gap-2">
            <Link
              to="/register-form"
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2.5 text-sm font-semibold"
            >
              {t("createAccount")}
            </Link>
            <Link
              to="/login"
              className="hover:bg-secondary rounded-md border border-border px-4 py-2.5 text-sm font-medium"
            >
              {t("signIn")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const club = clubs.find((c) => c.id === account.club);
  const fullName = `${account.firstName} ${account.lastName}`;

  return (
    <div className="container-app max-w-2xl py-8 sm:py-12">
      <header className="flex items-center gap-4">
        <PersonAvatar name={fullName} photo={account.photo} size="lg" />
        <div className="min-w-0">
          <h1 className="font-heading truncate text-xl font-bold">{fullName}</h1>
          <p className="text-muted-foreground truncate text-sm">
            {club ? club[lang] : account.club}
          </p>
        </div>
      </header>

      <dl className="mt-8 divide-y divide-border border-y border-border text-sm">
        <div className="flex items-center justify-between py-3.5">
          <dt className="text-muted-foreground">Email</dt>
          <dd className="font-medium">{account.email}</dd>
        </div>
        <div className="flex items-center justify-between py-3.5">
          <dt className="text-muted-foreground">{t("savedTitle")}</dt>
          <dd className="font-medium">{saved.length}</dd>
        </div>
        <div className="flex items-center justify-between py-3.5">
          <dt className="text-muted-foreground">{t("language")}</dt>
          <dd>
            <button
              type="button"
              onClick={() => setLang(lang === "he" ? "en" : "he")}
              className="text-primary font-semibold"
            >
              {lang === "he" ? "עברית" : "English"}
            </button>
          </dd>
        </div>
      </dl>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          to="/register-form"
          className="hover:bg-secondary rounded-md border border-border px-4 py-2.5 text-sm font-semibold"
        >
          {t("editProfile")}
        </Link>
        <button
          type="button"
          onClick={signOut}
          className="text-destructive hover:bg-secondary inline-flex items-center gap-2 rounded-md border border-border px-4 py-2.5 text-sm font-semibold"
        >
          <LogOut className="size-4" aria-hidden />
          {t("signOut")}
        </button>
      </div>
    </div>
  );
}

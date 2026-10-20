import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Globe,
  Lock,
  RotateCcw,
  User,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Logo } from "@/components/brand/RotaryMark";
import { ChatContainer, ProgressIndicator } from "@/components/chat";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/lib/app-state";
import { useI18n } from "@/lib/i18n";
import { useConversation } from "@/lib/useConversation";
import { processMessage, completeRegistration } from "@/lib/chat.functions";
import type { ConversationState } from "@/lib/conversation";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "הרשמה חכמה — Rotary Connect Israel" },
      {
        name: "description",
        content: "הצטרפו לרוטרי קונקט ישראל בשיחה פשוטה ונעימה עם העוזר החכם שלנו.",
      },
      { property: "og:title", content: "Smart Registration — Rotary Connect Israel" },
      {
        property: "og:description",
        content:
          "Join Rotary Connect Israel through a simple and friendly conversation with our AI assistant.",
      },
    ],
  }),
  component: RegisterChatPage,
});

function RegisterChatPage() {
  const navigate = useNavigate();
  const { signIn } = useAppState();
  const { lang, dir, toggleLang } = useI18n();
  const processMessageFn = useServerFn(processMessage);
  const completeRegistrationFn = useServerFn(completeRegistration);
  const isRTL = lang === "he";

  // Password setup state
  const [showPasswordSetup, setShowPasswordSetup] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedState, setCompletedState] = useState<ConversationState | null>(null);

  // Handle registration completion - show password setup screen
  const handleComplete = useCallback(async (state: ConversationState) => {
    setCompletedState(state);
    setShowPasswordSetup(true);
  }, []);

  // Handle password submission
  const handlePasswordSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setPasswordError(null);

      // Validate password
      if (password.length < 6) {
        setPasswordError(
          lang === "he"
            ? "הסיסמה חייבת להכיל לפחות 6 תווים"
            : "Password must be at least 6 characters",
        );
        return;
      }

      if (password !== confirmPassword) {
        setPasswordError(lang === "he" ? "הסיסמאות אינן תואמות" : "Passwords do not match");
        return;
      }

      if (!completedState) return;

      setIsSubmitting(true);

      try {
        // Complete registration on server
        const result = await completeRegistrationFn({
          data: { state: completedState },
        });
        if (!result.success) throw new Error("Registration could not be saved");
        sessionStorage.removeItem("rotary-chat-session");

        // Sign in the user with collected data
        signIn({
          firstName: completedState.profile.firstName || "",
          lastName: completedState.profile.lastName || "",
          email: completedState.profile.email || "",
          club: completedState.clubId || completedState.customClub || "",
          onboarded: true,
        });

        // Navigate to profile page
        await navigate({ to: "/me" });
      } catch (error) {
        console.error("Registration completion failed:", error);
        setPasswordError(
          lang === "he" ? "אירעה שגיאה. נסה שוב." : "An error occurred. Please try again.",
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [password, confirmPassword, completedState, completeRegistrationFn, signIn, navigate, lang],
  );

  // Send message function that calls the server with full conversation history
  const sendMessageToServer = useCallback(
    async (
      message: string,
      state: ConversationState,
      conversationHistory?: import("@/lib/conversation").ChatMessage[],
    ) => {
      const response = await processMessageFn({
        data: {
          message,
          state,
          ...(conversationHistory
            ? {
                conversationHistory: conversationHistory.map((m) => ({
                  id: m.id,
                  role: m.role,
                  content: m.content,
                  timestamp: m.timestamp,
                })),
              }
            : {}),
        },
      });
      return response;
    },
    [processMessageFn],
  );

  // Initialize conversation
  const {
    state,
    messages,
    quickReplies,
    isLoading,
    progress,
    sendMessage,
    handleQuickReply,
    setLanguage,
    reset,
  } = useConversation({
    language: lang,
    onComplete: handleComplete,
    // Enable AI-powered conversation with server function
    sendMessageFn: sendMessageToServer,
  });

  useEffect(() => {
    if (!showPasswordSetup && state.currentStage === "completed" && state.status === "review") {
      void handleComplete(state);
    }
  }, [state, handleComplete, showPasswordSetup]);

  // Switch interview language while preserving information already collected.
  const prevLangRef = useRef(lang);
  useEffect(() => {
    if (prevLangRef.current !== lang) {
      prevLangRef.current = lang;
      setLanguage(lang);
    }
  }, [lang, setLanguage]);

  // Translation helper
  const tr = useMemo(() => (he: string, en: string) => (lang === "he" ? he : en), [lang]);

  // Show password setup screen when registration chat is complete
  if (showPasswordSetup && completedState) {
    return (
      <div
        className="fixed inset-0 flex flex-col overflow-hidden bg-background"
        dir={dir}
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {/* Header */}
        <header className="shrink-0 border-b border-border bg-card/95 backdrop-blur-sm">
          <div className="mx-auto flex h-14 max-w-3xl items-center justify-center px-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <Logo size="sm" />
              <span className="font-heading text-sm font-semibold">
                {tr("סיום ההרשמה", "Complete Registration")}
              </span>
            </div>
          </div>
        </header>

        {/* Password Setup Form */}
        <div className="flex flex-1 items-center justify-center p-4">
          <div className="w-full max-w-md">
            {/* Success Icon */}
            <div className="mb-6 flex justify-center">
              <div className="flex size-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <Check className="size-10 text-green-600 dark:text-green-400" />
              </div>
            </div>

            {/* Welcome Message */}
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold text-foreground">
                {tr(
                  `ברוך הבא, ${completedState.profile.firstName}!`,
                  `Welcome, ${completedState.profile.firstName}!`,
                )}
              </h1>
              <p className="mt-2 text-muted-foreground">
                {tr(
                  "כעת צור סיסמה כדי לגשת לפרופיל שלך",
                  "Now create a password to access your profile",
                )}
              </p>
            </div>

            {/* Password Form */}
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {/* Password Field */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-sm font-medium text-foreground"
                >
                  {tr("סיסמה", "Password")}
                </label>
                <div className="relative">
                  <Lock className="absolute start-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={tr("לפחות 6 תווים", "At least 6 characters")}
                    className="h-12 w-full rounded-xl border border-border bg-card pe-12 ps-11 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10"
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-1.5 block text-sm font-medium text-foreground"
                >
                  {tr("אימות סיסמה", "Confirm Password")}
                </label>
                <div className="relative">
                  <Lock className="absolute start-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={tr("הזן שוב את הסיסמה", "Enter password again")}
                    className="h-12 w-full rounded-xl border border-border bg-card ps-11 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10"
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              {/* Error Message */}
              {passwordError && <p className="text-sm text-red-500">{passwordError}</p>}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-12 w-full rounded-xl text-base font-semibold"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    {tr("מסיים...", "Finishing...")}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <User className="size-5" />
                    {tr("צור חשבון וגש לפרופיל", "Create Account & View Profile")}
                  </span>
                )}
              </Button>
            </form>

            {/* Profile Summary */}
            <div className="mt-8 rounded-xl border border-border bg-card/50 p-4">
              <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
                {tr("פרטי החשבון שלך", "Your Account Details")}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{tr("שם", "Name")}</span>
                  <span className="font-medium">
                    {completedState.profile.firstName} {completedState.profile.lastName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{tr("אימייל", "Email")}</span>
                  <span className="font-medium">{completedState.profile.email}</span>
                </div>
                {completedState.profile.profession && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{tr("מקצוע", "Profession")}</span>
                    <span className="font-medium">{completedState.profile.profession}</span>
                  </div>
                )}
                {(completedState.clubId || completedState.customClub) && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{tr("מועדון", "Club")}</span>
                    <span className="font-medium">
                      {completedState.customClub || completedState.clubId}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden bg-background"
      dir={dir}
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* Header - fixed at top */}
      <header className="shrink-0 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          {/* Back button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate({ to: "/" })}
            aria-label={tr("חזרה", "Back")}
          >
            {isRTL ? <ArrowRight className="size-5" /> : <ArrowLeft className="size-5" />}
          </Button>

          {/* Logo and title */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Logo size="sm" />
            <span className="hidden font-heading text-sm font-semibold min-[400px]:inline">
              {tr("הרשמה חכמה", "Smart Registration")}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {/* Language toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleLang}
              aria-label={tr("החלפת שפה", "Toggle language")}
            >
              <Globe className="size-5" />
            </Button>

            {/* Reset conversation */}
            <Button
              variant="ghost"
              size="icon"
              onClick={reset}
              aria-label={tr("התחלה מחדש", "Start over")}
            >
              <RotateCcw className="size-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Progress indicator - fixed below header */}
      <div className="shrink-0">
        <ProgressIndicator
          currentStage={showPasswordSetup ? "completed" : state.currentStage}
          progress={showPasswordSetup ? 100 : progress}
          isRTL={isRTL}
        />
      </div>

      {/* Chat container - fills remaining space, only messages scroll */}
      <div className="min-h-0 flex-1">
        <div className="mx-auto h-full max-w-3xl">
          <ChatContainer
            messages={messages}
            quickReplies={quickReplies}
            onSendMessage={sendMessage}
            onQuickReplySelect={handleQuickReply}
            isLoading={isLoading}
            isRTL={isRTL}
            className="h-full"
          />
        </div>
      </div>

      {/* Alternative registration link - fixed at bottom */}
      <div className="shrink-0 border-t border-border bg-surface/95 py-2 text-center backdrop-blur-sm">
        <p className="text-sm text-muted-foreground">
          {tr("מעדיפים טופס מסורתי?", "Prefer a traditional form?")}{" "}
          <button
            onClick={() => {
              // Build search params with collected data
              const params = new URLSearchParams();
              if (state.profile.firstName) params.set("firstName", state.profile.firstName);
              if (state.profile.lastName) params.set("lastName", state.profile.lastName);
              if (state.profile.email) params.set("email", state.profile.email);
              if (state.contactInfo?.phone) params.set("phone", state.contactInfo.phone);
              if (state.profile.city) params.set("city", state.profile.city);
              if (state.profile.profession) params.set("profession", state.profile.profession);
              if (state.profile.workplace) params.set("workplace", state.profile.workplace);
              if (state.clubId) params.set("club", state.clubId);

              const queryString = params.toString();
              navigate({ to: `/register-form${queryString ? `?${queryString}` : ""}` });
            }}
            className="font-medium text-primary hover:underline"
          >
            {tr("לחצו כאן", "Click here")}
          </button>
        </p>
      </div>
    </div>
  );
}

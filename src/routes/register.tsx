import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ArrowRight, Globe, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef } from "react";

import { Logo } from "@/components/brand/RotaryMark";
import { ChatContainer, ProgressIndicator } from "@/components/chat";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/lib/app-state";
import { useI18n } from "@/lib/i18n";
import { useConversation } from "@/lib/useConversation";
import { processMessage } from "@/lib/chat.functions";
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
        content: "Join Rotary Connect Israel through a simple and friendly conversation with our AI assistant.",
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
  const isRTL = lang === "he";

  // Handle registration completion
  const handleComplete = useCallback(
    async (state: ConversationState) => {
      // Sign in the user with collected data
      signIn({
        firstName: state.profile.firstName || "",
        lastName: state.profile.lastName || "",
        email: state.profile.email || "",
        club: state.clubId || state.customClub || "",
        onboarded: true,
      });

      // Navigate to home
      await navigate({ to: "/" });
    },
    [signIn, navigate]
  );

  // Send message function that calls the server
  const sendMessageToServer = useCallback(
    async (message: string, state: ConversationState) => {
      const response = await processMessageFn({
        data: { message, state },
      });
      return response;
    },
    [processMessageFn]
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
    reset,
  } = useConversation({
    language: lang,
    onComplete: handleComplete,
    // Use demo mode for now (no server function)
    // sendMessageFn: sendMessageToServer,
  });

  // Track language changes and reset conversation
  const prevLangRef = useRef(lang);
  useEffect(() => {
    if (prevLangRef.current !== lang) {
      prevLangRef.current = lang;
      reset(); // Reset conversation to start fresh in new language
    }
  }, [lang, reset]);

  // Translation helper
  const tr = useMemo(
    () => (he: string, en: string) => (lang === "he" ? he : en),
    [lang]
  );

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-background" dir={dir}>
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
            {isRTL ? (
              <ArrowRight className="size-5" />
            ) : (
              <ArrowLeft className="size-5" />
            )}
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
          currentStage={state.currentStage}
          progress={progress}
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

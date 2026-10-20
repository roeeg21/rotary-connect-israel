import type { ChatMessage, ChatResponse, ConversationState } from "./conversation";
import { createMessage } from "./conversation";

/** Gemini extracts profile changes and asks adaptive follow-ups in one request. */
export async function processUserMessage(
  message: string,
  state: ConversationState,
  conversationHistory: ChatMessage[] = [],
): Promise<ChatResponse> {
  try {
    const { processRegistrationMessage } = await import("./ai-registration-interviewer.server");
    return await processRegistrationMessage(message, conversationHistory ?? [], state);
  } catch (error) {
    console.error(
      "Registration interview unavailable:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return {
      messages: [
        createMessage(
          "assistant",
          state.language === "he"
            ? "הראיון החכם אינו זמין כרגע. הפרטים שכבר נאספו נשמרו בשיחה. אפשר לנסות שוב בעוד רגע או להמשיך דרך הקישור לטופס ההרשמה למטה."
            : "The smart interview is temporarily unavailable. Your conversation details are still saved. Please try again shortly or use the registration form link below.",
        ),
      ],
      state: {},
    };
  }
}

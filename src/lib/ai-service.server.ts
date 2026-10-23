import type { ChatMessage, ChatResponse, ConversationState } from "./conversation";
import { createMessage } from "./conversation";
import { isOpenAIConfigured } from "./openai-client.server";
import { isGeminiConfigured } from "./gemini-client.server";

/** AI extracts profile changes and asks adaptive follow-ups in one request. */
export async function processUserMessage(
  message: string,
  state: ConversationState,
  conversationHistory: ChatMessage[] = [],
): Promise<ChatResponse> {
  try {
    const { processRegistrationMessage } = await import("./ai-registration-interviewer.server");
    return await processRegistrationMessage(message, conversationHistory ?? [], state);
  } catch (error) {
    console.warn(
      "Registration interview fallback activated:",
      error instanceof Error ? error.message : "Unknown error",
    );
    const { createLocalFallbackResponse } = await import("./ai-registration-interviewer.server");
    return createLocalFallbackResponse(message, state);
  }
}

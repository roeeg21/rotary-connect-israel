import { json } from "@tanstack/start";
import { createAPIFileRoute } from "@tanstack/start/api";
import { processUserMessage } from "@/lib/ai-service.server";
import { applyChatResponse } from "@/lib/conversation";
import type { ConversationState, ChatMessage } from "@/lib/conversation";
import { saveConversationSession } from "@/lib/chat.server";
import { generateId } from "@/lib/utils";

export const APIRoute = createAPIFileRoute("/api/chat/message")({
  POST: async ({ request }) => {
    try {
      const body = await request.json();
      const { message, state, history } = body as {
        message: string;
        state: ConversationState;
        history?: ChatMessage[];
      };

      if (!message || typeof message !== "string") {
        return json({ error: "Message is required" }, { status: 400 });
      }

      if (!state || !state.sessionId) {
        return json({ error: "State is required" }, { status: 400 });
      }

      // Process the message using AI service
      const response = await processUserMessage(message, state, history);

      // Save updated session state
      const updatedState = applyChatResponse(state, response);
      saveConversationSession(updatedState, [...(history ?? []), ...response.messages]).catch(
        (err) => console.error("Failed to save session:", err)
      );

      return json(response);
    } catch (error) {
      console.error("Chat message error:", error);

      // Return error message in the chat format
      return json({
        messages: [
          {
            id: generateId(),
            role: "assistant" as const,
            content: "Sorry, an error occurred. Please try again.",
            timestamp: Date.now(),
          },
        ],
        state: {},
      });
    }
  },
});

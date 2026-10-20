import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { ChatResponse, ConversationState } from "./conversation";
import { processUserMessage } from "./ai-service.server";
import { saveConversationSession, getConversationSession } from "./chat.server";
import { generateId } from "./utils";
import {
  applyChatResponse,
  STAGE_ORDER,
  extractedProfileSchema,
  extractedSpouseSchema,
  extractedChildSchema,
} from "./conversation";
import { contactInfoSchema } from "./user-registration";
import { ageFromBirthDate, MIN_CHILD_AGE, toRegistrationInput } from "./registration-interview";

// Zod schema for conversation state validation
const conversationStateSchema = z.object({
  sessionId: z.string(),
  language: z.enum(["he", "en"]),
  currentStage: z.enum(STAGE_ORDER),
  completedStages: z.array(z.enum(STAGE_ORDER)),
  pendingQuestions: z.array(z.string()),
  profile: extractedProfileSchema,
  contactInfo: contactInfoSchema.default({}),
  spouse: extractedSpouseSchema.optional(),
  children: z.array(extractedChildSchema).transform((children) =>
    children.filter((child) => {
      const age = child.dateOfBirth ? ageFromBirthDate(child.dateOfBirth) : child.age;
      return age !== undefined && age >= MIN_CHILD_AGE;
    }),
  ),
  networkingPreferences: z.record(z.unknown()),
  clubId: z.string().optional(),
  customClub: z.string().optional(),
  joinYear: z.string().optional(),
  rotaryJoinDate: z.string().optional(),
  hasSpouse: z.boolean().optional(),
  hasChildren: z.boolean().optional(),
  hasEligibleChildren: z.boolean().optional(),
  skippedFields: z.array(z.string()).default([]),
  consent: z.record(z.boolean()),
  status: z.enum(["in_progress", "review", "completed", "abandoned"]),
  createdAt: z.number(),
  updatedAt: z.number(),
  lastMessageAt: z.number(),
});

const chatMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
  timestamp: z.number(),
  quickReplies: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        value: z.string(),
      }),
    )
    .optional(),
});

const processMessageInputSchema = z.object({
  message: z.string().min(1).max(5000),
  state: conversationStateSchema,
  conversationHistory: z.array(chatMessageSchema).max(400).optional(),
});

/**
 * Server function to process a chat message
 */
export const processMessage = createServerFn({
  method: "POST",
})
  .validator(
    (data: {
      message: string;
      state: ConversationState;
      conversationHistory?: Array<{ id: string; role: string; content: string; timestamp: number }>;
    }) => processMessageInputSchema.parse(data),
  )
  .handler(async ({ data }): Promise<ChatResponse> => {
    const { message, state, conversationHistory } = data;

    try {
      // Process the message using AI service (with conversation history for context)
      const response = await processUserMessage(
        message,
        state as ConversationState,
        conversationHistory as import("./conversation").ChatMessage[] | undefined,
      );

      // Save updated session state to database
      const updatedState = applyChatResponse(state as ConversationState, response);
      const messages = [...(conversationHistory ?? []), ...response.messages];
      saveConversationSession(updatedState, messages).catch((err) =>
        console.error("Failed to save session:", err),
      );

      return response;
    } catch (error) {
      console.error("Error processing message:", error);

      // Return error response
      return {
        messages: [
          {
            id: generateId(),
            role: "assistant" as const,
            content:
              state.language === "he"
                ? "מצטער, אירעה שגיאה. נסה שוב בעוד רגע."
                : "Sorry, an error occurred. Please try again in a moment.",
            timestamp: Date.now(),
          },
        ],
        state: {},
      } satisfies ChatResponse;
    }
  });

const resumeSessionInputSchema = z.object({
  sessionId: z.string(),
});

/**
 * Server function to resume a saved session
 */
export const resumeSession = createServerFn({
  method: "POST",
})
  .validator((data: { sessionId: string }) => resumeSessionInputSchema.parse(data))
  .handler(async ({ data }) => {
    const { sessionId } = data;

    try {
      const session = await getConversationSession(sessionId);

      if (!session) {
        return { found: false, session: null };
      }

      return { found: true, session };
    } catch (error) {
      console.error("Error resuming session:", error);
      return { found: false, session: null };
    }
  });

const completeRegistrationInputSchema = z.object({
  state: conversationStateSchema,
});

/**
 * Server function to complete registration
 */
export const completeRegistration = createServerFn({
  method: "POST",
})
  .validator((data: { state: ConversationState }) => completeRegistrationInputSchema.parse(data))
  .handler(async ({ data }) => {
    const { state } = data;

    try {
      // Import the existing registration function
      const { upsertUserRegistration } = await import("./users.server");

      if (state.currentStage !== "completed")
        throw new Error("Please confirm the profile summary first");
      const registrationData = toRegistrationInput(state as ConversationState);

      // Save to database
      await upsertUserRegistration(registrationData);

      // Mark session as completed
      await saveConversationSession({
        ...(state as ConversationState),
        status: "completed",
        updatedAt: Date.now(),
      });

      return { success: true };
    } catch (error) {
      console.error("Error completing registration:", error);
      return { success: false, error: String(error) };
    }
  });

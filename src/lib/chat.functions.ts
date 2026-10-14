import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { ChatResponse, ConversationState } from "./conversation";
import { processUserMessage } from "./ai-service.server";
import { saveConversationSession, getConversationSession } from "./chat.server";

// Zod schema for conversation state validation
const conversationStateSchema = z.object({
  sessionId: z.string(),
  language: z.enum(["he", "en"]),
  currentStage: z.string(),
  completedStages: z.array(z.string()),
  pendingQuestions: z.array(z.string()),
  profile: z.record(z.unknown()),
  spouse: z.record(z.unknown()).optional(),
  children: z.array(z.record(z.unknown())),
  networkingPreferences: z.record(z.unknown()),
  clubId: z.string().optional(),
  customClub: z.string().optional(),
  joinYear: z.string().optional(),
  consent: z.record(z.boolean()),
  status: z.enum(["in_progress", "review", "completed", "abandoned"]),
  createdAt: z.number(),
  updatedAt: z.number(),
  lastMessageAt: z.number(),
});

const processMessageInputSchema = z.object({
  message: z.string().min(1).max(5000),
  state: conversationStateSchema,
});

/**
 * Server function to process a chat message
 */
export const processMessage = createServerFn({
  method: "POST",
})
  .validator((data: { message: string; state: ConversationState }) =>
    processMessageInputSchema.parse(data)
  )
  .handler(async ({ data }) => {
    const { message, state } = data;

    try {
      // Process the message using AI service
      const response = await processUserMessage(message, state as ConversationState);

      // Save updated session state to database
      const updatedState = {
        ...state,
        ...response.state,
        currentStage: response.nextStage || state.currentStage,
        completedStages: response.nextStage
          ? [...state.completedStages, state.currentStage]
          : state.completedStages,
        updatedAt: Date.now(),
        lastMessageAt: Date.now(),
      } as ConversationState;

      // Persist to database (fire and forget for speed)
      saveConversationSession(updatedState).catch((err) =>
        console.error("Failed to save session:", err)
      );

      return response;
    } catch (error) {
      console.error("Error processing message:", error);

      // Return error response
      return {
        messages: [
          {
            id: crypto.randomUUID(),
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
  .validator((data: { state: ConversationState }) =>
    completeRegistrationInputSchema.parse(data)
  )
  .handler(async ({ data }) => {
    const { state } = data;

    try {
      // Import the existing registration function
      const { upsertUserRegistration } = await import("./users.server");

      // Transform conversation state to registration format
      const registrationData = {
        firstName: state.profile.firstName || "",
        lastName: state.profile.lastName || "",
        email: state.profile.email || "",
        dob: "", // Would need to be collected or generated
        clubId: state.clubId || "",
        customClub: state.customClub || "",
        joinYear: state.joinYear || "",
        socialProfiles: {
          facebook: "",
          instagram: "",
          linkedin: "",
        },
        me: {
          gender: "",
          age: "",
          education: "",
          jobs: state.profile.workplace
            ? [
                {
                  employer: state.profile.workplace,
                  role: state.profile.jobTitle || state.profile.profession || "",
                  from: "",
                  to: "",
                  description: "",
                },
              ]
            : [],
          boards: "",
          hobbies: state.profile.interests?.join(", ") || "",
        },
        married: state.spouse ? ("yes" as const) : ("no" as const),
        spouse: state.spouse
          ? {
              gender: "",
              age: "",
              education: "",
              jobs: state.spouse.workplace
                ? [
                    {
                      employer: state.spouse.workplace,
                      role: state.spouse.jobTitle || state.spouse.profession || "",
                      from: "",
                      to: "",
                      description: "",
                    },
                  ]
                : [],
              boards: "",
              hobbies: "",
            }
          : null,
        children: state.children.map((child) => ({
          name: child.name || "",
          dob: "", // Would need birth date
          status: child.profession || child.education || "",
        })),
        onboarded: true as const,
      };

      // Save to database
      await upsertUserRegistration(registrationData);

      // Mark session as completed
      await saveConversationSession({
        ...state,
        status: "completed",
        updatedAt: Date.now(),
      });

      return { success: true };
    } catch (error) {
      console.error("Error completing registration:", error);
      return { success: false, error: String(error) };
    }
  });

import { useCallback, useEffect, useReducer, useRef } from "react";
import type {
  ChatMessage,
  ChatResponse,
  ConversationState,
  QuickReply,
  RegistrationStage,
} from "./conversation";
import {
  calculateProgress,
  createInitialState,
  createMessage,
  getRegistrationGreeting,
  applyChatResponse,
} from "./conversation";
import { generateId } from "./utils";

// Action types
type ConversationAction =
  | { type: "SET_STATE"; payload: ConversationState }
  | { type: "ADD_MESSAGE"; payload: ChatMessage }
  | { type: "ADD_MESSAGES"; payload: ChatMessage[] }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_QUICK_REPLIES"; payload: QuickReply[] }
  | { type: "UPDATE_STATE"; payload: Partial<ConversationState> }
  | { type: "SET_STAGE"; payload: RegistrationStage }
  | { type: "SET_LANGUAGE"; payload: "he" | "en" }
  | { type: "SET_ERROR"; payload: string | null }
  | {
      type: "RESET";
      payload: { state: ConversationState; message: ChatMessage; quickReplies: QuickReply[] };
    };

interface ConversationReducerState {
  state: ConversationState;
  messages: ChatMessage[];
  quickReplies: QuickReply[];
  isLoading: boolean;
  error: string | null;
}

const SESSION_STORAGE_KEY = "rotary-chat-session";

function conversationReducer(
  state: ConversationReducerState,
  action: ConversationAction,
): ConversationReducerState {
  switch (action.type) {
    case "SET_STATE":
      return { ...state, state: action.payload };

    case "ADD_MESSAGE":
      return { ...state, messages: [...state.messages, action.payload] };

    case "ADD_MESSAGES":
      return { ...state, messages: [...state.messages, ...action.payload] };

    case "SET_LOADING":
      return { ...state, isLoading: action.payload };

    case "SET_QUICK_REPLIES":
      return { ...state, quickReplies: action.payload };

    case "UPDATE_STATE":
      return {
        ...state,
        state: { ...state.state, ...action.payload, updatedAt: Date.now() },
      };

    case "SET_STAGE":
      return {
        ...state,
        state: {
          ...state.state,
          currentStage: action.payload,
          completedStages:
            state.state.currentStage !== action.payload
              ? [...state.state.completedStages, state.state.currentStage]
              : state.state.completedStages,
          updatedAt: Date.now(),
        },
      };

    case "SET_LANGUAGE":
      return {
        ...state,
        state: { ...state.state, language: action.payload, updatedAt: Date.now() },
      };

    case "SET_ERROR":
      return { ...state, error: action.payload };

    case "RESET":
      return {
        state: action.payload.state,
        messages: [action.payload.message],
        quickReplies: action.payload.quickReplies,
        isLoading: false,
        error: null,
      };

    default:
      return state;
  }
}

interface UseConversationOptions {
  language?: "he" | "en";
  onComplete?: (state: ConversationState) => void;
  onError?: (error: Error) => void;
  sendMessageFn: (
    message: string,
    state: ConversationState,
    conversationHistory?: ChatMessage[],
  ) => Promise<ChatResponse>;
}

export function useConversation(options: UseConversationOptions) {
  const { language = "he", onComplete, onError, sendMessageFn } = options;

  // Initialize state
  const [reducerState, dispatch] = useReducer(conversationReducer, {
    state: createInitialState(generateId(), language),
    messages: [],
    quickReplies: [],
    isLoading: false,
    error: null,
  });

  const { state, messages, quickReplies, isLoading, error } = reducerState;

  // Ref to track if we've initialized from storage
  const initialized = useRef(false);
  const inFlight = useRef(false);
  const requestVersion = useRef(0);

  // Load session from storage on mount
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    try {
      const saved = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) {
        const { state: savedState, messages: savedMessages } = JSON.parse(saved);
        if (savedState && savedState.status !== "completed") {
          dispatch({ type: "SET_STATE", payload: savedState });
          dispatch({ type: "ADD_MESSAGES", payload: savedMessages || [] });

          // Restore quick replies from the last assistant message
          const lastAssistantMessage = [...(savedMessages || [])]
            .reverse()
            .find((m: ChatMessage) => m.role === "assistant");
          if (lastAssistantMessage?.quickReplies?.length) {
            dispatch({ type: "SET_QUICK_REPLIES", payload: lastAssistantMessage.quickReplies });
          }
          return;
        }
      }
    } catch (e) {
      console.error("Failed to restore session:", e);
    }

    // If no saved session, add welcome message
    const welcomeMessage = createMessage("assistant", getRegistrationGreeting(language), []);

    dispatch({ type: "ADD_MESSAGE", payload: welcomeMessage });
    dispatch({
      type: "SET_QUICK_REPLIES",
      payload: welcomeMessage.quickReplies || [],
    });
  }, [language]);

  // Save to session storage on state changes
  useEffect(() => {
    if (state.status === "completed") {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      return;
    }

    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ state, messages }));
    } catch (e) {
      console.error("Failed to save session:", e);
    }
  }, [state, messages]);

  // Send message handler
  const sendMessage = useCallback(
    async (content: string) => {
      if (inFlight.current || !content.trim()) return;
      inFlight.current = true;
      const version = requestVersion.current;

      // Add user message
      const userMessage = createMessage("user", content);
      dispatch({ type: "ADD_MESSAGE", payload: userMessage });
      dispatch({ type: "SET_QUICK_REPLIES", payload: [] });
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });

      try {
        if (sendMessageFn) {
          // Use provided send function (for server integration)
          // Pass the full conversation history for AI context
          const fullHistory = [...messages, userMessage];
          const response = await sendMessageFn(content, state, fullHistory);
          if (version !== requestVersion.current) return;

          // Process response
          if (response.messages.length > 0) {
            dispatch({ type: "ADD_MESSAGES", payload: response.messages });
          }

          const updatedState = applyChatResponse(state, response);
          dispatch({ type: "SET_STATE", payload: updatedState });

          // Set quick replies from last assistant message
          const lastMessage = response.messages[response.messages.length - 1];
          if (lastMessage?.quickReplies) {
            dispatch({ type: "SET_QUICK_REPLIES", payload: lastMessage.quickReplies });
          }

          // Check for completion
          if (response.nextStage === "completed") {
            onComplete?.(updatedState);
          }
        }
      } catch (e) {
        if (version !== requestVersion.current) return;
        const error = e instanceof Error ? e : new Error("Unknown error");
        dispatch({ type: "SET_ERROR", payload: error.message });
        onError?.(error);

        // Add error message
        const errorMessage = createMessage(
          "assistant",
          language === "he"
            ? "מצטער, משהו השתבש. נסה שוב בעוד רגע."
            : "Sorry, something went wrong. Please try again in a moment.",
        );
        dispatch({ type: "ADD_MESSAGE", payload: errorMessage });
      } finally {
        if (version === requestVersion.current) {
          inFlight.current = false;
          dispatch({ type: "SET_LOADING", payload: false });
        }
      }
    },
    [messages, state, sendMessageFn, onComplete, onError, language],
  );

  // Quick reply handler
  const handleQuickReply = useCallback(
    (reply: QuickReply) => {
      sendMessage(reply.value);
    },
    [sendMessage],
  );

  // Language change handler
  const setLanguage = useCallback(
    (lang: "he" | "en") => {
      if (
        state.currentStage === "welcome" &&
        messages.length === 1 &&
        messages[0]?.role === "assistant"
      ) {
        dispatch({
          type: "RESET",
          payload: {
            state: { ...state, language: lang },
            message: createMessage("assistant", getRegistrationGreeting(lang), []),
            quickReplies: [],
          },
        });
        return;
      }
      dispatch({ type: "SET_LANGUAGE", payload: lang });
    },
    [state, messages],
  );

  // Reset conversation
  const reset = useCallback(() => {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    requestVersion.current++;
    inFlight.current = false;

    // Create fresh welcome message in current language
    const welcomeQuickReplies: QuickReply[] = [];

    const welcomeMessage = createMessage(
      "assistant",
      getRegistrationGreeting(language),
      welcomeQuickReplies,
    );

    // Reset everything at once
    dispatch({
      type: "RESET",
      payload: {
        state: createInitialState(generateId(), language),
        message: welcomeMessage,
        quickReplies: welcomeQuickReplies,
      },
    });
  }, [language]);

  // Calculate progress
  const progress = calculateProgress(state);

  return {
    // State
    state,
    messages,
    quickReplies,
    isLoading,
    error,
    progress,

    // Actions
    sendMessage,
    handleQuickReply,
    setLanguage,
    reset,
  };
}

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
  getNextStage,
} from "./conversation";

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
  | { type: "RESET"; payload: { state: ConversationState; message: ChatMessage; quickReplies: QuickReply[] } };

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
  action: ConversationAction
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
          completedStages: state.state.currentStage !== action.payload
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
  sendMessageFn?: (
    message: string,
    state: ConversationState
  ) => Promise<ChatResponse>;
}

export function useConversation(options: UseConversationOptions = {}) {
  const { language = "he", onComplete, onError, sendMessageFn } = options;

  // Initialize state
  const [reducerState, dispatch] = useReducer(conversationReducer, {
    state: createInitialState(crypto.randomUUID(), language),
    messages: [],
    quickReplies: [],
    isLoading: false,
    error: null,
  });

  const { state, messages, quickReplies, isLoading, error } = reducerState;

  // Ref to track if we've initialized from storage
  const initialized = useRef(false);

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
          const lastAssistantMessage = [...(savedMessages || [])].reverse().find(
            (m: ChatMessage) => m.role === "assistant"
          );
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
    const welcomeMessage = createMessage(
      "assistant",
      language === "he"
        ? "שלום! אני כאן כדי לעזור לך להצטרף לקהילת רוטרי קונקט ישראל. תוכל/י לשוחח איתי בשפה טבעית, ואני אדריך אותך לאורך כל התהליך.\n\nנתחיל?"
        : "Hello! I'm here to help you join the Rotary Connect Israel community. You can chat with me naturally, and I'll guide you through the entire process.\n\nShall we begin?",
      [
        { id: "start", label: language === "he" ? "בוא נתחיל!" : "Let's start!", value: "start" },
        { id: "info", label: language === "he" ? "ספר לי עוד" : "Tell me more", value: "info" },
      ]
    );

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
      sessionStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({ state, messages })
      );
    } catch (e) {
      console.error("Failed to save session:", e);
    }
  }, [state, messages]);

  // Send message handler
  const sendMessage = useCallback(
    async (content: string) => {
      if (isLoading) return;

      // Add user message
      const userMessage = createMessage("user", content);
      dispatch({ type: "ADD_MESSAGE", payload: userMessage });
      dispatch({ type: "SET_QUICK_REPLIES", payload: [] });
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });

      try {
        if (sendMessageFn) {
          // Use provided send function (for server integration)
          const response = await sendMessageFn(content, state);

          // Process response
          if (response.messages.length > 0) {
            dispatch({ type: "ADD_MESSAGES", payload: response.messages });
          }

          if (response.state) {
            dispatch({ type: "UPDATE_STATE", payload: response.state });
          }

          if (response.nextStage) {
            dispatch({ type: "SET_STAGE", payload: response.nextStage });
          }

          // Set quick replies from last assistant message
          const lastMessage = response.messages[response.messages.length - 1];
          if (lastMessage?.quickReplies) {
            dispatch({ type: "SET_QUICK_REPLIES", payload: lastMessage.quickReplies });
          }

          // Check for completion
          if (response.nextStage === "completed") {
            onComplete?.(state);
          }
        } else {
          // Demo mode - simulate AI response
          await simulateResponse(content, state, dispatch);
        }
      } catch (e) {
        const error = e instanceof Error ? e : new Error("Unknown error");
        dispatch({ type: "SET_ERROR", payload: error.message });
        onError?.(error);

        // Add error message
        const errorMessage = createMessage(
          "assistant",
          language === "he"
            ? "מצטער, משהו השתבש. נסה שוב בעוד רגע."
            : "Sorry, something went wrong. Please try again in a moment."
        );
        dispatch({ type: "ADD_MESSAGE", payload: errorMessage });
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    },
    [isLoading, state, sendMessageFn, onComplete, onError, language]
  );

  // Quick reply handler
  const handleQuickReply = useCallback(
    (reply: QuickReply) => {
      sendMessage(reply.value);
    },
    [sendMessage]
  );

  // Language change handler
  const setLanguage = useCallback((lang: "he" | "en") => {
    dispatch({ type: "SET_LANGUAGE", payload: lang });
  }, []);

  // Reset conversation
  const reset = useCallback(() => {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);

    // Create fresh welcome message in current language
    const welcomeQuickReplies: QuickReply[] = [
      { id: "start", label: language === "he" ? "בוא נתחיל!" : "Let's start!", value: "start" },
      { id: "info", label: language === "he" ? "ספר לי עוד" : "Tell me more", value: "info" },
    ];

    const welcomeMessage = createMessage(
      "assistant",
      language === "he"
        ? "שלום! אני כאן כדי לעזור לך להצטרף לקהילת רוטרי קונקט ישראל. תוכל/י לשוחח איתי בשפה טבעית, ואני אדריך אותך לאורך כל התהליך.\n\nנתחיל?"
        : "Hello! I'm here to help you join the Rotary Connect Israel community. You can chat with me naturally, and I'll guide you through the entire process.\n\nShall we begin?",
      welcomeQuickReplies
    );

    // Reset everything at once
    dispatch({
      type: "RESET",
      payload: {
        state: createInitialState(crypto.randomUUID(), language),
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

// Demo simulation function with proper state tracking
async function simulateResponse(
  content: string,
  state: ConversationState,
  dispatch: React.Dispatch<ConversationAction>
) {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 600 + Math.random() * 400));

  const lang = state.language;
  const stage = state.currentStage;
  const profile = state.profile;

  let responseText = "";
  let nextQuickReplies: QuickReply[] = [];
  let nextStage: RegistrationStage = state.currentStage;
  let updatedProfile = { ...profile };

  // Extract email from content
  const emailMatch = content.match(/[\w.-]+@[\w.-]+\.\w+/);
  if (emailMatch) {
    updatedProfile.email = emailMatch[0];
  }

  switch (stage) {
    case "welcome":
      if (content.toLowerCase().includes("start") || content.includes("נתחיל") || content.includes("כן")) {
        responseText = lang === "he"
          ? "מצוין! נתחיל עם כמה פרטים בסיסיים.\n\nמה השם הפרטי שלך?"
          : "Great! Let's start with some basic details.\n\nWhat's your first name?";
        nextStage = "account";
      } else {
        responseText = lang === "he"
          ? "רוטרי קונקט ישראל היא פלטפורמה לרשת קשרים מקצועית של חברי רוטרי. בעזרת הצ'אט הזה נאסוף את הפרטים שלך ליצירת פרופיל.\n\nמוכנים להתחיל?"
          : "Rotary Connect Israel is a professional networking platform for Rotary members. Through this chat, we'll collect your details to create a profile.\n\nReady to begin?";
        nextQuickReplies = [
          { id: "start", label: lang === "he" ? "בוא נתחיל!" : "Let's start!", value: "start" },
        ];
      }
      break;

    case "account":
      // Determine what to ask next based on what we have
      if (!profile.firstName) {
        // This is the first answer - store as first name
        updatedProfile.firstName = content.trim().split(/\s+/)[0];
        const lastName = content.trim().split(/\s+/).slice(1).join(" ");
        if (lastName) {
          updatedProfile.lastName = lastName;
        }

        if (!updatedProfile.lastName) {
          responseText = lang === "he"
            ? `נעים מאוד, ${updatedProfile.firstName}! מה שם המשפחה שלך?`
            : `Nice to meet you, ${updatedProfile.firstName}! What's your last name?`;
        } else {
          responseText = lang === "he"
            ? `נעים מאוד, ${updatedProfile.firstName} ${updatedProfile.lastName}! מה כתובת הדוא"ל שלך?`
            : `Nice to meet you, ${updatedProfile.firstName} ${updatedProfile.lastName}! What's your email address?`;
        }
      } else if (!profile.lastName) {
        updatedProfile.lastName = content.trim();
        responseText = lang === "he"
          ? `מעולה! מה כתובת הדוא"ל שלך?`
          : `Great! What's your email address?`;
      } else if (!profile.email && !emailMatch) {
        responseText = lang === "he"
          ? `נא להזין כתובת דוא"ל תקינה (לדוגמה: name@example.com)`
          : `Please enter a valid email address (e.g., name@example.com)`;
      } else if (emailMatch || profile.email) {
        // Move to next stage
        responseText = lang === "he"
          ? `תודה! עכשיו נמשיך לפרטים נוספים.\n\nבאיזו עיר אתה גר/ה?`
          : `Thank you! Now let's continue with more details.\n\nWhich city do you live in?`;
        nextStage = "personal";
      } else {
        responseText = lang === "he"
          ? `מה כתובת הדוא"ל שלך?`
          : `What's your email address?`;
      }
      break;

    case "personal":
      if (!profile.city) {
        updatedProfile.city = content.trim();
        responseText = lang === "he"
          ? `${updatedProfile.city}, מצוין! עכשיו ספר/י לי על העיסוק המקצועי שלך - במה אתה עוסק/ת?`
          : `${updatedProfile.city}, great! Now tell me about your profession - what do you do?`;
        nextStage = "professional";
      } else {
        responseText = lang === "he"
          ? `באיזו עיר אתה גר/ה?`
          : `Which city do you live in?`;
      }
      break;

    case "professional":
      if (!profile.profession) {
        updatedProfile.profession = content.trim();
        responseText = lang === "he"
          ? `${updatedProfile.profession} - מעניין! באיזה ארגון או חברה אתה עובד/ת?`
          : `${updatedProfile.profession} - interesting! Which organization or company do you work for?`;
      } else if (!profile.workplace) {
        updatedProfile.workplace = content.trim();
        responseText = lang === "he"
          ? `מעולה! עכשיו נשאל לגבי הרוטרי.\n\nלאיזה מועדון רוטרי אתה שייך/ת?`
          : `Great! Now let's ask about Rotary.\n\nWhich Rotary club do you belong to?`;
        nextStage = "community";
      } else {
        responseText = lang === "he"
          ? `ספר/י לי על העיסוק המקצועי שלך - במה אתה עוסק/ת?`
          : `Tell me about your profession - what do you do?`;
      }
      break;

    case "community":
      if (!state.customClub && !state.clubId) {
        dispatch({
          type: "UPDATE_STATE",
          payload: { customClub: content.trim() },
        });
        responseText = lang === "he"
          ? `${content.trim()}, נפלא!\n\nהאם תרצה להוסיף את בן או בת הזוג שלך לפרופיל המשפחתי?`
          : `${content.trim()}, wonderful!\n\nWould you like to add your spouse or partner to your family profile?`;
        nextStage = "spouse_intro";
        nextQuickReplies = [
          { id: "yes", label: lang === "he" ? "כן" : "Yes", value: "yes" },
          { id: "no", label: lang === "he" ? "לא, תודה" : "No, thanks", value: "no" },
        ];
      }
      break;

    case "spouse_intro":
      if (/כן|yes|בטח|sure/i.test(content)) {
        responseText = lang === "he"
          ? `מה השם של בן/בת הזוג שלך?`
          : `What's your spouse's name?`;
        nextStage = "spouse_details";
      } else {
        responseText = lang === "he"
          ? `בסדר! האם יש לך ילדים בוגרים (מעל גיל 28) שתרצה לכלול?`
          : `Okay! Do you have adult children (over 28) you'd like to include?`;
        nextStage = "children_intro";
        nextQuickReplies = [
          { id: "yes", label: lang === "he" ? "כן" : "Yes", value: "yes" },
          { id: "no", label: lang === "he" ? "לא" : "No", value: "no" },
        ];
      }
      break;

    case "spouse_details":
      if (!state.spouse?.firstName) {
        const spouseName = content.trim().split(/\s+/);
        dispatch({
          type: "UPDATE_STATE",
          payload: {
            spouse: {
              firstName: spouseName[0],
              lastName: spouseName.slice(1).join(" ") || profile.lastName,
            },
          },
        });
        responseText = lang === "he"
          ? `נעים להכיר! במה ${spouseName[0]} עוסק/ת?`
          : `Nice to meet them! What does ${spouseName[0]} do?`;
      } else if (!state.spouse?.profession) {
        dispatch({
          type: "UPDATE_STATE",
          payload: {
            spouse: { ...state.spouse, profession: content.trim() },
          },
        });
        responseText = lang === "he"
          ? `מעולה! האם יש לך ילדים בוגרים שתרצה לכלול?`
          : `Great! Do you have adult children you'd like to include?`;
        nextStage = "children_intro";
        nextQuickReplies = [
          { id: "yes", label: lang === "he" ? "כן" : "Yes", value: "yes" },
          { id: "no", label: lang === "he" ? "לא" : "No", value: "no" },
        ];
      }
      break;

    case "children_intro":
      if (/כן|yes/i.test(content)) {
        responseText = lang === "he"
          ? `ספר/י לי על הילד/ה - שם ומה הוא/היא עושה?`
          : `Tell me about your child - name and what they do?`;
        nextStage = "children_details";
      } else {
        responseText = lang === "he"
          ? `מצוין! כמעט סיימנו.\n\nרוצה לעבור על הסיכום לפני שנסיים?`
          : `Excellent! We're almost done.\n\nWould you like to review the summary before we finish?`;
        nextStage = "review";
        nextQuickReplies = [
          { id: "review", label: lang === "he" ? "הצג סיכום" : "Show summary", value: "review" },
          { id: "finish", label: lang === "he" ? "סיים" : "Finish", value: "finish" },
        ];
      }
      break;

    case "children_details":
      // Store child info
      const childInfo = content.trim();
      dispatch({
        type: "UPDATE_STATE",
        payload: {
          children: [...state.children, { name: childInfo }],
        },
      });
      responseText = lang === "he"
        ? `תודה! האם תרצה להוסיף עוד ילד/ה?`
        : `Thank you! Would you like to add another child?`;
      nextQuickReplies = [
        { id: "yes", label: lang === "he" ? "כן, עוד אחד" : "Yes, another", value: "yes" },
        { id: "no", label: lang === "he" ? "לא, סיימתי" : "No, I'm done", value: "done" },
      ];

      if (/לא|no|done|סיימתי/i.test(content)) {
        responseText = lang === "he"
          ? `מצוין! כמעט סיימנו. רוצה לעבור על הסיכום?`
          : `Great! We're almost done. Want to review the summary?`;
        nextStage = "review";
        nextQuickReplies = [
          { id: "review", label: lang === "he" ? "הצג סיכום" : "Show summary", value: "review" },
          { id: "finish", label: lang === "he" ? "סיים" : "Finish", value: "finish" },
        ];
      }
      break;

    case "review":
      if (/review|סיכום/i.test(content)) {
        const summary = [
          `**${lang === "he" ? "פרטים אישיים" : "Personal Details"}**`,
          `${lang === "he" ? "שם" : "Name"}: ${updatedProfile.firstName || profile.firstName} ${updatedProfile.lastName || profile.lastName}`,
          `${lang === "he" ? "דוא״ל" : "Email"}: ${updatedProfile.email || profile.email}`,
          `${lang === "he" ? "עיר" : "City"}: ${updatedProfile.city || profile.city}`,
          "",
          `**${lang === "he" ? "מקצועי" : "Professional"}**`,
          `${lang === "he" ? "מקצוע" : "Profession"}: ${updatedProfile.profession || profile.profession}`,
          `${lang === "he" ? "מקום עבודה" : "Workplace"}: ${updatedProfile.workplace || profile.workplace}`,
          "",
          `**${lang === "he" ? "רוטרי" : "Rotary"}**`,
          `${lang === "he" ? "מועדון" : "Club"}: ${state.customClub || state.clubId}`,
        ].join("\n");

        responseText = lang === "he"
          ? `הנה הסיכום:\n\n${summary}\n\nהכל נראה טוב? לחץ "סיים" להשלמת ההרשמה.`
          : `Here's the summary:\n\n${summary}\n\nDoes everything look good? Click "Finish" to complete registration.`;
        nextQuickReplies = [
          { id: "finish", label: lang === "he" ? "סיים הרשמה" : "Finish registration", value: "finish" },
          { id: "edit", label: lang === "he" ? "עריכה" : "Edit", value: "edit" },
        ];
      } else if (/finish|סיים/i.test(content)) {
        responseText = lang === "he"
          ? `ההרשמה הושלמה בהצלחה! ברוכים הבאים לרוטרי קונקט ישראל. אתה מועבר לדף הבית...`
          : `Registration completed successfully! Welcome to Rotary Connect Israel. Redirecting to home...`;
        nextStage = "completed";
      }
      break;

    default:
      responseText = lang === "he"
        ? "תודה! המשך לענות על השאלות כדי להשלים את ההרשמה."
        : "Thank you! Continue answering questions to complete registration.";
  }

  // Update profile state
  if (Object.keys(updatedProfile).some(k => updatedProfile[k as keyof typeof updatedProfile] !== profile[k as keyof typeof profile])) {
    dispatch({
      type: "UPDATE_STATE",
      payload: { profile: updatedProfile },
    });
  }

  const assistantMessage = createMessage("assistant", responseText, nextQuickReplies);
  dispatch({ type: "ADD_MESSAGE", payload: assistantMessage });
  dispatch({ type: "SET_QUICK_REPLIES", payload: nextQuickReplies });

  if (nextStage !== state.currentStage) {
    dispatch({ type: "SET_STAGE", payload: nextStage });
  }
}

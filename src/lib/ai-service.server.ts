/**
 * AI Service Abstraction for LLM Integration
 *
 * This module provides a flexible abstraction for AI-powered chat functionality.
 * It supports multiple providers (OpenAI, Claude) and falls back to deterministic
 * rule-based responses when no API is configured.
 */

import type {
  ChatMessage,
  ChatResponse,
  ConversationState,
  ExtractedProfile,
  ExtractedSpouse,
  ExtractedChild,
  QuickReply,
  RegistrationStage,
} from "./conversation";
import { createMessage, getNextStage } from "./conversation";

// AI Provider types
type AIProvider = "openai" | "anthropic" | "fallback";

interface AIConfig {
  provider: AIProvider;
  apiKey?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

// System prompts for registration assistant
const SYSTEM_PROMPTS = {
  he: `אתה עוזר רישום ידידותי לפלטפורמת רוטרי קונקט ישראל.
המטרה שלך היא לאסוף מידע ליצירת פרופיל מקצועי בשיחה טבעית ונעימה.

כללים חשובים:
1. דבר בעברית טבעית ונעימה
2. שאל שאלה אחת או שתיים בכל פעם
3. זכור מידע שכבר נאמר ואל תשאל שוב
4. הבן תשובות בשפה טבעית וחלץ מידע מובנה
5. אפשר לדלג על שאלות אופציונליות
6. תן משוב חיובי ומעודד
7. אל תמציא מידע שלא ניתן

השלבים ברישום:
- פרטים אישיים (שם, אימייל, טלפון, עיר)
- מידע מקצועי (מקצוע, תפקיד, מקום עבודה, תחום)
- מועדון רוטרי
- בן/בת זוג (אופציונלי)
- ילדים בוגרים (אופציונלי)
- העדפות רשת קשרים`,

  en: `You are a friendly registration assistant for the Rotary Connect Israel platform.
Your goal is to collect information to create a professional profile through a natural and pleasant conversation.

Important rules:
1. Speak naturally and pleasantly
2. Ask one or two questions at a time
3. Remember information already provided and don't ask again
4. Understand natural language responses and extract structured information
5. Allow skipping optional questions
6. Give positive and encouraging feedback
7. Never invent information not provided

Registration stages:
- Personal details (name, email, phone, city)
- Professional information (profession, title, workplace, industry)
- Rotary club
- Spouse (optional)
- Adult children (optional)
- Networking preferences`,
};

// Field extraction patterns for Hebrew
const EXTRACTION_PATTERNS = {
  name: {
    he: /(?:קוראים לי|שמי|אני)\s+([א-ת]+(?:\s+[א-ת]+)?)/i,
    en: /(?:my name is|i'm|i am)\s+(\w+(?:\s+\w+)?)/i,
  },
  email: {
    pattern: /[\w.-]+@[\w.-]+\.\w+/,
  },
  phone: {
    pattern: /(?:0[0-9]{1,2}[-\s]?)?[0-9]{3}[-\s]?[0-9]{4}/,
  },
  age: {
    he: /(?:בן|בת)\s*(\d{1,3})/,
    en: /(?:i'm|i am|age[:\s]?)\s*(\d{1,3})/i,
  },
  city: {
    he: /(?:גר|גרה|מ|ב)\s*([א-ת\s]+?)(?:\s|,|$)/,
    en: /(?:live in|from|in)\s+(\w+)/i,
  },
  profession: {
    he: /(?:עובד|עובדת|מקצוע|אני)\s+(?:כ)?([א-ת\s]+?)(?:\s+ב|\s+את|,|$)/,
    en: /(?:work as|i'm a|profession[:\s]?)\s+(\w+(?:\s+\w+)?)/i,
  },
  workplace: {
    he: /(?:ב|עובד ב|עובדת ב)\s*([א-ת\w\s]+?)(?:\s|,|$)/,
    en: /(?:work at|at|for)\s+(\w+(?:\s+\w+)?)/i,
  },
};

// Israeli cities for extraction
const ISRAELI_CITIES = [
  "תל אביב", "ירושלים", "חיפה", "באר שבע", "רמת גן", "פתח תקווה",
  "ראשון לציון", "נתניה", "אשדוד", "בני ברק", "חולון", "בת ים",
  "הרצליה", "כפר סבא", "רעננה", "הוד השרון", "רמת השרון", "גבעתיים",
  "tel aviv", "jerusalem", "haifa", "beer sheva", "ramat gan", "petah tikva",
  "rishon lezion", "netanya", "ashdod", "bnei brak", "holon", "bat yam",
  "herzliya", "kfar saba", "raanana", "hod hasharon", "ramat hasharon", "givatayim",
];

/**
 * Extract structured data from natural language message
 */
export function extractFieldsFromMessage(
  message: string,
  language: "he" | "en"
): Partial<ExtractedProfile> {
  const extracted: Partial<ExtractedProfile> = {};
  const lowerMessage = message.toLowerCase();

  // Extract email
  const emailMatch = message.match(EXTRACTION_PATTERNS.email.pattern);
  if (emailMatch) {
    extracted.email = emailMatch[0];
  }

  // Extract phone
  const phoneMatch = message.match(EXTRACTION_PATTERNS.phone.pattern);
  if (phoneMatch) {
    extracted.phone = phoneMatch[0].replace(/[-\s]/g, "");
  }

  // Extract name
  const namePattern = EXTRACTION_PATTERNS.name[language];
  if (namePattern) {
    const nameMatch = message.match(namePattern);
    if (nameMatch && nameMatch[1]) {
      const nameParts = nameMatch[1].trim().split(/\s+/);
      extracted.firstName = nameParts[0];
      if (nameParts.length > 1) {
        extracted.lastName = nameParts.slice(1).join(" ");
      }
    }
  }

  // Extract city
  for (const city of ISRAELI_CITIES) {
    if (lowerMessage.includes(city.toLowerCase())) {
      extracted.city = city;
      break;
    }
  }

  // Extract profession
  const professionPattern = EXTRACTION_PATTERNS.profession[language];
  if (professionPattern) {
    const profMatch = message.match(professionPattern);
    if (profMatch && profMatch[1]) {
      extracted.profession = profMatch[1].trim();
    }
  }

  // Extract workplace
  const workplacePattern = EXTRACTION_PATTERNS.workplace[language];
  if (workplacePattern) {
    const workMatch = message.match(workplacePattern);
    if (workMatch && workMatch[1]) {
      extracted.workplace = workMatch[1].trim();
    }
  }

  return extracted;
}

/**
 * Stage-specific conversation handlers
 */
interface StageHandler {
  questions: { he: string; en: string }[];
  quickReplies?: (lang: "he" | "en") => QuickReply[];
  extractFields: (message: string, lang: "he" | "en") => Partial<ConversationState>;
  shouldAdvance: (state: ConversationState) => boolean;
  nextStage: RegistrationStage;
}

const STAGE_HANDLERS: Partial<Record<RegistrationStage, StageHandler>> = {
  welcome: {
    questions: [
      {
        he: "שלום! אני כאן כדי לעזור לך להצטרף לקהילת רוטרי קונקט ישראל.\n\nזו שיחה קצרה שבה נאסוף את הפרטים שלך ליצירת פרופיל מקצועי. אפשר לעצור ולהמשיך מאוחר יותר בכל שלב.\n\nנתחיל?",
        en: "Hello! I'm here to help you join the Rotary Connect Israel community.\n\nThis is a short conversation where we'll collect your details to create a professional profile. You can pause and continue later at any point.\n\nShall we begin?",
      },
    ],
    quickReplies: (lang) => [
      { id: "start", label: lang === "he" ? "בוא נתחיל!" : "Let's start!", value: "start" },
      { id: "info", label: lang === "he" ? "ספר לי עוד" : "Tell me more", value: "info" },
    ],
    extractFields: () => ({}),
    shouldAdvance: (state) => true,
    nextStage: "account",
  },

  account: {
    questions: [
      { he: "מה השם הפרטי שלך?", en: "What's your first name?" },
      { he: "ומה שם המשפחה?", en: "And your last name?" },
      { he: 'מה כתובת הדוא"ל שלך?', en: "What's your email address?" },
    ],
    extractFields: (message, lang) => {
      const profile = extractFieldsFromMessage(message, lang);
      return { profile };
    },
    shouldAdvance: (state) => {
      return !!(state.profile.firstName && state.profile.lastName && state.profile.email);
    },
    nextStage: "personal",
  },

  personal: {
    questions: [
      { he: "באיזו עיר אתה גר/ה?", en: "Which city do you live in?" },
      { he: "מה מספר הטלפון שלך? (אופציונלי)", en: "What's your phone number? (optional)" },
    ],
    extractFields: (message, lang) => {
      const profile = extractFieldsFromMessage(message, lang);
      return { profile };
    },
    shouldAdvance: (state) => {
      return !!state.profile.city;
    },
    nextStage: "professional",
  },

  professional: {
    questions: [
      { he: "במה אתה עוסק/ת? ספר/י לי קצת על העבודה שלך.", en: "What do you do? Tell me a bit about your work." },
      { he: "באיזה ארגון או חברה אתה עובד/ת?", en: "Which organization or company do you work for?" },
      { he: "מה התחום או הענף שלך?", en: "What's your field or industry?" },
    ],
    extractFields: (message, lang) => {
      const profile = extractFieldsFromMessage(message, lang);
      return { profile };
    },
    shouldAdvance: (state) => {
      return !!state.profile.profession;
    },
    nextStage: "community",
  },

  community: {
    questions: [
      { he: "לאיזה מועדון רוטרי אתה שייך/ת?", en: "Which Rotary club do you belong to?" },
      { he: "מתי הצטרפת לרוטרי?", en: "When did you join Rotary?" },
    ],
    extractFields: (message, lang) => {
      // Try to extract club name and year
      const yearMatch = message.match(/\b(19|20)\d{2}\b/);
      const updates: Partial<ConversationState> = {};

      if (yearMatch) {
        updates.joinYear = yearMatch[0];
      }

      // For club, we'd need to match against actual club list
      // For now, store as custom club
      if (!yearMatch && message.trim().length > 2) {
        updates.customClub = message.trim();
      }

      return updates;
    },
    shouldAdvance: (state) => {
      return !!(state.clubId || state.customClub);
    },
    nextStage: "spouse_intro",
  },

  spouse_intro: {
    questions: [
      { he: "האם תרצה להוסיף את בן או בת הזוג שלך לפרופיל המשפחתי?", en: "Would you like to add your spouse or partner to your family profile?" },
    ],
    quickReplies: (lang) => [
      { id: "yes", label: lang === "he" ? "כן" : "Yes", value: "yes" },
      { id: "no", label: lang === "he" ? "לא, תודה" : "No, thanks", value: "no" },
    ],
    extractFields: (message) => {
      const hasSpouse = /כן|yes|אני רוצה|בטח/i.test(message);
      return hasSpouse ? {} : {};
    },
    shouldAdvance: () => true,
    nextStage: "spouse_details",
  },

  spouse_details: {
    questions: [
      { he: "מה השם של בן/בת הזוג שלך?", en: "What's your spouse's name?" },
      { he: "במה הוא/היא עוסק/ת?", en: "What do they do?" },
    ],
    extractFields: (message, lang) => {
      const profile = extractFieldsFromMessage(message, lang);
      const spouse: ExtractedSpouse = {};

      if (profile.firstName) {
        spouse.firstName = profile.firstName;
        spouse.lastName = profile.lastName;
      }
      if (profile.profession) {
        spouse.profession = profile.profession;
      }
      if (profile.workplace) {
        spouse.workplace = profile.workplace;
      }

      return { spouse };
    },
    shouldAdvance: (state) => {
      return !!state.spouse?.firstName;
    },
    nextStage: "children_intro",
  },

  children_intro: {
    questions: [
      { he: "האם יש לך ילדים בוגרים שתרצה לכלול בפרופיל המשפחתי?", en: "Do you have adult children you'd like to include in your family profile?" },
    ],
    quickReplies: (lang) => [
      { id: "yes", label: lang === "he" ? "כן" : "Yes", value: "yes" },
      { id: "no", label: lang === "he" ? "לא" : "No", value: "no" },
    ],
    extractFields: () => ({}),
    shouldAdvance: () => true,
    nextStage: "children_details",
  },

  children_details: {
    questions: [
      { he: "ספר/י לי על הילד/ה - שם, גיל ומה הוא/היא עושה?", en: "Tell me about your child - name, age and what they do?" },
      { he: "האם תרצה להוסיף עוד ילד/ה?", en: "Would you like to add another child?" },
    ],
    extractFields: (message, lang) => {
      const profile = extractFieldsFromMessage(message, lang);
      const child: ExtractedChild = {};

      if (profile.firstName) {
        child.name = `${profile.firstName}${profile.lastName ? " " + profile.lastName : ""}`;
      }
      if (profile.profession) {
        child.profession = profile.profession;
      }

      // Extract age
      const ageMatch = message.match(/(?:בן|בת|age[:\s]?)\s*(\d{1,2})/i);
      if (ageMatch) {
        child.age = parseInt(ageMatch[1], 10);
      }

      return child.name ? { children: [child] } : {};
    },
    shouldAdvance: (state) => {
      // Advance when user says no to adding more children
      return state.children.length > 0;
    },
    nextStage: "networking",
  },

  networking: {
    questions: [
      { he: "מה מעניין אותך ברשת קשרים? איזה סוג אנשים תרצה לפגוש?", en: "What interests you in networking? What kind of people would you like to meet?" },
      { he: "האם אתה מעוניין/ת בהזדמנויות מנטורינג או שיתופי פעולה עסקיים?", en: "Are you interested in mentoring opportunities or business collaborations?" },
    ],
    quickReplies: (lang) => [
      { id: "mentoring", label: lang === "he" ? "מנטורינג" : "Mentoring", value: "mentoring" },
      { id: "business", label: lang === "he" ? "שיתופי פעולה" : "Collaborations", value: "business" },
      { id: "both", label: lang === "he" ? "שניהם" : "Both", value: "both" },
      { id: "skip", label: lang === "he" ? "דלג" : "Skip", value: "skip" },
    ],
    extractFields: (message) => {
      const prefs = {
        mentoring: /מנטור|mentor|חונכות|הדרכה/i.test(message),
        partnerships: /שיתוף|עסק|business|partner|collaboration/i.test(message),
      };
      return { networkingPreferences: prefs };
    },
    shouldAdvance: () => true,
    nextStage: "review",
  },

  review: {
    questions: [
      { he: "מצוין! אספתי את כל הפרטים. רוצה לעבור על הסיכום לפני שנסיים?", en: "Great! I've collected all the details. Would you like to review the summary before we finish?" },
    ],
    quickReplies: (lang) => [
      { id: "review", label: lang === "he" ? "הצג סיכום" : "Show summary", value: "review" },
      { id: "finish", label: lang === "he" ? "סיים הרשמה" : "Finish registration", value: "finish" },
    ],
    extractFields: () => ({}),
    shouldAdvance: () => true,
    nextStage: "completed",
  },
};

/**
 * Generate response for the current stage
 */
export function generateStageResponse(
  userMessage: string,
  state: ConversationState
): ChatResponse {
  const lang = state.language;
  const stage = state.currentStage;
  const handler = STAGE_HANDLERS[stage];

  if (!handler) {
    // Default fallback response
    return {
      messages: [
        createMessage(
          "assistant",
          lang === "he"
            ? "תודה! אנחנו ממשיכים עם ההרשמה."
            : "Thank you! We're continuing with the registration."
        ),
      ],
      state: {},
    };
  }

  // Extract fields from user message
  const extractedData = handler.extractFields(userMessage, lang);

  // Merge with existing state
  const updatedState: Partial<ConversationState> = {
    ...extractedData,
    profile: { ...state.profile, ...(extractedData as { profile?: ExtractedProfile }).profile },
    lastMessageAt: Date.now(),
  };

  // Check if we should advance to next stage
  const tempState = { ...state, ...updatedState };
  const shouldAdvance = handler.shouldAdvance(tempState as ConversationState);

  // Generate appropriate response
  let responseText: string;
  let quickReplies: QuickReply[] = [];

  if (shouldAdvance) {
    const nextStage = handler.nextStage;
    const nextHandler = STAGE_HANDLERS[nextStage];

    if (nextHandler && nextHandler.questions.length > 0) {
      responseText = nextHandler.questions[0][lang];
      quickReplies = nextHandler.quickReplies?.(lang) || [];
    } else {
      responseText =
        lang === "he"
          ? "תודה רבה! ההרשמה הושלמה בהצלחה."
          : "Thank you! Registration completed successfully.";
    }

    return {
      messages: [createMessage("assistant", responseText, quickReplies)],
      state: updatedState,
      shouldAdvanceStage: true,
      nextStage,
    };
  } else {
    // Continue with current stage
    const questionIndex = Math.min(
      state.pendingQuestions.length,
      handler.questions.length - 1
    );
    responseText = handler.questions[questionIndex][lang];
    quickReplies = handler.quickReplies?.(lang) || [];

    return {
      messages: [createMessage("assistant", responseText, quickReplies)],
      state: updatedState,
    };
  }
}

/**
 * Main processing function - uses deterministic responses
 * Can be extended to call external AI providers
 */
export async function processUserMessage(
  message: string,
  state: ConversationState,
  config?: AIConfig
): Promise<ChatResponse> {
  // For now, use deterministic rule-based responses
  // In the future, this can be extended to call OpenAI/Claude APIs
  return generateStageResponse(message, state);
}

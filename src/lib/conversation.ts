import { z } from "zod";
import { generateId } from "./utils";

// Message types for the chat interface
export type MessageRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  quickReplies?: QuickReply[] | undefined;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface QuickReply {
  id: string;
  label: string;
  value: string;
}

// Registration stages (aligned with new 9-step form)
export type RegistrationStage =
  | "welcome"
  | "language"
  | "account"
  | "email_verification" // New: verify email with OTP
  | "personal"
  | "rotary"
  | "professional"
  | "education"
  | "military"
  | "interests"
  | "spouse_intro"
  | "spouse_details"
  | "children_intro"
  | "children_details"
  | "review"
  | "completed";

// Contact info structure
export interface ExtractedContactInfo {
  phone?: string;
  whatsapp?: string;
  telegram?: string;
  preferredContact?: "email" | "phone" | "whatsapp" | "telegram";
}

// Extracted profile data structure
export type ExtractedProfile = z.infer<typeof extractedProfileSchema>;
export type ExtractedSpouse = z.infer<typeof extractedSpouseSchema>;
export type ExtractedChild = z.infer<typeof extractedChildSchema>;

export interface NetworkingPreferences {
  opportunities?: string[];
  connectionTypes?: string[];
  mentoring?: boolean;
  partnerships?: boolean;
  updates?: boolean;
}

// Rotary position type
export type RotaryPosition = z.infer<typeof rotaryPositionSchema>;

// Full conversation state
export interface ConversationState {
  sessionId: string;
  language: "he" | "en";
  currentStage: RegistrationStage;
  completedStages: RegistrationStage[];
  pendingQuestions: string[];

  // Extracted data
  profile: ExtractedProfile;
  contactInfo: ExtractedContactInfo;
  spouse?: ExtractedSpouse;
  children: ExtractedChild[];
  networkingPreferences: NetworkingPreferences;

  // Rotary-specific
  clubId?: string;
  customClub?: string;
  previousClub?: string;
  joinYear?: string;
  rotaryJoinDate?: string;
  rotaryPositions?: RotaryPosition[];
  hasSpouse?: boolean;
  hasChildren?: boolean;
  hasEligibleChildren?: boolean;
  skippedFields?: string[];

  // Consent tracking
  consent: {
    terms?: boolean;
    privacy?: boolean;
    notifications?: boolean;
    dataAccuracy?: boolean;
    familyDataProcessing?: boolean;
    marketingCommunications?: boolean;
  };

  // Email verification (OTP)
  emailVerification?: {
    status: "pending" | "sent" | "verified" | "failed";
    sessionKey?: string;
    email?: string;
    attempts?: number;
    lastSentAt?: number;
    verifiedAt?: number;
  };

  // Draft integration
  draftId?: string;
  registrationMethod?: "form" | "chat";

  // Session metadata
  status: "in_progress" | "review" | "completed" | "abandoned";
  createdAt: number;
  updatedAt: number;
  lastMessageAt: number;
}

// Server response types
export interface ChatResponse {
  messages: ChatMessage[];
  state: Partial<ConversationState>;
  shouldAdvanceStage?: boolean;
  nextStage?: RegistrationStage;
}

export function applyChatResponse(
  state: ConversationState,
  response: ChatResponse,
): ConversationState {
  const nextStage = response.nextStage ?? state.currentStage;
  return {
    ...state,
    ...response.state,
    currentStage: nextStage,
    completedStages:
      nextStage !== state.currentStage
        ? [...new Set([...state.completedStages, state.currentStage])]
        : state.completedStages,
    updatedAt: Date.now(),
    lastMessageAt: Date.now(),
  };
}

// Zod schema for validation
export const educationRecordSchema = z.object({
  degree: z.string().optional(),
  level: z.enum(["high_school", "associate", "bachelor", "master", "doctorate", "professional", "other"]).optional(),
  fieldOfStudy: z.string().optional(),
  institution: z.string().optional(),
  graduationYear: z.string().optional(),
  specialization: z.string().optional(),
  postGraduationActivities: z.string().optional(),
  completedDuringMilitaryService: z.boolean().optional(),
});

export const militaryServiceSchema = z.object({
  served: z.boolean().optional(),
  framework: z.enum(["idf", "police", "security", "national_service", "none"]).optional(),
  unit: z.string().optional(),
  role: z.string().optional(),
  dischargeRank: z.string().optional(),
  dischargeYear: z.string().optional(),
  commandExperience: z.string().optional(),
});

export const rotaryPositionSchema = z.object({
  level: z.enum(["club", "district", "national", "international"]).optional(),
  title: z.string().optional(),
  fromYear: z.string().optional(),
  toYear: z.string().optional(),
});

export const extractedProfileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  photoUrl: z.string().url().optional(),
  shortBio: z.string().optional(),
  profession: z.string().optional(),
  jobTitle: z.string().optional(),
  workplace: z.string().optional(),
  industry: z.string().optional(),
  experience: z.string().optional(),
  employmentStatus: z.enum(["employed", "self_employed", "retired", "seeking", "other"]).optional(),
  retirementYear: z.string().optional(),
  skills: z.array(z.string()).optional(),
  expertise: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  interestCategories: z.array(z.enum([
    "business", "technology", "health", "education", "arts", "sports",
    "environment", "community", "finance", "legal", "real_estate", "other"
  ])).optional(),
  goals: z.string().optional(),
  age: z.number().int().min(18).max(130).optional(),
  dateOfBirth: z.string().optional(),
  hasHigherEducation: z.boolean().optional(),
  education: z.string().optional(),
  educationHistory: z.array(educationRecordSchema).optional(),
  // Legacy military fields (kept for compatibility)
  militaryService: z.boolean().optional(),
  militaryDischargeRank: z.string().optional(),
  // New military structure
  military: militaryServiceSchema.optional(),
  boards: z.string().optional(),
  hobbies: z.array(z.string()).optional(),
  volunteering: z.string().optional(),
  helpWith: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
});

export const extractedSpouseSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  age: z.number().int().min(18).max(130).optional(),
  gender: z.string().optional(),
  profession: z.string().optional(),
  jobTitle: z.string().optional(),
  workplace: z.string().optional(),
  industry: z.string().optional(),
  city: z.string().optional(),
  bio: z.string().optional(),
  education: z.string().optional(),
  educationHistory: z.array(educationRecordSchema).optional(),
});

export const extractedChildSchema = z.object({
  name: z.string().optional(),
  age: z.number().int().min(0).max(130).optional(),
  dateOfBirth: z.string().optional(),
  profession: z.string().optional(),
  workplace: z.string().optional(),
  education: z.string().optional(),
  institution: z.string().optional(),
  graduationYear: z.string().optional(),
  city: z.string().optional(),
});

export function getRegistrationGreeting(language: "he" | "en") {
  return language === "he"
    ? "שלום וברוכים הבאים לרוטרי קונקט ישראל!\n\nספרו לי קצת על עצמכם במילים שלכם: שם, גיל או תאריך לידה, השכלה, עיסוק, מועדון רוטרי ומתי הצטרפתם, האם יש בן או בת זוג, והאם יש ילדים בני 28 ומעלה. לגבי ילדים צעירים יותר אין צורך למסור פרטים.\n\nאפשר לכתוב הכול בהודעה אחת. אקרא את מה ששיתפתם ואשאל רק על פרטים שחסרים. אפשר לדלג על שאלות שאינן חובה."
    : "Welcome to Rotary Connect Israel!\n\nTell me about yourself in your own words: your name, age or date of birth, education, work, Rotary club and when you joined, partner status, and whether you have children aged 28 or older. Please leave out details of younger children.\n\nYou can share everything in one message. I'll read what you've shared and follow up only on missing details. Optional questions can be skipped.";
}

// Helper to create initial state
export function createInitialState(
  sessionId: string,
  language: "he" | "en" = "he",
): ConversationState {
  const now = Date.now();
  return {
    sessionId,
    language,
    currentStage: "welcome",
    completedStages: [],
    pendingQuestions: [],
    profile: {},
    contactInfo: {},
    children: [],
    networkingPreferences: {},
    consent: {},
    status: "in_progress",
    createdAt: now,
    updatedAt: now,
    lastMessageAt: now,
  };
}

// Helper to create a message
export function createMessage(
  role: MessageRole,
  content: string,
  quickReplies?: QuickReply[],
): ChatMessage {
  return {
    id: generateId(),
    role,
    content,
    timestamp: Date.now(),
    quickReplies,
  };
}

// Stage progression logic (aligned with 9-step form)
export const STAGE_ORDER = [
  "welcome",
  "language",
  "account",
  "email_verification", // Verify email with OTP before continuing
  "personal",
  "rotary",
  "professional",
  "education",
  "military",
  "interests",
  "spouse_intro",
  "spouse_details",
  "children_intro",
  "children_details",
  "review",
  "completed",
] as const;

export function getNextStage(current: RegistrationStage): RegistrationStage | null {
  const currentIndex = STAGE_ORDER.indexOf(current);
  if (currentIndex === -1 || currentIndex === STAGE_ORDER.length - 1) {
    return null;
  }
  return STAGE_ORDER[currentIndex + 1] ?? null;
}

export function getPreviousStage(current: RegistrationStage): RegistrationStage | null {
  const currentIndex = STAGE_ORDER.indexOf(current);
  if (currentIndex <= 0) {
    return null;
  }
  return STAGE_ORDER[currentIndex - 1] ?? null;
}

// Calculate completion percentage
export function calculateProgress(state: ConversationState): number {
  const totalStages = STAGE_ORDER.length - 1; // Exclude 'completed'
  const currentIndex = STAGE_ORDER.indexOf(state.currentStage);
  return Math.round((currentIndex / totalStages) * 100);
}

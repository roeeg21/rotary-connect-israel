import { z } from "zod";
import type { Child, Job, Person } from "./user-registration";

// Message types for the chat interface
export type MessageRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  quickReplies?: QuickReply[];
  metadata?: Record<string, unknown>;
}

export interface QuickReply {
  id: string;
  label: string;
  value: string;
}

// Registration stages
export type RegistrationStage =
  | "welcome"
  | "language"
  | "account"
  | "personal"
  | "professional"
  | "community"
  | "spouse_intro"
  | "spouse_details"
  | "children_intro"
  | "children_details"
  | "networking"
  | "review"
  | "completed";

// Extracted profile data structure
export interface ExtractedProfile {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  city?: string;
  country?: string;
  photoUrl?: string;
  shortBio?: string;
  profession?: string;
  jobTitle?: string;
  workplace?: string;
  industry?: string;
  experience?: string;
  skills?: string[];
  expertise?: string[];
  interests?: string[];
  goals?: string;
}

export interface ExtractedSpouse {
  firstName?: string;
  lastName?: string;
  profession?: string;
  jobTitle?: string;
  workplace?: string;
  industry?: string;
  city?: string;
  bio?: string;
}

export interface ExtractedChild {
  name?: string;
  age?: number;
  profession?: string;
  workplace?: string;
  education?: string;
  city?: string;
}

export interface NetworkingPreferences {
  opportunities?: string[];
  connectionTypes?: string[];
  mentoring?: boolean;
  partnerships?: boolean;
  updates?: boolean;
}

// Full conversation state
export interface ConversationState {
  sessionId: string;
  language: "he" | "en";
  currentStage: RegistrationStage;
  completedStages: RegistrationStage[];
  pendingQuestions: string[];

  // Extracted data
  profile: ExtractedProfile;
  spouse?: ExtractedSpouse;
  children: ExtractedChild[];
  networkingPreferences: NetworkingPreferences;

  // Rotary-specific
  clubId?: string;
  customClub?: string;
  joinYear?: string;

  // Consent tracking
  consent: {
    terms?: boolean;
    privacy?: boolean;
    notifications?: boolean;
  };

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

// Zod schema for validation
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
  skills: z.array(z.string()).optional(),
  expertise: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  goals: z.string().optional(),
});

// Helper to create initial state
export function createInitialState(sessionId: string, language: "he" | "en" = "he"): ConversationState {
  const now = Date.now();
  return {
    sessionId,
    language,
    currentStage: "welcome",
    completedStages: [],
    pendingQuestions: [],
    profile: {},
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
    id: crypto.randomUUID(),
    role,
    content,
    timestamp: Date.now(),
    quickReplies,
  };
}

// Stage progression logic
export const STAGE_ORDER: RegistrationStage[] = [
  "welcome",
  "language",
  "account",
  "personal",
  "professional",
  "community",
  "spouse_intro",
  "spouse_details",
  "children_intro",
  "children_details",
  "networking",
  "review",
  "completed",
];

export function getNextStage(current: RegistrationStage): RegistrationStage | null {
  const currentIndex = STAGE_ORDER.indexOf(current);
  if (currentIndex === -1 || currentIndex === STAGE_ORDER.length - 1) {
    return null;
  }
  return STAGE_ORDER[currentIndex + 1];
}

export function getPreviousStage(current: RegistrationStage): RegistrationStage | null {
  const currentIndex = STAGE_ORDER.indexOf(current);
  if (currentIndex <= 0) {
    return null;
  }
  return STAGE_ORDER[currentIndex - 1];
}

// Calculate completion percentage
export function calculateProgress(state: ConversationState): number {
  const totalStages = STAGE_ORDER.length - 1; // Exclude 'completed'
  const currentIndex = STAGE_ORDER.indexOf(state.currentStage);
  return Math.round((currentIndex / totalStages) * 100);
}

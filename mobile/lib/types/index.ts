/**
 * Shared types for Rotary Connect Israel mobile app
 * Ported from web application
 */

// Bilingual text type - all user-facing content supports Hebrew and English
export type Bi = { he: string; en: string };

// Language type
export type Language = "he" | "en";

// Contact information for members
export type ContactInfo = {
  email?: string;
  phone?: string;
  whatsapp?: string;
  telegram?: string;
  preferredContact?: "email" | "phone" | "whatsapp" | "telegram";
};

// Full member profile
export type Member = {
  id: string;
  name: Bi;
  position: Bi;
  company: string;
  profession: Bi;
  specialty: Bi;
  industry: Bi;
  city: Bi;
  club: string; // club id
  clubName: Bi;
  memberSince: number;
  rotaryRole?: Bi;
  about: Bi;
  expertise: Bi[];
  helpWith: Bi[];
  languages: Bi[];
  previousEmployers?: string[];
  accountType: "member" | "family";
  familyOf?: Bi;
  photo?: string;
  isNew?: boolean;
  contactInfo?: ContactInfo;
};

// Family member relationship types
export type Relationship = "spouse" | "child" | "parent" | "sibling" | "other";

// Family member profile
export interface FamilyMember {
  id: string;
  primaryMemberId: string;
  relationship: Relationship;
  firstName: Bi;
  lastName: Bi;
  age?: number;
  profession?: Bi;
  jobTitle?: Bi;
  workplace?: string;
  industry?: Bi;
  location?: Bi;
  bio?: Bi;
  profileImage?: string;
  searchable: boolean;
  isMinor?: boolean; // True if under 18
}

// Rotary club
export type Club = {
  id: string;
  he: string;
  en: string;
  region: "north" | "center" | "south";
};

// Search result (unified for members and family)
export interface SearchResult {
  id: string;
  type: "member" | "family";
  name: Bi;
  profession?: Bi;
  workplace?: string;
  location?: Bi;
  industry?: Bi;
  relationship?: Relationship; // For family members
  primaryMemberId?: string; // For family members
  score: number; // Search relevance score
  reasons: string[]; // Why match ranked high
  photo?: string;
}

// Relationship filter for search
export type RelationshipFilter = "all" | "members" | "spouses" | "children";

// User account (authenticated user)
export interface Account {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  club: string;
  clubName?: Bi;
  photo?: string;
  onboarded: boolean;
  createdAt?: string;
}

// App state (persisted in AsyncStorage)
export interface AppState {
  account: Account | null;
  language: Language;
  saved: string[]; // Saved member IDs
  recentSearches: string[]; // Last 5 searches
  recentlyViewed: string[]; // Recently viewed member IDs
  guestSearches: number; // Tracks free search limit
}

// Registration stages
export type RegistrationStage =
  | "welcome"
  | "profile"
  | "professional"
  | "family"
  | "spouse"
  | "children"
  | "review"
  | "completed";

// Registration conversation state
export interface ConversationState {
  sessionId: string;
  language: Language;
  currentStage: RegistrationStage;
  completedStages: RegistrationStage[];
  profile: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    city?: string;
    age?: number;
    dateOfBirth?: string;
    profession?: string;
    jobTitle?: string;
    workplace?: string;
    industry?: string;
  };
  spouse?: {
    firstName?: string;
    lastName?: string;
    profession?: string;
  };
  children: Array<{
    name?: string;
    age?: number;
    profession?: string;
  }>;
  clubId?: string;
  customClub?: string;
  joinYear?: string;
  hasSpouse?: boolean;
  hasChildren?: boolean;
  hasEligibleChildren?: boolean; // Children 28+
  status: "in_progress" | "review" | "completed" | "abandoned";
  createdAt: number;
  updatedAt: number;
}

// Chat message
export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  quickReplies?: QuickReply[];
}

// Quick reply button for chat
export interface QuickReply {
  id: string;
  label: string;
  value: string;
}

// API response types
export interface SearchResponse {
  results: SearchResult[];
  query: string;
  totalResults: number;
  spellingCorrection?: string;
}

export interface ChatResponse {
  messages: ChatMessage[];
  state: Partial<ConversationState>;
  nextStage?: RegistrationStage;
  shouldAdvanceStage?: boolean;
}

// Network browse categories
export interface BrowseCategory {
  id: string;
  name: Bi;
  count: number;
  type: "industry" | "expertise" | "profession" | "location";
}

// Helper to get localized text
export function getText(bi: Bi | undefined, lang: Language): string {
  if (!bi) return "";
  return bi[lang] || bi.en || bi.he || "";
}

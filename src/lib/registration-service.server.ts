/**
 * Registration Service
 *
 * Central service for managing registration drafts and data persistence.
 * Used by both Regular Registration form and Smart Registration chatbot.
 */

import { MongoClient, ServerApiVersion, type Collection, type WithId } from "mongodb";
import { generateId } from "./utils";
import {
  type RegistrationData,
  type RegistrationDraft,
  type RegistrationStep,
  registrationDataSchema,
  REGISTRATION_STEPS,
  getCompletionProgress,
  isStepComplete,
} from "./registration-schema";

// ============================================================================
// DATABASE CONNECTION
// ============================================================================

type MongoCache = {
  clientPromise?: Promise<MongoClient>;
  uri?: string;
};

const mongoCache = globalThis as typeof globalThis & {
  __rotaryMongoCache?: MongoCache;
};

function getMongoCache() {
  mongoCache.__rotaryMongoCache ??= {};
  return mongoCache.__rotaryMongoCache;
}

function getMongoConfig() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Missing MONGODB_URI environment variable.");
  }

  return {
    uri,
    dbName: process.env.MONGODB_DB_NAME || "rotary_connect_israel",
  };
}

async function getMongoClient(uri: string) {
  const cache = getMongoCache();

  if (!cache.clientPromise || cache.uri !== uri) {
    const client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });

    cache.uri = uri;
    cache.clientPromise = client.connect();
  }

  return cache.clientPromise;
}

// ============================================================================
// COLLECTION ACCESS
// ============================================================================

interface RegistrationDraftDocument {
  _id?: string;
  id: string;
  email?: string;
  sessionId?: string;
  data: Partial<RegistrationData>;
  currentStep: RegistrationStep;
  completedSteps: RegistrationStep[];
  registrationMethod: "form" | "chat";
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

async function getDraftsCollection(): Promise<Collection<RegistrationDraftDocument>> {
  const { uri, dbName } = getMongoConfig();
  const client = await getMongoClient(uri);
  const collection = client.db(dbName).collection<RegistrationDraftDocument>("registration_drafts");

  // Ensure indexes
  await collection.createIndex({ id: 1 }, { unique: true });
  await collection.createIndex({ email: 1 });
  await collection.createIndex({ sessionId: 1 });
  await collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await collection.createIndex({ updatedAt: -1 });

  return collection;
}

// ============================================================================
// DRAFT MANAGEMENT
// ============================================================================

/**
 * Create a new registration draft
 */
export async function createDraft(
  method: "form" | "chat",
  email?: string,
  sessionId?: string,
  initialData?: Partial<RegistrationData>
): Promise<RegistrationDraft> {
  const collection = await getDraftsCollection();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

  const draft: RegistrationDraftDocument = {
    id: generateId(),
    email,
    sessionId,
    data: initialData || {},
    currentStep: "personal",
    completedSteps: [],
    registrationMethod: method,
    createdAt: now,
    updatedAt: now,
    expiresAt,
  };

  await collection.insertOne(draft);

  return documentToDraft(draft);
}

/**
 * Get draft by ID
 */
export async function getDraftById(id: string): Promise<RegistrationDraft | null> {
  const collection = await getDraftsCollection();
  const doc = await collection.findOne({ id });
  return doc ? documentToDraft(doc) : null;
}

/**
 * Get draft by email (for resuming registration)
 */
export async function getDraftByEmail(email: string): Promise<RegistrationDraft | null> {
  const collection = await getDraftsCollection();
  const doc = await collection.findOne(
    { email: email.toLowerCase() },
    { sort: { updatedAt: -1 } }
  );
  return doc ? documentToDraft(doc) : null;
}

/**
 * Get draft by session ID (for chat registration)
 */
export async function getDraftBySessionId(sessionId: string): Promise<RegistrationDraft | null> {
  const collection = await getDraftsCollection();
  const doc = await collection.findOne({ sessionId });
  return doc ? documentToDraft(doc) : null;
}

/**
 * Update draft data
 */
export async function updateDraft(
  id: string,
  updates: {
    data?: Partial<RegistrationData>;
    currentStep?: RegistrationStep;
    completedSteps?: RegistrationStep[];
    email?: string;
    sessionId?: string;
    registrationMethod?: "form" | "chat";
  }
): Promise<RegistrationDraft | null> {
  const collection = await getDraftsCollection();
  const now = new Date();

  const updateDoc: Record<string, unknown> = {
    updatedAt: now,
  };

  if (updates.data) {
    // Merge with existing data
    const existing = await collection.findOne({ id });
    if (existing) {
      updateDoc.data = mergeRegistrationData(existing.data, updates.data);
    } else {
      updateDoc.data = updates.data;
    }
  }

  if (updates.currentStep) {
    updateDoc.currentStep = updates.currentStep;
  }

  if (updates.completedSteps) {
    updateDoc.completedSteps = updates.completedSteps;
  }

  if (updates.email) {
    updateDoc.email = updates.email.toLowerCase();
  }

  if (updates.sessionId) {
    updateDoc.sessionId = updates.sessionId;
  }

  if (updates.registrationMethod) {
    updateDoc.registrationMethod = updates.registrationMethod;
  }

  const result = await collection.findOneAndUpdate(
    { id },
    { $set: updateDoc },
    { returnDocument: "after" }
  );

  return result ? documentToDraft(result) : null;
}

/**
 * Update draft with partial data (for incremental updates from chat)
 */
export async function patchDraftData(
  id: string,
  partialData: Partial<RegistrationData>
): Promise<RegistrationDraft | null> {
  return updateDraft(id, { data: partialData });
}

/**
 * Mark step as complete
 */
export async function completeStep(
  id: string,
  step: RegistrationStep
): Promise<RegistrationDraft | null> {
  const draft = await getDraftById(id);
  if (!draft) return null;

  const completedSteps = [...new Set([...draft.completedSteps, step])];
  const currentStepIndex = REGISTRATION_STEPS.indexOf(step);
  const nextStep = REGISTRATION_STEPS[currentStepIndex + 1] || "review";

  return updateDraft(id, {
    completedSteps,
    currentStep: nextStep,
  });
}

/**
 * Delete draft
 */
export async function deleteDraft(id: string): Promise<boolean> {
  const collection = await getDraftsCollection();
  const result = await collection.deleteOne({ id });
  return result.deletedCount > 0;
}

/**
 * Switch registration method (form ↔ chat)
 */
export async function switchRegistrationMethod(
  id: string,
  newMethod: "form" | "chat",
  sessionId?: string
): Promise<RegistrationDraft | null> {
  const updates: Parameters<typeof updateDraft>[1] = {
    registrationMethod: newMethod,
  };

  if (sessionId) {
    updates.sessionId = sessionId;
  }

  return updateDraft(id, updates);
}

// ============================================================================
// DATA CONVERSION
// ============================================================================

function documentToDraft(doc: WithId<RegistrationDraftDocument> | RegistrationDraftDocument): RegistrationDraft {
  return {
    id: doc.id,
    email: doc.email,
    sessionId: doc.sessionId,
    data: doc.data,
    currentStep: doc.currentStep,
    completedSteps: doc.completedSteps,
    registrationMethod: doc.registrationMethod,
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.getTime() : doc.createdAt as unknown as number,
    updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt.getTime() : doc.updatedAt as unknown as number,
    expiresAt: doc.expiresAt instanceof Date ? doc.expiresAt.getTime() : undefined,
  };
}

/**
 * Deep merge registration data, preserving arrays and nested objects
 */
function mergeRegistrationData(
  existing: Partial<RegistrationData>,
  updates: Partial<RegistrationData>
): Partial<RegistrationData> {
  const result = { ...existing };

  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined) continue;

    const existingValue = (result as Record<string, unknown>)[key];

    if (Array.isArray(value)) {
      // For arrays, replace entirely (don't merge)
      (result as Record<string, unknown>)[key] = value;
    } else if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      // For objects, merge recursively
      if (existingValue && typeof existingValue === "object" && !Array.isArray(existingValue)) {
        (result as Record<string, unknown>)[key] = mergeRegistrationData(
          existingValue as Partial<RegistrationData>,
          value as Partial<RegistrationData>
        );
      } else {
        (result as Record<string, unknown>)[key] = value;
      }
    } else {
      // For primitives, replace
      (result as Record<string, unknown>)[key] = value;
    }
  }

  return result;
}

// ============================================================================
// FINAL REGISTRATION
// ============================================================================

/**
 * Complete registration and create user account
 */
export async function completeRegistration(
  draftId: string,
  password?: string
): Promise<{ success: boolean; error?: string; userId?: string }> {
  const draft = await getDraftById(draftId);
  if (!draft) {
    return { success: false, error: "Registration draft not found" };
  }

  // Validate required fields
  const validationResult = registrationDataSchema.safeParse(draft.data);
  if (!validationResult.success) {
    const missingFields = validationResult.error.errors.map((e) => e.path.join("."));
    return {
      success: false,
      error: `Missing required fields: ${missingFields.join(", ")}`,
    };
  }

  // Check consent
  if (!draft.data.consent?.dataAccuracy || !draft.data.consent?.privacyNotice) {
    return { success: false, error: "Required consent not provided" };
  }

  try {
    // Import user service and create account
    const { upsertUserFromRegistration } = await import("./users.server");

    const userId = await upsertUserFromRegistration(validationResult.data, password);

    // Delete the draft after successful registration
    await deleteDraft(draftId);

    return { success: true, userId };
  } catch (error) {
    console.error("Registration completion error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to complete registration",
    };
  }
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate draft data and return validation status
 */
export function validateDraft(draft: RegistrationDraft): {
  isValid: boolean;
  progress: number;
  missingRequired: string[];
  completedSteps: RegistrationStep[];
  incompleteSteps: RegistrationStep[];
} {
  const progress = getCompletionProgress(draft.data);
  const missingRequired: string[] = [];
  const completedSteps: RegistrationStep[] = [];
  const incompleteSteps: RegistrationStep[] = [];

  for (const step of REGISTRATION_STEPS) {
    if (isStepComplete(step, draft.data)) {
      completedSteps.push(step);
    } else {
      incompleteSteps.push(step);
    }
  }

  // Check for required fields
  if (!draft.data.firstName) missingRequired.push("firstName");
  if (!draft.data.lastName) missingRequired.push("lastName");
  if (!draft.data.email) missingRequired.push("email");
  if (!draft.data.clubId && !draft.data.customClub) missingRequired.push("club");
  if (!draft.data.joinYear && !draft.data.rotaryJoinDate) missingRequired.push("joinYear");

  return {
    isValid: missingRequired.length === 0,
    progress,
    missingRequired,
    completedSteps,
    incompleteSteps,
  };
}

/**
 * Get draft summary for display
 */
export function getDraftSummary(
  draft: RegistrationDraft,
  language: "he" | "en" = "he"
): {
  sections: Array<{
    title: string;
    items: Array<{ label: string; value: string }>;
    canEdit: boolean;
  }>;
} {
  const he = language === "he";
  const data = draft.data;
  const sections: Array<{
    title: string;
    items: Array<{ label: string; value: string }>;
    canEdit: boolean;
  }> = [];

  // Personal Information
  const personalItems: Array<{ label: string; value: string }> = [];
  if (data.firstName || data.lastName) {
    personalItems.push({
      label: he ? "שם" : "Name",
      value: [data.firstName, data.lastName].filter(Boolean).join(" "),
    });
  }
  if (data.email) {
    personalItems.push({ label: he ? "דוא״ל" : "Email", value: data.email });
  }
  if (data.phone) {
    personalItems.push({ label: he ? "טלפון" : "Phone", value: data.phone });
  }
  if (data.dateOfBirth || data.age) {
    personalItems.push({
      label: he ? "גיל" : "Age",
      value: data.age ? String(data.age) : data.dateOfBirth || "",
    });
  }
  if (data.city) {
    personalItems.push({ label: he ? "עיר" : "City", value: data.city });
  }
  if (personalItems.length > 0) {
    sections.push({
      title: he ? "פרטים אישיים" : "Personal Information",
      items: personalItems,
      canEdit: true,
    });
  }

  // Rotary Membership
  const rotaryItems: Array<{ label: string; value: string }> = [];
  if (data.clubId || data.customClub) {
    rotaryItems.push({
      label: he ? "מועדון" : "Club",
      value: data.customClub || data.clubId || "",
    });
  }
  if (data.joinYear || data.rotaryJoinDate) {
    rotaryItems.push({
      label: he ? "הצטרפות" : "Joined",
      value: data.rotaryJoinDate || data.joinYear || "",
    });
  }
  if (data.rotaryPositions?.length) {
    rotaryItems.push({
      label: he ? "תפקידים" : "Positions",
      value: data.rotaryPositions.map((p) => p.title).filter(Boolean).join(", "),
    });
  }
  if (rotaryItems.length > 0) {
    sections.push({
      title: he ? "חברות ברוטרי" : "Rotary Membership",
      items: rotaryItems,
      canEdit: true,
    });
  }

  // Professional Background
  const professionalItems: Array<{ label: string; value: string }> = [];
  if (data.currentEmployment?.employer || data.currentEmployment?.role) {
    professionalItems.push({
      label: he ? "עבודה נוכחית" : "Current Work",
      value: [data.currentEmployment.role, data.currentEmployment.employer]
        .filter(Boolean)
        .join(" · "),
    });
  }
  if (data.employmentHistory?.length) {
    professionalItems.push({
      label: he ? "ניסיון קודם" : "Previous Experience",
      value: `${data.employmentHistory.length} ${he ? "תפקידים" : "positions"}`,
    });
  }
  if (professionalItems.length > 0) {
    sections.push({
      title: he ? "רקע מקצועי" : "Professional Background",
      items: professionalItems,
      canEdit: true,
    });
  }

  // Education
  const educationItems: Array<{ label: string; value: string }> = [];
  if (data.educationHistory?.length) {
    for (const edu of data.educationHistory) {
      const parts = [edu.degree, edu.fieldOfStudy, edu.institution, edu.graduationYear]
        .filter(Boolean);
      if (parts.length > 0) {
        educationItems.push({
          label: he ? "השכלה" : "Education",
          value: parts.join(" · "),
        });
      }
    }
  }
  if (educationItems.length > 0) {
    sections.push({
      title: he ? "השכלה אקדמית" : "Academic Education",
      items: educationItems,
      canEdit: true,
    });
  }

  // Military Service
  if (data.military?.served !== undefined) {
    const militaryItems: Array<{ label: string; value: string }> = [];
    if (data.military.served) {
      if (data.military.unit || data.military.role) {
        militaryItems.push({
          label: he ? "שירות" : "Service",
          value: [data.military.unit, data.military.role].filter(Boolean).join(" · "),
        });
      }
      if (data.military.dischargeRank) {
        militaryItems.push({
          label: he ? "דרגת שחרור" : "Discharge Rank",
          value: data.military.dischargeRank,
        });
      }
    } else {
      militaryItems.push({
        label: he ? "שירות צבאי" : "Military Service",
        value: he ? "לא שירת/ה" : "Did not serve",
      });
    }
    if (militaryItems.length > 0) {
      sections.push({
        title: he ? "שירות צבאי" : "Military Service",
        items: militaryItems,
        canEdit: true,
      });
    }
  }

  // Interests
  if (data.interests) {
    const interestItems: Array<{ label: string; value: string }> = [];
    if (data.interests.hobbies?.length) {
      interestItems.push({
        label: he ? "תחביבים" : "Hobbies",
        value: data.interests.hobbies.join(", "),
      });
    }
    if (data.interests.expertise?.length) {
      interestItems.push({
        label: he ? "מומחיות" : "Expertise",
        value: data.interests.expertise.join(", "),
      });
    }
    if (interestItems.length > 0) {
      sections.push({
        title: he ? "תחומי עניין" : "Interests & Activities",
        items: interestItems,
        canEdit: true,
      });
    }
  }

  // Spouse
  if (data.hasSpouse && data.spouse) {
    const spouseItems: Array<{ label: string; value: string }> = [];
    if (data.spouse.firstName || data.spouse.lastName) {
      spouseItems.push({
        label: he ? "שם" : "Name",
        value: [data.spouse.firstName, data.spouse.lastName].filter(Boolean).join(" "),
      });
    }
    if (data.spouse.profession) {
      spouseItems.push({
        label: he ? "מקצוע" : "Profession",
        value: data.spouse.profession,
      });
    }
    if (spouseItems.length > 0) {
      sections.push({
        title: he ? "בן/בת זוג" : "Spouse/Partner",
        items: spouseItems,
        canEdit: true,
      });
    }
  }

  // Children
  if (data.hasEligibleChildren && data.children?.length) {
    const childrenItems: Array<{ label: string; value: string }> = [];
    for (const child of data.children) {
      const parts = [
        child.firstName,
        child.age ? `(${child.age})` : null,
        child.profession,
      ].filter(Boolean);
      if (parts.length > 0) {
        childrenItems.push({
          label: he ? "ילד/ה" : "Child",
          value: parts.join(" · "),
        });
      }
    }
    if (childrenItems.length > 0) {
      sections.push({
        title: he ? "ילדים (28+)" : "Children (28+)",
        items: childrenItems,
        canEdit: true,
      });
    }
  }

  return { sections };
}

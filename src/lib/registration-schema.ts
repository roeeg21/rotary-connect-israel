/**
 * Unified Registration Schema
 *
 * This schema powers both the Regular Registration form and Smart Registration chatbot.
 * All validation rules, conditional logic, and field definitions are centralized here.
 *
 * Registration Steps:
 * 1. Personal Information
 * 2. Rotary Membership
 * 3. Professional Background
 * 4. Academic Education
 * 5. Military Service
 * 6. Interests & Activities
 * 7. Spouse/Partner
 * 8. Children (28+)
 * 9. Review & Submit
 */

import { z } from "zod";

// ============================================================================
// CONSTANTS
// ============================================================================

export const MIN_CHILD_AGE = 28;
export const MIN_USER_AGE = 18;
export const MAX_AGE = 130;

// Registration steps
export const REGISTRATION_STEPS = [
  "personal",
  "rotary",
  "professional",
  "education",
  "military",
  "interests",
  "spouse",
  "children",
  "review",
] as const;

export type RegistrationStep = (typeof REGISTRATION_STEPS)[number];

// ============================================================================
// EDUCATION SCHEMAS
// ============================================================================

export const educationLevelOptions = [
  "professional_certificate",
  "bachelor",
  "master",
  "doctorate",
  "other",
] as const;

export const educationStatusOptions = [
  "completed",
  "in_progress",
  "incomplete",
] as const;

export const educationRecordSchema = z.object({
  id: z.string().optional(),
  level: z.enum(educationLevelOptions).optional(),
  degree: z.string().trim().optional(),
  fieldOfStudy: z.string().trim().optional(),
  specialization: z.string().trim().optional(),
  institution: z.string().trim().optional(),
  graduationYear: z.string().trim().optional(),
  status: z.enum(educationStatusOptions).optional(),
  completedDuringMilitaryService: z.boolean().optional(),
});

export type EducationRecord = z.infer<typeof educationRecordSchema>;

// ============================================================================
// EMPLOYMENT SCHEMAS
// ============================================================================

export const employmentStatusOptions = [
  "employed",
  "self_employed",
  "retired",
  "not_employed",
] as const;

export const employmentRecordSchema = z.object({
  id: z.string().optional(),
  employer: z.string().trim().optional(),
  role: z.string().trim().optional(),
  jobTitle: z.string().trim().optional(),
  industry: z.string().trim().optional(),
  fromYear: z.string().trim().optional(),
  toYear: z.string().trim().optional(),
  isCurrent: z.boolean().optional(),
  description: z.string().trim().optional(),
});

export type EmploymentRecord = z.infer<typeof employmentRecordSchema>;

// ============================================================================
// ROTARY POSITION SCHEMAS
// ============================================================================

export const rotaryPositionLevelOptions = [
  "club",
  "district",
  "international",
  "other",
] as const;

export const rotaryPositionSchema = z.object({
  id: z.string().optional(),
  level: z.enum(rotaryPositionLevelOptions).optional(),
  title: z.string().trim().optional(),
  fromYear: z.string().trim().optional(),
  toYear: z.string().trim().optional(),
  isCurrent: z.boolean().optional(),
  description: z.string().trim().optional(),
});

export type RotaryPosition = z.infer<typeof rotaryPositionSchema>;

// ============================================================================
// MILITARY SERVICE SCHEMAS
// ============================================================================

export const militaryFrameworkOptions = [
  "idf",
  "national_service",
  "other_security",
  "none",
  "undisclosed",
] as const;

export const militaryServiceSchema = z.object({
  served: z.boolean().optional(),
  framework: z.enum(militaryFrameworkOptions).optional(),
  unit: z.string().trim().optional(),
  role: z.string().trim().optional(),
  dischargeRank: z.string().trim().optional(),
  dischargeYear: z.string().trim().optional(),
  commandExperience: z.string().trim().optional(),
  academicDuringService: z.boolean().optional(),
});

export type MilitaryService = z.infer<typeof militaryServiceSchema>;

// ============================================================================
// CONTACT & SOCIAL SCHEMAS
// ============================================================================

export const preferredContactOptions = [
  "email",
  "phone",
  "whatsapp",
  "telegram",
] as const;

export const contactInfoSchema = z.object({
  phone: z.string().trim().optional(),
  whatsapp: z.string().trim().optional(),
  telegram: z.string().trim().optional(),
  preferredContact: z.enum(preferredContactOptions).optional(),
});

export type ContactInfo = z.infer<typeof contactInfoSchema>;

export const socialProfilesSchema = z.object({
  facebook: z.string().trim().optional(),
  instagram: z.string().trim().optional(),
  linkedin: z.string().trim().optional(),
  twitter: z.string().trim().optional(),
  website: z.string().trim().optional(),
});

export type SocialProfiles = z.infer<typeof socialProfilesSchema>;

// ============================================================================
// INTERESTS & ACTIVITIES SCHEMAS
// ============================================================================

export const interestCategoryOptions = [
  "technology",
  "entrepreneurship",
  "education",
  "law",
  "medicine",
  "engineering",
  "arts",
  "business",
  "sports",
  "travel",
  "community_service",
  "finance",
  "real_estate",
  "media",
  "environment",
  "other",
] as const;

export const interestsSchema = z.object({
  categories: z.array(z.enum(interestCategoryOptions)).optional(),
  customInterests: z.array(z.string().trim()).optional(),
  hobbies: z.array(z.string().trim()).optional(),
  volunteering: z.string().trim().optional(),
  communityActivities: z.string().trim().optional(),
  expertise: z.array(z.string().trim()).optional(),
  willingToShare: z.array(z.string().trim()).optional(),
  additionalInfo: z.string().trim().optional(),
});

export type Interests = z.infer<typeof interestsSchema>;

// ============================================================================
// FAMILY MEMBER SCHEMAS
// ============================================================================

export const familyMemberEmploymentSchema = z.object({
  employer: z.string().trim().optional(),
  role: z.string().trim().optional(),
  industry: z.string().trim().optional(),
  isCurrent: z.boolean().optional(),
});

export type FamilyMemberEmployment = z.infer<typeof familyMemberEmploymentSchema>;

export const familyMemberEducationSchema = z.object({
  degree: z.string().trim().optional(),
  fieldOfStudy: z.string().trim().optional(),
  institution: z.string().trim().optional(),
  graduationYear: z.string().trim().optional(),
});

export type FamilyMemberEducation = z.infer<typeof familyMemberEducationSchema>;

export const spouseSchema = z.object({
  firstName: z.string().trim().optional(),
  lastName: z.string().trim().optional(),
  birthYear: z.string().trim().optional(),
  age: z.number().int().min(MIN_USER_AGE).max(MAX_AGE).optional(),
  profession: z.string().trim().optional(),
  employment: familyMemberEmploymentSchema.optional(),
  education: familyMemberEducationSchema.optional(),
  additionalEducation: z.array(familyMemberEducationSchema).optional(),
  additionalEmployment: z.array(familyMemberEmploymentSchema).optional(),
});

export type Spouse = z.infer<typeof spouseSchema>;

export const childSchema = z.object({
  id: z.string().optional(),
  firstName: z.string().trim().optional(),
  lastName: z.string().trim().optional(),
  birthYear: z.string().trim().optional(),
  age: z.number().int().min(MIN_CHILD_AGE).max(MAX_AGE).optional(),
  profession: z.string().trim().optional(),
  employment: familyMemberEmploymentSchema.optional(),
  education: familyMemberEducationSchema.optional(),
  additionalEducation: z.array(familyMemberEducationSchema).optional(),
});

export type Child = z.infer<typeof childSchema>;

// ============================================================================
// PRIVACY & CONSENT SCHEMAS
// ============================================================================

export const visibilityOptions = [
  "public",
  "rotary_members",
  "club_members",
  "private",
] as const;

export const privacySettingsSchema = z.object({
  profileVisibility: z.enum(visibilityOptions).optional(),
  showEmail: z.boolean().optional(),
  showPhone: z.boolean().optional(),
  showSocialProfiles: z.boolean().optional(),
  showFamilyInfo: z.boolean().optional(),
  allowSearch: z.boolean().optional(),
});

export type PrivacySettings = z.infer<typeof privacySettingsSchema>;

export const consentSchema = z.object({
  dataAccuracy: z.boolean().optional(),
  privacyNotice: z.boolean().optional(),
  familyDataProcessing: z.boolean().optional(),
  marketingCommunications: z.boolean().optional(),
  timestamp: z.number().optional(),
});

export type Consent = z.infer<typeof consentSchema>;

// ============================================================================
// MAIN REGISTRATION DATA SCHEMA
// ============================================================================

export const registrationDataSchema = z.object({
  // Step 1: Personal Information
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z.string().trim().email("Valid email is required"),
  phone: z.string().trim().optional(),
  dateOfBirth: z.string().trim().optional(),
  age: z.number().int().min(MIN_USER_AGE).max(MAX_AGE).optional(),
  city: z.string().trim().optional(),
  country: z.string().trim().optional(),
  contactInfo: contactInfoSchema.optional(),
  socialProfiles: socialProfilesSchema.optional(),

  // Step 2: Rotary Membership
  clubId: z.string().trim().optional(),
  customClub: z.string().trim().optional(),
  joinYear: z.string().trim().optional(),
  rotaryJoinDate: z.string().trim().optional(),
  previousClub: z.string().trim().optional(),
  rotaryPositions: z.array(rotaryPositionSchema).optional(),
  rotaryActivities: z.array(z.string().trim()).optional(),

  // Step 3: Professional Background
  employmentStatus: z.enum(employmentStatusOptions).optional(),
  currentEmployment: employmentRecordSchema.optional(),
  employmentHistory: z.array(employmentRecordSchema).optional(),
  retirementYear: z.string().trim().optional(),

  // Step 4: Academic Education
  hasHigherEducation: z.boolean().optional(),
  educationHistory: z.array(educationRecordSchema).optional(),

  // Step 5: Military Service
  military: militaryServiceSchema.optional(),

  // Step 6: Interests & Activities
  interests: interestsSchema.optional(),

  // Step 7: Spouse/Partner
  hasSpouse: z.boolean().optional(),
  spouse: spouseSchema.optional(),

  // Step 8: Children (28+)
  hasChildren: z.boolean().optional(),
  hasEligibleChildren: z.boolean().optional(),
  children: z.array(childSchema).optional(),

  // Step 9: Review & Submit
  privacy: privacySettingsSchema.optional(),
  consent: consentSchema.optional(),

  // Metadata
  registrationMethod: z.enum(["form", "chat"]).optional(),
  currentStep: z.enum(REGISTRATION_STEPS).optional(),
  completedSteps: z.array(z.enum(REGISTRATION_STEPS)).optional(),
  isDraft: z.boolean().optional(),
  lastUpdated: z.number().optional(),
});

export type RegistrationData = z.infer<typeof registrationDataSchema>;

// ============================================================================
// REGISTRATION DRAFT SCHEMA (for saving progress)
// ============================================================================

export const registrationDraftSchema = z.object({
  id: z.string(),
  email: z.string().email().optional(),
  sessionId: z.string().optional(),
  data: registrationDataSchema.partial(),
  currentStep: z.enum(REGISTRATION_STEPS),
  completedSteps: z.array(z.enum(REGISTRATION_STEPS)),
  registrationMethod: z.enum(["form", "chat"]),
  createdAt: z.number(),
  updatedAt: z.number(),
  expiresAt: z.number().optional(),
});

export type RegistrationDraft = z.infer<typeof registrationDraftSchema>;

// ============================================================================
// STEP CONFIGURATION
// ============================================================================

export interface StepConfig {
  id: RegistrationStep;
  title: { he: string; en: string };
  description: { he: string; en: string };
  requiredFields: string[];
  optionalFields: string[];
  isConditional?: boolean;
  condition?: (data: Partial<RegistrationData>) => boolean;
}

export const STEP_CONFIGS: StepConfig[] = [
  {
    id: "personal",
    title: { he: "פרטים אישיים", en: "Personal Information" },
    description: {
      he: "שם, טלפון, דוא״ל, תאריך לידה ומקום מגורים",
      en: "Name, phone, email, date of birth and residence",
    },
    requiredFields: ["firstName", "lastName", "email"],
    optionalFields: ["phone", "dateOfBirth", "city", "contactInfo", "socialProfiles"],
  },
  {
    id: "rotary",
    title: { he: "פרטי רוטרי", en: "Rotary Membership" },
    description: {
      he: "מועדון, תאריך הצטרפות ותפקידים",
      en: "Club, join date and positions",
    },
    requiredFields: ["clubId", "joinYear"],
    optionalFields: ["rotaryJoinDate", "previousClub", "rotaryPositions", "rotaryActivities"],
  },
  {
    id: "professional",
    title: { he: "רקע מקצועי", en: "Professional Background" },
    description: {
      he: "מקום עבודה, תפקיד ותחום עיסוק",
      en: "Workplace, role and industry",
    },
    requiredFields: [],
    optionalFields: ["employmentStatus", "currentEmployment", "employmentHistory", "retirementYear"],
  },
  {
    id: "education",
    title: { he: "השכלה אקדמית", en: "Academic Education" },
    description: {
      he: "תארים, מוסדות לימודים והתמחויות",
      en: "Degrees, institutions and specializations",
    },
    requiredFields: [],
    optionalFields: ["hasHigherEducation", "educationHistory"],
  },
  {
    id: "military",
    title: { he: "שירות צבאי", en: "Military Service" },
    description: {
      he: "מסגרת שירות, יחידה ותפקיד",
      en: "Service framework, unit and role",
    },
    requiredFields: [],
    optionalFields: ["military"],
  },
  {
    id: "interests",
    title: { he: "תחומי עניין", en: "Interests & Activities" },
    description: {
      he: "תחביבים, התנדבות ומומחיות",
      en: "Hobbies, volunteering and expertise",
    },
    requiredFields: [],
    optionalFields: ["interests"],
  },
  {
    id: "spouse",
    title: { he: "בן/בת זוג", en: "Spouse/Partner" },
    description: {
      he: "פרטי בן או בת הזוג",
      en: "Partner details",
    },
    requiredFields: [],
    optionalFields: ["hasSpouse", "spouse"],
    isConditional: true,
    condition: (data) => data.hasSpouse === true,
  },
  {
    id: "children",
    title: { he: "ילדים", en: "Children" },
    description: {
      he: "ילדים בני 28 ומעלה",
      en: "Children aged 28 and above",
    },
    requiredFields: [],
    optionalFields: ["hasChildren", "hasEligibleChildren", "children"],
    isConditional: true,
    condition: (data) => data.hasEligibleChildren === true,
  },
  {
    id: "review",
    title: { he: "סקירה ואישור", en: "Review & Submit" },
    description: {
      he: "בדיקת הפרטים ואישור",
      en: "Review and confirm",
    },
    requiredFields: ["consent.dataAccuracy", "consent.privacyNotice"],
    optionalFields: ["privacy", "consent.familyDataProcessing"],
  },
];

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Calculate age from date of birth
 */
export function calculateAge(dateOfBirth: string, referenceDate = new Date()): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) return null;

  const birth = new Date(`${dateOfBirth}T00:00:00Z`);
  if (isNaN(birth.getTime())) return null;

  // Validate the date is real (e.g., not Feb 30)
  if (birth.toISOString().slice(0, 10) !== dateOfBirth) return null;

  const today = referenceDate;
  let age = today.getFullYear() - birth.getUTCFullYear();

  const monthDiff = today.getMonth() - birth.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getUTCDate())) {
    age--;
  }

  return age >= 0 && age <= MAX_AGE ? age : null;
}

/**
 * Validate Israeli phone number
 */
export function validateIsraeliPhone(phone: string): boolean {
  // Remove spaces, dashes, and parentheses
  const cleaned = phone.replace(/[\s\-()]/g, "");

  // Israeli mobile: 05X-XXXXXXX (10 digits starting with 05)
  // Israeli landline: 0X-XXXXXXX (9-10 digits starting with 0)
  // International: +972...
  const israeliPattern = /^(\+972|0)(5[0-9]|[2-4]|[8-9])[0-9]{7}$/;

  return israeliPattern.test(cleaned);
}

/**
 * Validate year format
 */
export function validateYear(year: string): boolean {
  if (!/^\d{4}$/.test(year)) return false;
  const num = parseInt(year, 10);
  const currentYear = new Date().getFullYear();
  return num >= 1900 && num <= currentYear + 1;
}

/**
 * Get missing required fields for a step
 */
export function getMissingFields(
  step: RegistrationStep,
  data: Partial<RegistrationData>
): string[] {
  const config = STEP_CONFIGS.find((s) => s.id === step);
  if (!config) return [];

  const missing: string[] = [];

  for (const field of config.requiredFields) {
    const value = getNestedValue(data, field);
    if (value === undefined || value === null || value === "") {
      missing.push(field);
    }
  }

  return missing;
}

/**
 * Check if a step is complete
 */
export function isStepComplete(
  step: RegistrationStep,
  data: Partial<RegistrationData>
): boolean {
  const config = STEP_CONFIGS.find((s) => s.id === step);
  if (!config) return false;

  // Check if conditional step should be skipped
  if (config.isConditional && config.condition && !config.condition(data)) {
    return true; // Skipped steps are considered complete
  }

  return getMissingFields(step, data).length === 0;
}

/**
 * Get completion progress (0-100)
 */
export function getCompletionProgress(data: Partial<RegistrationData>): number {
  const applicableSteps = STEP_CONFIGS.filter((config) => {
    if (!config.isConditional) return true;
    return config.condition ? config.condition(data) : true;
  });

  const completedCount = applicableSteps.filter((config) =>
    isStepComplete(config.id, data)
  ).length;

  return Math.round((completedCount / applicableSteps.length) * 100);
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce((current, key) => {
    if (current === undefined || current === null) return undefined;
    return (current as Record<string, unknown>)[key];
  }, obj as unknown);
}

// ============================================================================
// FIELD LABELS (for forms and display)
// ============================================================================

export const FIELD_LABELS: Record<string, { he: string; en: string }> = {
  firstName: { he: "שם פרטי", en: "First Name" },
  lastName: { he: "שם משפחה", en: "Last Name" },
  email: { he: "דוא״ל", en: "Email" },
  phone: { he: "טלפון", en: "Phone" },
  dateOfBirth: { he: "תאריך לידה", en: "Date of Birth" },
  age: { he: "גיל", en: "Age" },
  city: { he: "עיר מגורים", en: "City" },
  country: { he: "מדינה", en: "Country" },

  clubId: { he: "מועדון רוטרי", en: "Rotary Club" },
  customClub: { he: "שם מועדון אחר", en: "Other Club Name" },
  joinYear: { he: "שנת הצטרפות", en: "Join Year" },
  rotaryJoinDate: { he: "תאריך הצטרפות", en: "Join Date" },
  previousClub: { he: "מועדון קודם", en: "Previous Club" },
  rotaryPositions: { he: "תפקידים ברוטרי", en: "Rotary Positions" },
  rotaryActivities: { he: "תחומי פעילות", en: "Activity Areas" },

  employmentStatus: { he: "סטטוס תעסוקה", en: "Employment Status" },
  currentEmployment: { he: "עבודה נוכחית", en: "Current Employment" },
  employmentHistory: { he: "היסטוריית תעסוקה", en: "Employment History" },
  retirementYear: { he: "שנת פרישה", en: "Retirement Year" },

  hasHigherEducation: { he: "השכלה אקדמית", en: "Higher Education" },
  educationHistory: { he: "היסטוריית השכלה", en: "Education History" },

  "military.served": { he: "שירות צבאי", en: "Military Service" },
  "military.framework": { he: "מסגרת שירות", en: "Service Framework" },
  "military.unit": { he: "יחידה / חיל", en: "Unit / Corps" },
  "military.role": { he: "תפקיד", en: "Role" },
  "military.dischargeRank": { he: "דרגת שחרור", en: "Discharge Rank" },
  "military.dischargeYear": { he: "שנת שחרור", en: "Discharge Year" },

  interests: { he: "תחומי עניין", en: "Interests" },
  "interests.hobbies": { he: "תחביבים", en: "Hobbies" },
  "interests.volunteering": { he: "התנדבות", en: "Volunteering" },
  "interests.expertise": { he: "תחומי מומחיות", en: "Expertise" },

  hasSpouse: { he: "בן/בת זוג", en: "Has Spouse" },
  spouse: { he: "פרטי בן/בת זוג", en: "Spouse Details" },

  hasChildren: { he: "ילדים", en: "Has Children" },
  hasEligibleChildren: { he: "ילדים בני 28+", en: "Children 28+" },
  children: { he: "פרטי ילדים", en: "Children Details" },
};

// ============================================================================
// OPTION LABELS
// ============================================================================

export const EMPLOYMENT_STATUS_LABELS: Record<string, { he: string; en: string }> = {
  employed: { he: "שכיר/ה", en: "Employed" },
  self_employed: { he: "עצמאי/ת", en: "Self-Employed" },
  retired: { he: "פנסיונר/ית", en: "Retired" },
  not_employed: { he: "לא עובד/ת כרגע", en: "Not Currently Employed" },
};

export const EDUCATION_LEVEL_LABELS: Record<string, { he: string; en: string }> = {
  professional_certificate: { he: "תעודה מקצועית", en: "Professional Certificate" },
  bachelor: { he: "תואר ראשון", en: "Bachelor's Degree" },
  master: { he: "תואר שני", en: "Master's Degree" },
  doctorate: { he: "דוקטורט", en: "Doctorate" },
  other: { he: "אחר", en: "Other" },
};

export const EDUCATION_STATUS_LABELS: Record<string, { he: string; en: string }> = {
  completed: { he: "הושלם", en: "Completed" },
  in_progress: { he: "בתהליך", en: "In Progress" },
  incomplete: { he: "לא הושלם", en: "Incomplete" },
};

export const MILITARY_FRAMEWORK_LABELS: Record<string, { he: string; en: string }> = {
  idf: { he: "צה״ל", en: "IDF" },
  national_service: { he: "שירות לאומי", en: "National Service" },
  other_security: { he: "שירות ביטחוני אחר", en: "Other Security Service" },
  none: { he: "לא שירתתי", en: "Did Not Serve" },
  undisclosed: { he: "מעדיף/ה לא לציין", en: "Prefer Not to Say" },
};

export const ROTARY_POSITION_LEVEL_LABELS: Record<string, { he: string; en: string }> = {
  club: { he: "מועדון", en: "Club" },
  district: { he: "מחוז", en: "District" },
  international: { he: "בינלאומי", en: "International" },
  other: { he: "אחר", en: "Other" },
};

export const INTEREST_CATEGORY_LABELS: Record<string, { he: string; en: string }> = {
  technology: { he: "טכנולוגיה", en: "Technology" },
  entrepreneurship: { he: "יזמות", en: "Entrepreneurship" },
  education: { he: "חינוך", en: "Education" },
  law: { he: "משפטים", en: "Law" },
  medicine: { he: "רפואה", en: "Medicine" },
  engineering: { he: "הנדסה", en: "Engineering" },
  arts: { he: "אומנות", en: "Arts" },
  business: { he: "עסקים", en: "Business" },
  sports: { he: "ספורט", en: "Sports" },
  travel: { he: "טיולים", en: "Travel" },
  community_service: { he: "שירות קהילתי", en: "Community Service" },
  finance: { he: "פיננסים", en: "Finance" },
  real_estate: { he: "נדל״ן", en: "Real Estate" },
  media: { he: "תקשורת", en: "Media" },
  environment: { he: "סביבה", en: "Environment" },
  other: { he: "אחר", en: "Other" },
};

export const VISIBILITY_LABELS: Record<string, { he: string; en: string }> = {
  public: { he: "ציבורי", en: "Public" },
  rotary_members: { he: "חברי רוטרי בלבד", en: "Rotary Members Only" },
  club_members: { he: "חברי המועדון בלבד", en: "Club Members Only" },
  private: { he: "פרטי", en: "Private" },
};

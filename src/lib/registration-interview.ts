import type { ConversationState, RegistrationStage, RotaryPosition } from "./conversation";
import {
  educationRecordSchema,
  extractedChildSchema,
  extractedProfileSchema,
  extractedSpouseSchema,
  rotaryPositionSchema,
  militaryServiceSchema,
} from "./conversation";
import { registrationSchema } from "./user-registration";

export const MIN_CHILD_AGE = 28;

// Military framework labels for display
export const MILITARY_FRAMEWORK_LABELS: Record<string, { he: string; en: string }> = {
  idf: { he: "צה״ל", en: "IDF" },
  police: { he: "משטרה", en: "Police" },
  security: { he: "שירותי ביטחון", en: "Security Services" },
  national_service: { he: "שירות לאומי", en: "National Service" },
  none: { he: "לא שירתתי", en: "Did not serve" },
};

export type InterviewUpdate = { path: string; value: string };
export type InterviewQuestion = {
  key: string;
  he: string;
  en: string;
  stage: RegistrationStage;
  required: boolean;
};

const booleanFields = new Set([
  "hasHigherEducation",
  "militaryService",
  "served",
  "completedDuringMilitaryService",
  "hasSpouse",
  "hasChildren",
  "hasEligibleChildren",
]);
const arrayFields = new Set([
  "skills",
  "expertise",
  "interests",
  "interestCategories",
  "hobbies",
  "helpWith",
  "languages",
]);
const stateFields = new Set([
  "customClub",
  "clubId",
  "previousClub",
  "joinYear",
  "rotaryJoinDate",
  "hasSpouse",
  "hasChildren",
  "hasEligibleChildren",
]);
const educationFields = new Set(Object.keys(educationRecordSchema.shape));
const militaryFields = new Set(Object.keys(militaryServiceSchema.shape));
const rotaryPositionFields = new Set(Object.keys(rotaryPositionSchema.shape));

/**
 * Calculate age from birth date string.
 * Accepts: YYYY-MM-DD, YYYY-MM, or YYYY formats.
 * For year-only, assumes birthday has passed (conservative estimate).
 */
export function ageFromBirthDate(value: string, today = new Date()): number | undefined {
  // Normalize the date string - extract year, month, day
  let birthYear: number;
  let birthMonth: number = 1; // Default to January
  let birthDay: number = 1;   // Default to 1st

  // Full date: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const birth = new Date(`${value}T00:00:00Z`);
    if (Number.isNaN(birth.getTime()) || birth.toISOString().slice(0, 10) !== value) return undefined;
    birthYear = birth.getUTCFullYear();
    birthMonth = birth.getUTCMonth() + 1;
    birthDay = birth.getUTCDate();
  }
  // Year-month: YYYY-MM
  else if (/^\d{4}-\d{2}$/.test(value)) {
    const [y, m] = value.split("-").map(Number);
    if (m < 1 || m > 12) return undefined;
    birthYear = y;
    birthMonth = m;
  }
  // Year only: YYYY
  else if (/^\d{4}$/.test(value)) {
    birthYear = Number(value);
  }
  // Invalid format
  else {
    return undefined;
  }

  // Get current date in Israel timezone
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Jerusalem",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(today);
  const part = (type: string) => Number(parts.find((item) => item.type === type)?.value);
  const currentYear = part("year");
  const currentMonth = part("month");
  const currentDay = part("day");

  let age = currentYear - birthYear;

  // Adjust if birthday hasn't occurred yet this year
  if (currentMonth < birthMonth || (currentMonth === birthMonth && currentDay < birthDay)) {
    age--;
  }

  return age >= 0 && age <= 130 ? age : undefined;
}

/**
 * Normalize a birth date/year string to a consistent format.
 * Returns YYYY-MM-DD if full date, YYYY-MM if month given, YYYY if year only.
 */
export function normalizeBirthDate(value: string): string | undefined {
  const trimmed = value.trim();

  // Already in correct format
  if (/^\d{4}(-\d{2}(-\d{2})?)?$/.test(trimmed)) {
    return trimmed;
  }

  // Extract 4-digit year from text like "born in 1980", "1980", "שנת 1980"
  const yearMatch = trimmed.match(/\b(19\d{2}|20[0-2]\d)\b/);
  if (yearMatch) {
    return yearMatch[1];
  }

  return undefined;
}

/**
 * Extract a 4-digit year from various formats.
 * Handles: "2015", "2015-06", "in 2015", "שנת 2015", "joined 2015", etc.
 */
export function normalizeYear(value: string): string | undefined {
  const trimmed = value.trim();

  // Already a 4-digit year
  if (/^\d{4}$/.test(trimmed)) {
    return trimmed;
  }

  // Date format YYYY-MM-DD or YYYY-MM - extract just the year
  if (/^\d{4}-\d{2}(-\d{2})?$/.test(trimmed)) {
    return trimmed.slice(0, 4);
  }

  // Extract 4-digit year from text like "in 2015", "שנת 2015", "joined 2015", "2015 הצטרפתי"
  const yearMatch = trimmed.match(/\b(19\d{2}|20[0-2]\d)\b/);
  if (yearMatch) {
    return yearMatch[1];
  }

  return undefined;
}

// Fields that should be normalized as years
const yearFields = new Set([
  "joinYear",
  "graduationYear",
  "fromYear",
  "toYear",
  "dischargeYear",
  "retirementYear",
]);

const canonicalInterviewAliases: Record<string, string> = {
  "profile.company": "profile.workplace",
  "profile.employer": "profile.workplace",
  "profile.role": "profile.jobTitle",
  "profile.currentRole": "profile.jobTitle",
  "profile.current_role": "profile.jobTitle",
  "profile.militaryRank": "profile.military.dischargeRank",
  "profile.militaryDischargeRank": "profile.military.dischargeRank",
  "profile.dischargeRank": "profile.military.dischargeRank",
  "profile.militaryRole": "profile.military.role",
  "spouse.company": "spouse.workplace",
  "spouse.employer": "spouse.workplace",
  "spouse.role": "spouse.jobTitle",
  "spouse.currentRole": "spouse.jobTitle",
  "spouse.current_role": "spouse.jobTitle",
};

export function canonicalizeInterviewPath(path: string): string {
  const cleaned = path.trim();
  if (!cleaned) return cleaned;
  return canonicalInterviewAliases[cleaned] ?? cleaned;
}

function isQuestionKeyKnown(state: ConversationState, key: string): boolean {
  const resolved = canonicalizeInterviewPath(key);
  const parts = resolved.split(".");
  const root = parts[0];
  const field = parts.at(-1) ?? "";

  if (resolved === "profile.workplace") {
    return Boolean(state.profile.workplace || state.profile.profession || state.profile.jobTitle);
  }
  if (resolved === "profile.jobTitle") {
    return Boolean(state.profile.jobTitle || state.profile.profession);
  }
  if (resolved === "profile.military.dischargeRank") {
    return Boolean(
      state.profile.military?.dischargeRank ||
      state.profile.militaryDischargeRank ||
      (state.profile.militaryService === false && !state.profile.military?.framework),
    );
  }
  if (resolved === "profile.militaryDischargeRank") {
    return isQuestionKeyKnown(state, "profile.military.dischargeRank");
  }

  if (root === "profile" && parts.length === 2) {
    const value = (state.profile as Record<string, unknown>)[field];
    return value !== undefined && value !== null && value !== "";
  }

  if (root === "profile" && parts.length === 3 && parts[1] === "military") {
    const value = (state.profile.military as Record<string, unknown> | undefined)?.[field];
    return value !== undefined && value !== null && value !== "";
  }

  if (root === "spouse" && parts.length === 2) {
    const value = (state.spouse as Record<string, unknown> | undefined)?.[field];
    return value !== undefined && value !== null && value !== "";
  }

  if (root === "children" && parts.length === 3) {
    const index = Number(parts[1]);
    const child = state.children[index];
    const value = child ? (child as Record<string, unknown>)[field] : undefined;
    return value !== undefined && value !== null && value !== "";
  }

  return false;
}

export function eligibleChildren(state: ConversationState, today = new Date()) {
  return state.children.filter((child) => {
    const age = child.dateOfBirth ? ageFromBirthDate(child.dateOfBirth, today) : child.age;
    return typeof age === "number" && Number.isInteger(age) && age >= MIN_CHILD_AGE && age <= 130;
  });
}

/** Apply only known fields; never let model output write arbitrary state properties. */
/**
 * Fix malformed updates from AI models that concatenate path:value pairs.
 * Handles multiple malformed formats:
 * 1. { path: "field1:val1", value: "field2:val2" }
 * 2. { path: 'field1": "val1', value: 'field2": "val2' } (JSON-like with escaped quotes)
 */
function normalizeUpdates(updates: InterviewUpdate[]): InterviewUpdate[] {
  const normalized: InterviewUpdate[] = [];
  for (const { path, value } of updates) {
    // Format 2: Check for JSON-like embedded quotes pattern: 'path": "value'
    const jsonPattern = /^([a-zA-Z][a-zA-Z0-9._\[\]]*)":\s*"(.*)$/;
    const pathJsonMatch = path.match(jsonPattern);
    const valueJsonMatch = value.match(jsonPattern);

    if (pathJsonMatch && valueJsonMatch) {
      // Both have JSON-like format
      const [, path1, value1] = pathJsonMatch;
      const [, path2, value2] = valueJsonMatch;
      if (path1 && value1) normalized.push({ path: path1, value: value1 });
      if (path2 && value2) normalized.push({ path: path2, value: value2 });
      continue;
    }

    // Format 1: Check for simple colon-separated path:value concatenation
    const pathColonIdx = path.indexOf(":");
    const valueColonIdx = value.indexOf(":");

    if (pathColonIdx > 0 && valueColonIdx > 0 &&
        path.includes(".") && value.includes(".") &&
        !path.includes('"')) {
      // Both path and value contain "path:value" format - extract them
      const path1 = path.slice(0, pathColonIdx);
      const value1 = path.slice(pathColonIdx + 1);
      const path2 = value.slice(0, valueColonIdx);
      const value2 = value.slice(valueColonIdx + 1);

      if (path1 && value1) normalized.push({ path: path1, value: value1 });
      if (path2 && value2) normalized.push({ path: path2, value: value2 });
    } else {
      // Normal update, keep as-is
      normalized.push({ path, value });
    }
  }
  return normalized;
}

export function applyInterviewUpdates(
  state: ConversationState,
  updates: InterviewUpdate[],
  today = new Date(),
): ConversationState {
  const next = structuredClone(state);
  // Normalize malformed updates before processing
  const normalizedUpdates = normalizeUpdates(updates);
  for (const { path, value } of normalizedUpdates) {
    const normalizedPath = canonicalizeInterviewPath(path);
    const parts = normalizedPath.split(".");
    if (parts.some((segment) => ["__proto__", "prototype", "constructor"].includes(segment))) continue;
    const root = parts[0],
      field = parts.at(-1)!;
    if (field === "__proto__" || field === "prototype" || field === "constructor") continue;
    let parsed: unknown = value.trim();
    if (booleanFields.has(field)) {
      if (value !== "true" && value !== "false") continue;
      parsed = value === "true";
    } else if (field === "age") {
      // Extract age from various formats: "45", "45 years", "בן 45", "age 45", "I'm 45", etc.
      const ageMatch = value.match(/\b(\d{1,3})\b/);
      if (!ageMatch) continue;
      const age = Number(ageMatch[1]);
      if (age < 1 || age > 130) continue;
      parsed = age;
    } else if (arrayFields.has(field)) {
      try {
        parsed = JSON.parse(value);
      } catch {
        continue;
      }
    } else if (field === "dateOfBirth") {
      // Normalize birth date/year: accepts YYYY-MM-DD, YYYY-MM, YYYY, or text with year
      const normalized = normalizeBirthDate(value);
      if (!normalized) continue;
      parsed = normalized;
    } else if (yearFields.has(field)) {
      // Normalize year fields: extracts YYYY from various formats
      const normalized = normalizeYear(value);
      if (!normalized) continue;
      parsed = normalized;
    } else if (field === "rotaryJoinDate") {
      // Accepts YYYY, YYYY-MM, or YYYY-MM-DD
      const normalized = normalizeBirthDate(value);
      if (!normalized) continue;
      parsed = normalized;
    }
    if (parts.length === 1 && stateFields.has(field)) {
      Object.assign(next, { [field]: parsed });
      continue;
    }
    if (root === "consent" || root === "status" || root === "emailVerification") continue;
    if (
      (root === "profile" || root === "spouse") &&
      parts.length === 4 &&
      parts[1] === "educationHistory" &&
      educationFields.has(field)
    ) {
      const index = Number(parts[2]);
      if (!Number.isInteger(index) || index < 0 || index > 9 || !/^\d+$/.test(parts[2]!)) continue;
      const person = root === "profile" ? next.profile : (next.spouse ??= {});
      person.educationHistory ??= [];
      const record = { ...person.educationHistory[index], [field]: parsed };
      const validated = educationRecordSchema.safeParse(record);
      if (validated.success) person.educationHistory[index] = validated.data;
      continue;
    }
    // Handle profile.military.* fields
    if (
      root === "profile" &&
      parts.length === 3 &&
      parts[1] === "military" &&
      militaryFields.has(field)
    ) {
      next.profile.military ??= {};
      const record = { ...next.profile.military, [field]: parsed };
      const validated = militaryServiceSchema.safeParse(record);
      if (validated.success) next.profile.military = validated.data;
      continue;
    }
    // Handle rotaryPositions.INDEX.* fields
    if (root === "rotaryPositions" && parts.length === 3) {
      const index = Number(parts[1]);
      if (!Number.isInteger(index) || index < 0 || index > 9 || !/^\d+$/.test(parts[1]!)) continue;
      next.rotaryPositions ??= [];
      const record = { ...next.rotaryPositions[index], [field]: parsed };
      const validated = rotaryPositionSchema.safeParse(record);
      if (validated.success) next.rotaryPositions[index] = validated.data;
      continue;
    }
    if (
      root === "profile" &&
      parts.length === 2 &&
      field !== "educationHistory" &&
      Object.hasOwn(extractedProfileSchema.shape, field)
    ) {
      if (field === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(parsed))) {
        continue;
      }
      // Try to validate and apply the update
      const updated = { ...next.profile, [field]: parsed };
      const validated = extractedProfileSchema.safeParse(updated);
      if (validated.success) {
        next.profile = validated.data;
      } else {
        // Log validation failure but still try to apply for string fields
        console.warn(`Profile field validation failed for ${field}:`, validated.error.message);
        // For non-critical string fields, apply anyway
        if (typeof parsed === "string" && !["email", "age"].includes(field)) {
          (next.profile as Record<string, unknown>)[field] = parsed;
        }
      }
    } else if (
      root === "spouse" &&
      parts.length === 2 &&
      field !== "educationHistory" &&
      Object.hasOwn(extractedSpouseSchema.shape, field)
    ) {
      const validated = extractedSpouseSchema.safeParse({ ...next.spouse, [field]: parsed });
      if (validated.success) next.spouse = validated.data;
    } else if (
      root === "children" &&
      parts.length === 3 &&
      Object.hasOwn(extractedChildSchema.shape, field)
    ) {
      const index = Number(parts[1]);
      if (!Number.isInteger(index) || index < 0 || index > 19 || !/^\d+$/.test(parts[1]!)) continue;
      const validated = extractedChildSchema.safeParse({
        ...next.children[index],
        [field]: parsed,
      });
      if (validated.success) next.children[index] = validated.data;
    }
  }
  next.profile.educationHistory = next.profile.educationHistory?.filter(Boolean) ?? [];
  if (next.spouse?.educationHistory)
    next.spouse.educationHistory = next.spouse.educationHistory.filter(Boolean);
  if (next.profile.hasHigherEducation === false) {
    delete next.profile.education;
    next.profile.educationHistory = [];
  }
  if (next.profile.militaryService === false) delete next.profile.militaryDischargeRank;
  if (next.profile.dateOfBirth) {
    const age = ageFromBirthDate(next.profile.dateOfBirth, today);
    if (age === undefined || age < 18) delete next.profile.dateOfBirth;
    else next.profile.age = age;
  }
  next.children = eligibleChildren({ ...next, children: next.children.filter(Boolean) }, today);
  if (next.hasSpouse === false) delete next.spouse;
  if (next.hasChildren === false || next.hasEligibleChildren === false) next.children = [];
  if (next.spouse && next.hasSpouse === undefined) next.hasSpouse = true;
  if (next.children.length) {
    next.hasChildren = true;
    next.hasEligibleChildren = true;
  }
  if (next.rotaryJoinDate) next.joinYear = next.rotaryJoinDate.slice(0, 4);
  return next;
}

export function getInterviewQuestions(state: ConversationState): InterviewQuestion[] {
  const questions: InterviewQuestion[] = [];
  const skipped = new Set(state.skippedFields ?? []);
  function add(
    key: string,
    known: unknown,
    he: string,
    en: string,
    stage: RegistrationStage,
    required = false,
  ) {
    if (isQuestionKeyKnown(state, key)) return;
    if (
      known !== undefined &&
      known !== null &&
      known !== "" &&
      (!Array.isArray(known) || known.length > 0)
    )
      return;
    if (!required && skipped.has(key)) return;
    questions.push({ key, he, en, stage, required });
  }
  const p = state.profile;
  add(
    "profile.firstName",
    p.firstName,
    "מה השם הפרטי שלך?",
    "What is your first name?",
    "account",
    true,
  );
  add(
    "profile.lastName",
    p.lastName,
    "ומה שם המשפחה שלך?",
    "What is your last name?",
    "account",
    true,
  );
  add(
    "profile.age",
    p.age ?? (p.dateOfBirth ? ageFromBirthDate(p.dateOfBirth) : undefined),
    "מה גילך או תאריך הלידה שלך?",
    "What is your age or date of birth?",
    "personal",
    true,
  );
  add(
    "profile.hasHigherEducation",
    p.hasHigherEducation ?? (p.education || p.educationHistory?.length ? true : undefined),
    "מה ההשכלה שלך? אפשר לציין גם שאין לימודים אקדמיים.",
    "What is your education? You can also say you have no higher education.",
    "professional",
  );
  if (
    p.hasHigherEducation !== false &&
    (p.hasHigherEducation || p.education || p.educationHistory?.length)
  ) {
    const records = p.educationHistory?.length ? p.educationHistory : [{}];
    records.forEach((education, index) => {
      const prefix = `profile.educationHistory.${index}.`;
      const name =
        education.degree ||
        education.fieldOfStudy ||
        (state.language === "he" ? "הלימודים" : "your studies");
      add(
        prefix + "degree",
        education.degree || education.fieldOfStudy,
        "איזה תואר או מסלול לימודים השלמת?",
        "What degree or course did you complete?",
        "professional",
      );
      add(
        prefix + "institution",
        education.institution,
        `באיזה מוסד למדת ${name}?`,
        `At which institution did you study ${name}?`,
        "professional",
      );
      add(
        prefix + "graduationYear",
        education.graduationYear,
        `באיזו שנה סיימת ${name}?`,
        `In what year did you finish ${name}?`,
        "professional",
      );
      add(
        prefix + "specialization",
        education.specialization,
        `האם הייתה התמחות במסגרת ${name}? אפשר לציין שלא.`,
        `Did ${name} include a specialization? You can say none.`,
        "professional",
      );
      add(
        prefix + "postGraduationActivities",
        education.postGraduationActivities,
        "האם המשכת ללימודים, הכשרה או פעילות מקצועית לאחר הסיום?",
        "Did you pursue further study, training or professional activities after graduation?",
        "professional",
      );
      if (p.militaryService !== false && !skipped.has("profile.militaryService"))
        add(
          prefix + "completedDuringMilitaryService",
          education.completedDuringMilitaryService,
          "האם השלמת את הלימודים במהלך השירות הצבאי?",
          "Did you complete these studies during military service?",
          "professional",
        );
    });
  }
  add(
    "profile.profession",
    p.profession || p.jobTitle,
    "במה עסקת או במה את/ה עוסק/ת כיום?",
    "What is your current or previous occupation?",
    "professional",
  );
  add(
    "profile.workplace",
    p.workplace,
    "באיזה ארגון או חברה עבדת?",
    "At which organization or company did you work?",
    "professional",
  );
  add(
    "customClub",
    state.clubId || state.customClub,
    "מה שם מועדון הרוטרי שלך?",
    "What is your Rotary club's name?",
    "rotary",
    true,
  );
  add(
    "joinYear",
    state.joinYear || state.rotaryJoinDate,
    "מתי הצטרפת לרוטרי? אפשר למסור תאריך או שנה.",
    "When did you join Rotary? A date or year is fine.",
    "rotary",
    true,
  );
  if (state.joinYear)
    add(
      "rotaryJoinDate",
      state.rotaryJoinDate,
      "האם זכורים לך גם החודש או התאריך המדויק של ההצטרפות לרוטרי? אפשר להסתפק בשנה ולדלג.",
      "Do you also remember the month or exact date you joined Rotary? You can skip and keep the year only.",
      "rotary",
    );
  add(
    "rotaryPositions",
    state.rotaryPositions?.length ? state.rotaryPositions : undefined,
    "האם מילאת תפקידים ברוטרי? (נשיא מועדון, מושל וכו׳)",
    "Have you held any Rotary positions? (Club President, Governor, etc.)",
    "rotary",
  );
  add(
    "hasSpouse",
    state.hasSpouse,
    "האם יש לך בן או בת זוג? אפשר לדלג.",
    "Do you have a spouse or partner? You can skip.",
    "spouse_intro",
  );
  if (state.hasSpouse) {
    add(
      "spouse.firstName",
      state.spouse?.firstName,
      "מה שם בן או בת הזוג?",
      "What is your partner's name?",
      "spouse_details",
    );
    add(
      "spouse.age",
      state.spouse?.age,
      "מה גיל בן או בת הזוג?",
      "How old is your partner?",
      "spouse_details",
    );
    add(
      "spouse.profession",
      state.spouse?.profession || state.spouse?.jobTitle,
      "במה בן או בת הזוג עוסקים?",
      "What does your partner do?",
      "spouse_details",
    );
    add(
      "spouse.education",
      state.spouse?.education || state.spouse?.educationHistory?.length,
      "מה ההשכלה של בן או בת הזוג?",
      "What is your partner's education?",
      "spouse_details",
    );
  }
  add(
    "hasChildren",
    state.hasChildren,
    "האם יש לך ילדים? אין צורך למסור פרטים על ילדים מתחת לגיל 28.",
    "Do you have children? Please leave out details of children younger than 28.",
    "children_intro",
  );
  if (state.hasChildren)
    add(
      "hasEligibleChildren",
      state.hasEligibleChildren,
      "האם יש ילדים בני 28 ומעלה שתרצה/י להוסיף?",
      "Are any children aged 28 or older that you would like to include?",
      "children_intro",
    );
  if (state.hasEligibleChildren) {
    add(
      "children",
      state.children.length || undefined,
      "ספרו על ילד או ילדה בני 28 ומעלה: גיל, שם, לימודים או עיסוק נוכחי.",
      "Tell me about a child aged 28 or older: age, name, education or current work.",
      "children_details",
    );
    eligibleChildren(state).forEach((child, index) => {
      add(
        `children.${index}.name`,
        child.name,
        "מה שם הילד או הילדה הבוגרים?",
        "What is your adult child's name?",
        "children_details",
      );
      add(
        `children.${index}.profession`,
        child.profession || child.education,
        "במה הילד או הילדה הבוגרים עוסקים או לומדים?",
        "What does your adult child do or study?",
        "children_details",
      );
      if (child.education)
        add(
          `children.${index}.institution`,
          child.institution,
          "באיזה מוסד הילד או הילדה הבוגרים לומדים או למדו?",
          "At which institution does your adult child study or did they study?",
          "children_details",
        );
    });
  }
  // Military service questions - support both legacy and new structure
  const militaryServed = p.military?.served ?? p.militaryService;
  add(
    "profile.military.framework",
    p.military?.framework ?? (p.militaryService !== undefined ? (p.militaryService ? "idf" : "none") : undefined),
    "באיזו מסגרת שירתת? (צה״ל, משטרה, שירות לאומי, או לא שירתתי)",
    "In which framework did you serve? (IDF, Police, National Service, or did not serve)",
    "military",
  );
  if (militaryServed && p.military?.framework !== "none") {
    add(
      "profile.military.unit",
      p.military?.unit,
      "באיזה חיל או יחידה שירתת?",
      "In which corps or unit did you serve?",
      "military",
    );
    add(
      "profile.military.role",
      p.military?.role,
      "מה היה תפקידך בשירות?",
      "What was your role during service?",
      "military",
    );
    add(
      "profile.militaryDischargeRank",
      p.military?.dischargeRank ?? p.militaryDischargeRank,
      "מה הייתה דרגת השחרור שלך?",
      "What was your rank at discharge?",
      "military",
    );
    add(
      "profile.military.commandExperience",
      p.military?.commandExperience,
      "האם היה לך ניסיון פיקודי? אפשר לדלג.",
      "Did you have any command experience? You can skip.",
      "military",
    );
  }
  // Email is required but only ask if not yet provided
  // Once provided, verification will be triggered automatically
  const emailVerified = state.emailVerification?.status === "verified";
  add(
    "profile.email",
    emailVerified ? p.email : p.email, // If verified, consider it known
    "מה כתובת הדוא״ל שלך ליצירת החשבון?",
    "What email address should we use for your account?",
    "account",
    true,
  );
  add("profile.city", p.city, "באיזו עיר את/ה גר/ה?", "Which city do you live in?", "personal");
  add(
    "profile.phone",
    p.phone,
    "מה מספר הטלפון שלך? אפשר לדלג.",
    "What is your phone number? You can skip.",
    "personal",
  );
  // Interests & Activities
  add(
    "profile.interestCategories",
    p.interestCategories?.length ? p.interestCategories : undefined,
    "מה תחומי העניין שלך? (עסקים, טכנולוגיה, בריאות, חינוך, אמנות, ספורט, סביבה, קהילה)",
    "What are your areas of interest? (Business, Technology, Health, Education, Arts, Sports, Environment, Community)",
    "interests",
  );
  add(
    "profile.hobbies",
    p.hobbies?.length ? p.hobbies : p.interests,
    "אילו תחביבים יש לך?",
    "What hobbies do you have?",
    "interests",
  );
  add(
    "profile.expertise",
    p.expertise?.length ? p.expertise : undefined,
    "באילו תחומים יש לך מומחיות שתוכל/י לשתף?",
    "In what areas do you have expertise you could share?",
    "interests",
  );
  add(
    "profile.volunteering",
    p.volunteering,
    "האם יש לך ניסיון בהתנדבות?",
    "Do you have any volunteering experience?",
    "interests",
  );
  add(
    "profile.boards",
    p.boards,
    "האם השתתפת בדירקטוריון, בעמותה או בפעילות חברתית? אפשר לציין שלא.",
    "Have you been involved in boards, associations or community activities? You can say none.",
    "interests",
  );
  add(
    "profile.goals",
    p.goals,
    "באילו נושאים תרצה/י ליצור קשרים או לעזור לחברי רוטרי?",
    "What connections are you looking for, or how can you help other Rotary members?",
    "interests",
  );
  return questions;
}

export function skipInterviewQuestions(state: ConversationState, requested: string[]) {
  const optional = getInterviewQuestions(state)
    .filter((question) => !question.required)
    .map((question) => question.key);
  const next = {
    ...state,
    skippedFields: [
      ...new Set([
        ...(state.skippedFields ?? []),
        ...requested.filter((key) => optional.includes(key)),
      ]),
    ],
  };
  return next;
}

export function generateProfileSummary(state: ConversationState): string {
  const he = state.language === "he";
  const lines = [he ? "סיכום הפרופיל שלך:" : "Your profile summary:"];
  const label = (heText: string, enText: string) => (he ? heText : enText);
  function add(name: string, value: unknown) {
    if (
      value === undefined ||
      value === null ||
      value === "" ||
      (Array.isArray(value) && !value.length)
    )
      return;
    lines.push(
      `${name}: ${typeof value === "boolean" ? (value ? label("כן", "Yes") : label("לא", "No")) : Array.isArray(value) ? value.join(", ") : value}`,
    );
  }
  add(
    label("שם", "Name"),
    [state.profile.firstName, state.profile.lastName].filter(Boolean).join(" "),
  );
  const profileLabels: Record<string, [string, string]> = {
    age: ["גיל", "Age"],
    dateOfBirth: ["תאריך לידה", "Date of birth"],
    email: ["דוא״ל", "Email"],
    phone: ["טלפון", "Phone"],
    city: ["עיר", "City"],
    profession: ["מקצוע", "Profession"],
    jobTitle: ["תפקיד", "Role"],
    workplace: ["מקום עבודה", "Workplace"],
    employmentStatus: ["סטטוס תעסוקה", "Employment status"],
    education: ["השכלה", "Education"],
    boards: ["פעילות חברתית ודירקטוריונים", "Community activities and boards"],
    hobbies: ["תחביבים", "Hobbies"],
    interestCategories: ["תחומי עניין", "Interest areas"],
    goals: ["מטרות ברשת", "Networking goals"],
    expertise: ["מומחיות", "Expertise"],
    interests: ["תחומי עניין", "Interests"],
    volunteering: ["התנדבות", "Volunteering"],
    skills: ["כישורים", "Skills"],
    industry: ["ענף", "Industry"],
    experience: ["ניסיון", "Experience"],
    shortBio: ["אודות", "About"],
    helpWith: ["אפשר לעזור ב", "Can help with"],
    languages: ["שפות", "Languages"],
  };
  for (const [key, names] of Object.entries(profileLabels))
    add(label(...names), state.profile[key as keyof typeof state.profile]);

  // Military service (support both legacy and new)
  const military = state.profile.military;
  const dischargeRank = military?.dischargeRank ?? state.profile.militaryDischargeRank;
  if (military?.framework || military?.dischargeRank || state.profile.militaryDischargeRank || state.profile.militaryService !== undefined) {
    if (military?.framework) {
      const frameworkLabels: Record<string, [string, string]> = {
        idf: ["צה״ל", "IDF"],
        police: ["משטרה", "Police"],
        security: ["שירותי ביטחון", "Security Services"],
        national_service: ["שירות לאומי", "National Service"],
        none: ["לא שירת/ה", "Did not serve"],
      };
      add(label("מסגרת שירות", "Service framework"), label(...(frameworkLabels[military.framework] || ["", ""])));
      if (military.unit) add(label("יחידה", "Unit"), military.unit);
      if (military.role) add(label("תפקיד בשירות", "Service role"), military.role);
      if (dischargeRank) add(label("דרגת שחרור", "Discharge rank"), dischargeRank);
      if (military.commandExperience) add(label("ניסיון פיקודי", "Command experience"), military.commandExperience);
    } else {
      add(label("שירות צבאי", "Military service"), state.profile.militaryService);
      if (dischargeRank) add(label("דרגת שחרור", "Discharge rank"), dischargeRank);
    }
  } else {
    // Legacy fields
    add(label("שירות צבאי", "Military service"), state.profile.militaryService);
    if (dischargeRank) add(label("דרגת שחרור", "Discharge rank"), dischargeRank);
  }
  for (const [key, names] of Object.entries(profileLabels))
    add(label(...names), state.profile[key as keyof typeof state.profile]);
  const educationLabels: Record<string, [string, string]> = {
    degree: ["תואר", "Degree"],
    fieldOfStudy: ["תחום לימודים", "Field of study"],
    institution: ["מוסד", "Institution"],
    graduationYear: ["שנת סיום", "Graduation year"],
    specialization: ["התמחות", "Specialization"],
    postGraduationActivities: ["פעילות לאחר הלימודים", "Post-graduation activities"],
    completedDuringMilitaryService: ["לימודים במהלך השירות", "Studies during military service"],
  };
  state.profile.educationHistory?.forEach((record, index) => {
    lines.push(`\n${label("השכלה", "Education")} ${index + 1}`);
    for (const [key, names] of Object.entries(educationLabels))
      add(label(...names), record[key as keyof typeof record]);
  });
  add(label("מועדון רוטרי", "Rotary club"), state.customClub || state.clubId);
  if (state.previousClub) add(label("מועדון קודם", "Previous club"), state.previousClub);
  add(label("הצטרפות לרוטרי", "Joined Rotary"), state.rotaryJoinDate || state.joinYear);
  // Rotary positions
  state.rotaryPositions?.forEach((pos, index) => {
    const parts = [];
    if (pos.title) parts.push(pos.title);
    if (pos.level) {
      const levelLabels: Record<string, [string, string]> = {
        club: ["מועדון", "Club"],
        district: ["מחוז", "District"],
        national: ["ארצי", "National"],
        international: ["בינלאומי", "International"],
      };
      parts.push(`(${label(...(levelLabels[pos.level] || ["", ""]))})`);
    }
    if (pos.fromYear) parts.push(pos.fromYear);
    if (pos.toYear) parts.push(`- ${pos.toYear}`);
    if (parts.length) {
      add(label(`תפקיד רוטרי ${index + 1}`, `Rotary position ${index + 1}`), parts.join(" "));
    }
  });
  add(label("בן או בת זוג", "Has a partner"), state.hasSpouse);
  if (state.hasSpouse && state.spouse) {
    add(
      label("שם בן/בת הזוג", "Partner's name"),
      [state.spouse.firstName, state.spouse.lastName].filter(Boolean).join(" "),
    );
    add(label("גיל בן/בת הזוג", "Partner's age"), state.spouse.age);
    add(
      label("עיסוק בן/בת הזוג", "Partner's occupation"),
      state.spouse.profession || state.spouse.jobTitle,
    );
    add(label("השכלת בן/בת הזוג", "Partner's education"), state.spouse.education);
  }
  eligibleChildren(state).forEach((child) =>
    add(
      label("ילד/ה בוגר/ת", "Adult child"),
      [
        child.name,
        child.age,
        child.education,
        child.institution,
        child.graduationYear,
        child.profession,
        child.workplace,
      ]
        .filter((value) => value !== undefined && value !== "")
        .join(" · "),
    ),
  );
  lines.push(
    "",
    label(
      "אפשר לתקן פרטים בהודעה או לבחור בסיום ההרשמה.",
      "You can correct any detail in a message or choose Finish registration.",
    ),
  );
  return lines.join("\n");
}

export function toRegistrationInput(state: ConversationState) {
  const missing = getInterviewQuestions(state).filter((question) => question.required);
  if (missing.length) throw new Error("Required registration details are missing");

  const militaryDischargeRank =
    state.profile.military?.dischargeRank ?? state.profile.militaryDischargeRank ?? "";
  const educationText = (
    person: ConversationState["profile"] | NonNullable<ConversationState["spouse"]>,
  ) =>
    person.education ||
    person.educationHistory
      ?.map((record) =>
        [record.degree, record.fieldOfStudy, record.institution, record.graduationYear]
          .filter(Boolean)
          .join(" · "),
      )
      .join("; ") ||
    "";
  const jobs = (person: ConversationState["profile"] | NonNullable<ConversationState["spouse"]>) => {
    // Create a job entry if we have workplace OR profession/jobTitle
    const hasJobInfo = person.workplace || person.jobTitle || person.profession;
    if (!hasJobInfo) return [];
    return [
      {
        employer: person.workplace || "",
        role: person.jobTitle || person.profession || "",
        from: "",
        to: "",
        description: "",
      },
    ];
  };
  return registrationSchema.parse({
    firstName: state.profile.firstName,
    lastName: state.profile.lastName,
    email: state.profile.email,
    dob: state.profile.dateOfBirth || "",
    clubId: state.clubId || "",
    customClub: state.customClub || "",
    joinYear: state.joinYear || state.rotaryJoinDate?.slice(0, 4),
    rotaryJoinDate: state.rotaryJoinDate,
    socialProfiles: { facebook: "", instagram: "", linkedin: "" },
    contactInfo: { ...state.contactInfo, phone: state.contactInfo.phone || state.profile.phone },
    me: {
      gender: "",
      age: String(state.profile.age ?? ""),
      education: educationText(state.profile),
      educationHistory: state.profile.educationHistory,
      jobs: jobs(state.profile),
      boards: state.profile.boards || "",
      hobbies: (state.profile.hobbies || state.profile.interests || []).join(", "),
      militaryService: state.profile.militaryService ?? state.profile.military?.served,
      militaryDischargeRank,
    },
    married: state.hasSpouse === true ? "yes" : state.hasSpouse === false ? "no" : "undisclosed",
    spouse:
      state.hasSpouse && state.spouse
        ? {
            gender: state.spouse.gender || "",
            age: String(state.spouse.age ?? ""),
            education: educationText(state.spouse),
            educationHistory: state.spouse.educationHistory,
            jobs: jobs(state.spouse),
            boards: "",
            hobbies: "",
          }
        : null,
    children: eligibleChildren(state).map((child) => ({
      name: child.name || "",
      dob: child.dateOfBirth || "",
      age: child.age ?? ageFromBirthDate(child.dateOfBirth!),
      status: child.profession || child.education || "",
      education: child.education,
      institution: child.institution,
      graduationYear: child.graduationYear,
      workplace: child.workplace,
    })),
    interviewProfile: state.profile,
    partnerProfile: state.hasSpouse ? state.spouse : undefined,
    hasChildren: state.hasChildren,
    networkingPreferences: state.networkingPreferences,
    onboarded: true,
  });
}

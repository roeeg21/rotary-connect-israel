import type { ConversationState, RegistrationStage } from "./conversation";
import {
  educationRecordSchema,
  extractedChildSchema,
  extractedProfileSchema,
  extractedSpouseSchema,
} from "./conversation";
import { registrationSchema } from "./user-registration";

export const MIN_CHILD_AGE = 28;

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
  "completedDuringMilitaryService",
  "hasSpouse",
  "hasChildren",
  "hasEligibleChildren",
]);
const arrayFields = new Set([
  "skills",
  "expertise",
  "interests",
  "hobbies",
  "helpWith",
  "languages",
]);
const stateFields = new Set([
  "customClub",
  "clubId",
  "joinYear",
  "rotaryJoinDate",
  "hasSpouse",
  "hasChildren",
  "hasEligibleChildren",
]);
const educationFields = new Set(Object.keys(educationRecordSchema.shape));

export function ageFromBirthDate(value: string, today = new Date()): number | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const birth = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(birth.getTime()) || birth.toISOString().slice(0, 10) !== value) return undefined;
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Jerusalem",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(today);
  const part = (type: string) => Number(parts.find((item) => item.type === type)?.value);
  const year = part("year"),
    month = part("month"),
    day = part("day");
  let age = year - birth.getUTCFullYear();
  if (
    month < birth.getUTCMonth() + 1 ||
    (month === birth.getUTCMonth() + 1 && day < birth.getUTCDate())
  )
    age--;
  return age >= 0 && age <= 130 ? age : undefined;
}

export function eligibleChildren(state: ConversationState, today = new Date()) {
  return state.children.filter((child) => {
    const age = child.dateOfBirth ? ageFromBirthDate(child.dateOfBirth, today) : child.age;
    return typeof age === "number" && Number.isInteger(age) && age >= MIN_CHILD_AGE && age <= 130;
  });
}

/** Apply only known fields; never let model output write arbitrary state properties. */
export function applyInterviewUpdates(
  state: ConversationState,
  updates: InterviewUpdate[],
  today = new Date(),
): ConversationState {
  const next = structuredClone(state);
  for (const { path, value } of updates) {
    const parts = path.split(".");
    const root = parts[0],
      field = parts.at(-1)!;
    let parsed: unknown = value.trim();
    if (booleanFields.has(field)) {
      if (value !== "true" && value !== "false") continue;
      parsed = value === "true";
    } else if (field === "age") {
      if (!/^\d{1,3}$/.test(value)) continue;
      parsed = Number(value);
    } else if (arrayFields.has(field)) {
      try {
        parsed = JSON.parse(value);
      } catch {
        continue;
      }
    }
    if (parts.length === 1 && stateFields.has(field)) {
      if (
        ["joinYear", "rotaryJoinDate"].includes(field) &&
        !/^(19|20)\d{2}(?:-\d{2}(?:-\d{2})?)?$/.test(value)
      )
        continue;
      Object.assign(next, { [field]: parsed });
      continue;
    }
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
    if (
      root === "profile" &&
      parts.length === 2 &&
      field !== "educationHistory" &&
      Object.hasOwn(extractedProfileSchema.shape, field)
    ) {
      const validated = extractedProfileSchema.safeParse({ ...next.profile, [field]: parsed });
      if (validated.success) next.profile = validated.data;
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
    "community",
    true,
  );
  add(
    "joinYear",
    state.joinYear || state.rotaryJoinDate,
    "מתי הצטרפת לרוטרי? אפשר למסור תאריך או שנה.",
    "When did you join Rotary? A date or year is fine.",
    "community",
    true,
  );
  if (state.joinYear)
    add(
      "rotaryJoinDate",
      state.rotaryJoinDate,
      "האם זכורים לך גם החודש או התאריך המדויק של ההצטרפות לרוטרי? אפשר להסתפק בשנה ולדלג.",
      "Do you also remember the month or exact date you joined Rotary? You can skip and keep the year only.",
      "community",
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
  add(
    "profile.militaryService",
    p.militaryService,
    "האם שירתת בצבא? אפשר לדלג על פרטי שירות.",
    "Did you serve in the military? Service details are optional.",
    "personal",
  );
  if (p.militaryService)
    add(
      "profile.militaryDischargeRank",
      p.militaryDischargeRank,
      "מה הייתה דרגת השחרור שלך?",
      "What was your rank at military discharge?",
      "personal",
    );
  add(
    "profile.email",
    p.email,
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
  add(
    "profile.boards",
    p.boards,
    "האם השתתפת בדירקטוריון, בעמותה או בפעילות חברתית? אפשר לציין שלא.",
    "Have you been involved in boards, associations or community activities? You can say none.",
    "networking",
  );
  add(
    "profile.hobbies",
    p.hobbies?.length ? p.hobbies : p.interests,
    "אילו תחביבים או תחומי עניין תרצה/י לציין?",
    "What hobbies or interests would you like to share?",
    "networking",
  );
  add(
    "profile.goals",
    p.goals,
    "באילו נושאים תרצה/י ליצור קשרים או לעזור לחברי רוטרי?",
    "What connections are you looking for, or how can you help other Rotary members?",
    "networking",
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
    education: ["השכלה", "Education"],
    militaryService: ["שירות צבאי", "Military service"],
    militaryDischargeRank: ["דרגת שחרור", "Discharge rank"],
    boards: ["פעילות חברתית ודירקטוריונים", "Community activities and boards"],
    hobbies: ["תחביבים", "Hobbies"],
    goals: ["מטרות ברשת", "Networking goals"],
    expertise: ["מומחיות", "Expertise"],
    interests: ["תחומי עניין", "Interests"],
    skills: ["כישורים", "Skills"],
    industry: ["ענף", "Industry"],
    experience: ["ניסיון", "Experience"],
    shortBio: ["אודות", "About"],
    helpWith: ["אפשר לעזור ב", "Can help with"],
    languages: ["שפות", "Languages"],
  };
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
  add(label("הצטרפות לרוטרי", "Joined Rotary"), state.rotaryJoinDate || state.joinYear);
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
      militaryService: state.profile.militaryService,
      militaryDischargeRank: state.profile.militaryDischargeRank,
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

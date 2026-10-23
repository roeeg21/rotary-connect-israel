/**
 * "Don't Ask Twice" Tests
 *
 * Critical tests to ensure the Smart Registration system NEVER asks
 * for information that has already been provided by the user.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  applyInterviewUpdates,
  getInterviewQuestions,
  generateProfileSummary,
  type InterviewUpdate,
} from "./registration-interview";
import type { ConversationState } from "./conversation";
import { createInitialState } from "./conversation";

// Helper to check if a question key is still being asked
function isQuestionStillAsked(state: ConversationState, questionKey: string): boolean {
  const questions = getInterviewQuestions(state);
  return questions.some((q) => q.key === questionKey);
}

// Helper to apply updates and verify fields are no longer asked
function applyAndVerify(
  state: ConversationState,
  updates: InterviewUpdate[],
  fieldsToCheck: string[]
): ConversationState {
  const updated = applyInterviewUpdates(state, updates);

  for (const field of fieldsToCheck) {
    expect(isQuestionStillAsked(updated, field)).toBe(false);
  }

  return updated;
}

describe("Don't Ask Twice - Basic Profile Fields", () => {
  let state: ConversationState;

  beforeEach(() => {
    state = createInitialState("test-session", "he");
  });

  it("should NOT ask for firstName after it's provided", () => {
    expect(isQuestionStillAsked(state, "profile.firstName")).toBe(true);

    const updated = applyInterviewUpdates(state, [
      { path: "profile.firstName", value: "דוד" },
    ]);

    expect(updated.profile.firstName).toBe("דוד");
    expect(isQuestionStillAsked(updated, "profile.firstName")).toBe(false);
  });

  it("should NOT ask for lastName after it's provided", () => {
    expect(isQuestionStillAsked(state, "profile.lastName")).toBe(true);

    const updated = applyInterviewUpdates(state, [
      { path: "profile.lastName", value: "כהן" },
    ]);

    expect(updated.profile.lastName).toBe("כהן");
    expect(isQuestionStillAsked(updated, "profile.lastName")).toBe(false);
  });

  it("should NOT ask for email after it's provided", () => {
    const updated = applyInterviewUpdates(state, [
      { path: "profile.email", value: "david@example.com" },
    ]);

    expect(updated.profile.email).toBe("david@example.com");
    expect(isQuestionStillAsked(updated, "profile.email")).toBe(false);
  });

  it("should NOT ask for age after it's provided", () => {
    const updated = applyInterviewUpdates(state, [
      { path: "profile.age", value: "45" },
    ]);

    expect(updated.profile.age).toBe(45);
    expect(isQuestionStillAsked(updated, "profile.age")).toBe(false);
  });

  it("should NOT ask for age after dateOfBirth is provided", () => {
    const updated = applyInterviewUpdates(state, [
      { path: "profile.dateOfBirth", value: "1980-05-15" },
    ]);

    // Age should be calculated from dateOfBirth
    expect(updated.profile.dateOfBirth).toBe("1980-05-15");
    expect(updated.profile.age).toBeGreaterThan(0);
    expect(isQuestionStillAsked(updated, "profile.age")).toBe(false);
  });

  it("should NOT ask for city after it's provided", () => {
    const updated = applyInterviewUpdates(state, [
      { path: "profile.city", value: "תל אביב" },
    ]);

    expect(updated.profile.city).toBe("תל אביב");
    expect(isQuestionStillAsked(updated, "profile.city")).toBe(false);
  });

  it("should NOT ask for phone after it's provided", () => {
    const updated = applyInterviewUpdates(state, [
      { path: "profile.phone", value: "054-1234567" },
    ]);

    expect(updated.profile.phone).toBe("054-1234567");
    expect(isQuestionStillAsked(updated, "profile.phone")).toBe(false);
  });
});

describe("Don't Ask Twice - Profession and Workplace", () => {
  let state: ConversationState;

  beforeEach(() => {
    state = createInitialState("test-session", "he");
  });

  it("should NOT ask for profession after it's provided", () => {
    const updated = applyInterviewUpdates(state, [
      { path: "profile.profession", value: "עורך דין" },
    ]);

    expect(updated.profile.profession).toBe("עורך דין");
    expect(isQuestionStillAsked(updated, "profile.profession")).toBe(false);
  });

  it("should NOT ask for workplace after it's provided", () => {
    const updated = applyInterviewUpdates(state, [
      { path: "profile.workplace", value: "משרד כהן ושות׳" },
    ]);

    expect(updated.profile.workplace).toBe("משרד כהן ושות׳");
    expect(isQuestionStillAsked(updated, "profile.workplace")).toBe(false);
  });

  it("should handle workplace aliases (company, employer)", () => {
    // Test that profile.company maps to profile.workplace
    const updated1 = applyInterviewUpdates(state, [
      { path: "profile.company", value: "גוגל" },
    ]);
    expect(updated1.profile.workplace).toBe("גוגל");

    // Test that profile.employer maps to profile.workplace
    const updated2 = applyInterviewUpdates(state, [
      { path: "profile.employer", value: "מיקרוסופט" },
    ]);
    expect(updated2.profile.workplace).toBe("מיקרוסופט");
  });
});

describe("Don't Ask Twice - Rotary Information", () => {
  let state: ConversationState;

  beforeEach(() => {
    state = createInitialState("test-session", "he");
  });

  it("should NOT ask for club after customClub is provided", () => {
    const updated = applyInterviewUpdates(state, [
      { path: "customClub", value: "רוטרי תל אביב" },
    ]);

    expect(updated.customClub).toBe("רוטרי תל אביב");
    expect(isQuestionStillAsked(updated, "customClub")).toBe(false);
  });

  it("should NOT ask for joinYear after it's provided", () => {
    const updated = applyInterviewUpdates(state, [
      { path: "joinYear", value: "2015" },
    ]);

    expect(updated.joinYear).toBe("2015");
    expect(isQuestionStillAsked(updated, "joinYear")).toBe(false);
  });

  it("should extract joinYear from rotaryJoinDate", () => {
    const updated = applyInterviewUpdates(state, [
      { path: "rotaryJoinDate", value: "2015-06-15" },
    ]);

    expect(updated.rotaryJoinDate).toBe("2015-06-15");
    expect(updated.joinYear).toBe("2015");
    expect(isQuestionStillAsked(updated, "joinYear")).toBe(false);
  });
});

describe("Don't Ask Twice - Education", () => {
  let state: ConversationState;

  beforeEach(() => {
    state = createInitialState("test-session", "he");
  });

  it("should NOT ask for education if hasHigherEducation is false", () => {
    const updated = applyInterviewUpdates(state, [
      { path: "profile.hasHigherEducation", value: "false" },
    ]);

    expect(updated.profile.hasHigherEducation).toBe(false);
    // Should not ask any education-related questions
    const questions = getInterviewQuestions(updated);
    const educationQuestions = questions.filter((q) =>
      q.key.includes("educationHistory") || q.key === "profile.hasHigherEducation"
    );
    expect(educationQuestions.length).toBe(0);
  });

  it("should NOT ask for degree again after it's provided", () => {
    state.profile.hasHigherEducation = true;

    const updated = applyInterviewUpdates(state, [
      { path: "profile.educationHistory.0.degree", value: "תואר ראשון במשפטים" },
    ]);

    expect(updated.profile.educationHistory?.[0]?.degree).toBe("תואר ראשון במשפטים");
    expect(isQuestionStillAsked(updated, "profile.educationHistory.0.degree")).toBe(false);
  });

  it("should NOT ask for institution again after it's provided", () => {
    state.profile.hasHigherEducation = true;

    const updated = applyInterviewUpdates(state, [
      { path: "profile.educationHistory.0.institution", value: "אוניברסיטת תל אביב" },
    ]);

    expect(updated.profile.educationHistory?.[0]?.institution).toBe("אוניברסיטת תל אביב");
    expect(isQuestionStillAsked(updated, "profile.educationHistory.0.institution")).toBe(false);
  });

  it("should NOT ask for graduationYear again after it's provided", () => {
    state.profile.hasHigherEducation = true;

    const updated = applyInterviewUpdates(state, [
      { path: "profile.educationHistory.0.graduationYear", value: "2010" },
    ]);

    expect(updated.profile.educationHistory?.[0]?.graduationYear).toBe("2010");
    expect(isQuestionStillAsked(updated, "profile.educationHistory.0.graduationYear")).toBe(false);
  });
});

describe("Don't Ask Twice - Military Service", () => {
  let state: ConversationState;

  beforeEach(() => {
    state = createInitialState("test-session", "he");
  });

  it("should NOT ask military details if framework is 'none'", () => {
    const updated = applyInterviewUpdates(state, [
      { path: "profile.military.framework", value: "none" },
    ]);

    expect(updated.profile.military?.framework).toBe("none");

    // Should not ask for unit, role, rank etc.
    const questions = getInterviewQuestions(updated);
    const militaryDetailQuestions = questions.filter((q) =>
      q.key.includes("military.unit") ||
      q.key.includes("military.role") ||
      q.key.includes("military.dischargeRank")
    );
    expect(militaryDetailQuestions.length).toBe(0);
  });

  it("should NOT ask for dischargeRank again after it's provided", () => {
    state.profile.military = { served: true, framework: "idf" };

    const updated = applyInterviewUpdates(state, [
      { path: "profile.military.dischargeRank", value: "סרן" },
    ]);

    expect(updated.profile.military?.dischargeRank).toBe("סרן");
    expect(isQuestionStillAsked(updated, "profile.military.dischargeRank")).toBe(false);
    expect(isQuestionStillAsked(updated, "profile.militaryDischargeRank")).toBe(false);
  });

  it("should handle dischargeRank alias paths", () => {
    state.profile.military = { served: true, framework: "idf" };

    // Using alias path
    const updated = applyInterviewUpdates(state, [
      { path: "profile.militaryRank", value: "רב סרן" },
    ]);

    expect(updated.profile.military?.dischargeRank).toBe("רב סרן");
  });
});

describe("Don't Ask Twice - Spouse Information", () => {
  let state: ConversationState;

  beforeEach(() => {
    state = createInitialState("test-session", "he");
  });

  it("should NOT ask spouse questions if hasSpouse is false", () => {
    const updated = applyInterviewUpdates(state, [
      { path: "hasSpouse", value: "false" },
    ]);

    expect(updated.hasSpouse).toBe(false);
    expect(updated.spouse).toBeUndefined();

    // Should not ask any spouse questions
    const questions = getInterviewQuestions(updated);
    const spouseQuestions = questions.filter((q) => q.key.startsWith("spouse."));
    expect(spouseQuestions.length).toBe(0);
  });

  it("should NOT ask for spouse name again after it's provided", () => {
    state.hasSpouse = true;

    const updated = applyInterviewUpdates(state, [
      { path: "spouse.firstName", value: "שרה" },
    ]);

    expect(updated.spouse?.firstName).toBe("שרה");
    expect(isQuestionStillAsked(updated, "spouse.firstName")).toBe(false);
  });

  it("should auto-set hasSpouse=true when spouse data is provided", () => {
    const updated = applyInterviewUpdates(state, [
      { path: "spouse.firstName", value: "שרה" },
      { path: "spouse.profession", value: "רופאה" },
    ]);

    expect(updated.hasSpouse).toBe(true);
    expect(updated.spouse?.firstName).toBe("שרה");
    expect(updated.spouse?.profession).toBe("רופאה");
  });
});

describe("Don't Ask Twice - Children Information", () => {
  let state: ConversationState;

  beforeEach(() => {
    state = createInitialState("test-session", "he");
  });

  it("should NOT ask children questions if hasChildren is false", () => {
    const updated = applyInterviewUpdates(state, [
      { path: "hasChildren", value: "false" },
    ]);

    expect(updated.hasChildren).toBe(false);
    expect(updated.children).toEqual([]);

    // Should not ask any children questions
    const questions = getInterviewQuestions(updated);
    const childrenQuestions = questions.filter((q) => q.key.startsWith("children"));
    expect(childrenQuestions.length).toBe(0);
  });

  it("should NOT ask children questions if hasEligibleChildren is false", () => {
    state.hasChildren = true;

    const updated = applyInterviewUpdates(state, [
      { path: "hasEligibleChildren", value: "false" },
    ]);

    expect(updated.hasEligibleChildren).toBe(false);
    expect(updated.children).toEqual([]);

    // Should not ask children detail questions
    const questions = getInterviewQuestions(updated);
    const childDetailQuestions = questions.filter((q) =>
      q.key.startsWith("children.") && q.key.includes(".")
    );
    expect(childDetailQuestions.length).toBe(0);
  });

  it("should NOT ask for child details again after they're provided", () => {
    state.hasChildren = true;
    state.hasEligibleChildren = true;

    const updated = applyInterviewUpdates(state, [
      { path: "children.0.name", value: "יעל כהן" },
      { path: "children.0.age", value: "30" },
      { path: "children.0.profession", value: "מהנדסת תוכנה" },
    ]);

    expect(updated.children[0]?.name).toBe("יעל כהן");
    expect(updated.children[0]?.age).toBe(30);
    expect(updated.children[0]?.profession).toBe("מהנדסת תוכנה");

    expect(isQuestionStillAsked(updated, "children.0.name")).toBe(false);
    expect(isQuestionStillAsked(updated, "children.0.profession")).toBe(false);
  });
});

describe("Don't Ask Twice - Multiple Fields in Single Message", () => {
  let state: ConversationState;

  beforeEach(() => {
    state = createInitialState("test-session", "he");
  });

  it("should handle comprehensive user message with all basic info", () => {
    // Simulating: "שמי דוד כהן, בן 45, עורך דין באינטל, למדתי בטכניון"
    const updates: InterviewUpdate[] = [
      { path: "profile.firstName", value: "דוד" },
      { path: "profile.lastName", value: "כהן" },
      { path: "profile.age", value: "45" },
      { path: "profile.profession", value: "עורך דין" },
      { path: "profile.workplace", value: "אינטל" },
      { path: "profile.educationHistory.0.institution", value: "הטכניון" },
    ];

    const updated = applyInterviewUpdates(state, updates);

    // All provided fields should NOT be asked again
    expect(isQuestionStillAsked(updated, "profile.firstName")).toBe(false);
    expect(isQuestionStillAsked(updated, "profile.lastName")).toBe(false);
    expect(isQuestionStillAsked(updated, "profile.age")).toBe(false);
    expect(isQuestionStillAsked(updated, "profile.profession")).toBe(false);
    expect(isQuestionStillAsked(updated, "profile.workplace")).toBe(false);
    expect(isQuestionStillAsked(updated, "profile.educationHistory.0.institution")).toBe(false);
  });

  it("should handle Rotary member introduction with club info", () => {
    // Simulating: "חבר רוטרי תל אביב מ-2015, מהנדס תוכנה"
    const updates: InterviewUpdate[] = [
      { path: "customClub", value: "רוטרי תל אביב" },
      { path: "joinYear", value: "2015" },
      { path: "profile.profession", value: "מהנדס תוכנה" },
    ];

    const updated = applyInterviewUpdates(state, updates);

    expect(isQuestionStillAsked(updated, "customClub")).toBe(false);
    expect(isQuestionStillAsked(updated, "joinYear")).toBe(false);
    expect(isQuestionStillAsked(updated, "profile.profession")).toBe(false);
  });

  it("should handle family status in single message", () => {
    // Simulating: "נשוי לשרה רופאה, יש לנו שני ילדים בוגרים"
    const updates: InterviewUpdate[] = [
      { path: "hasSpouse", value: "true" },
      { path: "spouse.firstName", value: "שרה" },
      { path: "spouse.profession", value: "רופאה" },
      { path: "hasChildren", value: "true" },
      { path: "hasEligibleChildren", value: "true" },
    ];

    const updated = applyInterviewUpdates(state, updates);

    expect(isQuestionStillAsked(updated, "hasSpouse")).toBe(false);
    expect(isQuestionStillAsked(updated, "spouse.firstName")).toBe(false);
    expect(isQuestionStillAsked(updated, "spouse.profession")).toBe(false);
    expect(isQuestionStillAsked(updated, "hasChildren")).toBe(false);
    expect(isQuestionStillAsked(updated, "hasEligibleChildren")).toBe(false);
  });
});

describe("Don't Ask Twice - Profile Summary Reflects All Data", () => {
  let state: ConversationState;

  beforeEach(() => {
    state = createInitialState("test-session", "he");
  });

  it("should include all provided data in profile summary", () => {
    state.profile = {
      firstName: "דוד",
      lastName: "כהן",
      age: 45,
      email: "david@example.com",
      profession: "עורך דין",
      workplace: "משרד כהן ושות׳",
    };
    state.customClub = "רוטרי תל אביב";
    state.joinYear = "2015";

    const summary = generateProfileSummary(state);

    expect(summary).toContain("דוד כהן");
    expect(summary).toContain("45");
    expect(summary).toContain("david@example.com");
    expect(summary).toContain("עורך דין");
    expect(summary).toContain("רוטרי תל אביב");
    expect(summary).toContain("2015");
  });

  it("should include military info in summary", () => {
    state.profile.military = {
      framework: "idf",
      unit: "חיל האוויר",
      dischargeRank: "סרן",
    };

    const summary = generateProfileSummary(state);

    expect(summary).toContain("צה״ל");
    expect(summary).toContain("חיל האוויר");
    expect(summary).toContain("סרן");
  });

  it("should include education in summary", () => {
    state.profile.hasHigherEducation = true;
    state.profile.educationHistory = [
      {
        degree: "תואר ראשון",
        institution: "אוניברסיטת תל אביב",
        graduationYear: "2005",
      },
    ];

    const summary = generateProfileSummary(state);

    expect(summary).toContain("תואר ראשון");
    expect(summary).toContain("אוניברסיטת תל אביב");
    expect(summary).toContain("2005");
  });

  it("should include spouse in summary", () => {
    state.hasSpouse = true;
    state.spouse = {
      firstName: "שרה",
      lastName: "כהן",
      age: 42,
      profession: "רופאה",
    };

    const summary = generateProfileSummary(state);

    expect(summary).toContain("שרה");
    expect(summary).toContain("רופאה");
  });

  it("should include children in summary", () => {
    state.hasEligibleChildren = true;
    state.children = [
      {
        name: "יעל כהן",
        age: 30,
        profession: "מהנדסת תוכנה",
      },
    ];

    const summary = generateProfileSummary(state);

    expect(summary).toContain("יעל כהן");
    expect(summary).toContain("30");
    expect(summary).toContain("מהנדסת תוכנה");
  });
});

describe("Don't Ask Twice - Corrections and Updates", () => {
  let state: ConversationState;

  beforeEach(() => {
    state = createInitialState("test-session", "he");
    state.profile = {
      firstName: "דוד",
      lastName: "כהן",
      profession: "עורך דין",
      workplace: "אינטל",
    };
  });

  it("should update existing data without asking again", () => {
    // User corrects workplace: "לא אינטל, אני עובד במיקרוסופט"
    const updated = applyInterviewUpdates(state, [
      { path: "profile.workplace", value: "מיקרוסופט" },
    ]);

    expect(updated.profile.workplace).toBe("מיקרוסופט");
    expect(isQuestionStillAsked(updated, "profile.workplace")).toBe(false);
  });

  it("should preserve existing data when adding new fields", () => {
    const updated = applyInterviewUpdates(state, [
      { path: "profile.city", value: "תל אביב" },
    ]);

    // Original data should be preserved
    expect(updated.profile.firstName).toBe("דוד");
    expect(updated.profile.lastName).toBe("כהן");
    expect(updated.profile.profession).toBe("עורך דין");
    expect(updated.profile.workplace).toBe("אינטל");

    // New data should be added
    expect(updated.profile.city).toBe("תל אביב");
  });
});

describe("Don't Ask Twice - Interests and Activities", () => {
  let state: ConversationState;

  beforeEach(() => {
    state = createInitialState("test-session", "he");
  });

  it("should NOT ask for hobbies after provided", () => {
    const updated = applyInterviewUpdates(state, [
      { path: "profile.hobbies", value: '["טניס", "קריאה", "נסיעות"]' },
    ]);

    expect(updated.profile.hobbies).toEqual(["טניס", "קריאה", "נסיעות"]);
    expect(isQuestionStillAsked(updated, "profile.hobbies")).toBe(false);
  });

  it("should NOT ask for expertise after provided", () => {
    const updated = applyInterviewUpdates(state, [
      { path: "profile.expertise", value: '["משפט מסחרי", "מיזוגים ורכישות"]' },
    ]);

    expect(updated.profile.expertise).toEqual(["משפט מסחרי", "מיזוגים ורכישות"]);
    expect(isQuestionStillAsked(updated, "profile.expertise")).toBe(false);
  });
});

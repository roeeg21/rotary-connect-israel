/**
 * Registration Interview Tests
 *
 * Tests for the AI registration interview logic including:
 * - Age calculation from various date formats
 * - Year normalization
 * - Path canonicalization
 * - Interview update application
 * - Profile summary generation
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  ageFromBirthDate,
  normalizeBirthDate,
  normalizeYear,
  canonicalizeInterviewPath,
  applyInterviewUpdates,
  getInterviewQuestions,
  generateProfileSummary,
  eligibleChildren,
  MIN_CHILD_AGE,
  type InterviewUpdate,
} from "./registration-interview";
import type { ConversationState } from "./conversation";
import { createInitialState } from "./conversation";

describe("ageFromBirthDate", () => {
  // Use a fixed date for consistent testing
  const today = new Date("2024-07-15T00:00:00Z");

  it("should calculate age from YYYY-MM-DD format", () => {
    expect(ageFromBirthDate("1990-07-15", today)).toBe(34);
    expect(ageFromBirthDate("1990-07-16", today)).toBe(33); // Birthday not yet
    expect(ageFromBirthDate("1990-07-14", today)).toBe(34); // Birthday passed
  });

  it("should calculate age from YYYY-MM format", () => {
    expect(ageFromBirthDate("1990-07", today)).toBe(34);
    expect(ageFromBirthDate("1990-08", today)).toBe(33); // Birthday month not yet
  });

  it("should calculate age from YYYY format", () => {
    // For year-only, assumes January 1st as birthday
    expect(ageFromBirthDate("1990", today)).toBe(34);
    expect(ageFromBirthDate("2024", today)).toBe(0);
  });

  it("should return undefined for invalid formats", () => {
    expect(ageFromBirthDate("invalid", today)).toBeUndefined();
    expect(ageFromBirthDate("90-01-01", today)).toBeUndefined();
    expect(ageFromBirthDate("1990-13-01", today)).toBeUndefined();
  });

  it("should return undefined for impossible ages", () => {
    expect(ageFromBirthDate("2030-01-01", today)).toBeUndefined(); // Future
    expect(ageFromBirthDate("1800-01-01", today)).toBeUndefined(); // Too old
  });
});

describe("normalizeBirthDate", () => {
  it("should pass through valid date formats", () => {
    expect(normalizeBirthDate("1990-07-15")).toBe("1990-07-15");
    expect(normalizeBirthDate("1990-07")).toBe("1990-07");
    expect(normalizeBirthDate("1990")).toBe("1990");
  });

  it("should extract year from text", () => {
    expect(normalizeBirthDate("born in 1990")).toBe("1990");
    expect(normalizeBirthDate("שנת 1985")).toBe("1985");
    expect(normalizeBirthDate("1990")).toBe("1990");
  });

  it("should return undefined for invalid input", () => {
    expect(normalizeBirthDate("no year here")).toBeUndefined();
    expect(normalizeBirthDate("")).toBeUndefined();
  });
});

describe("normalizeYear", () => {
  it("should pass through 4-digit years", () => {
    expect(normalizeYear("2015")).toBe("2015");
    expect(normalizeYear("1990")).toBe("1990");
  });

  it("should extract year from date formats", () => {
    expect(normalizeYear("2015-06-01")).toBe("2015");
    expect(normalizeYear("2015-06")).toBe("2015");
  });

  it("should extract year from text", () => {
    expect(normalizeYear("in 2015")).toBe("2015");
    expect(normalizeYear("joined 2015")).toBe("2015");
    expect(normalizeYear("שנת 2015")).toBe("2015");
  });

  it("should return undefined for invalid input", () => {
    expect(normalizeYear("no year")).toBeUndefined();
    expect(normalizeYear("")).toBeUndefined();
  });
});

describe("canonicalizeInterviewPath", () => {
  it("should map aliases to canonical paths", () => {
    expect(canonicalizeInterviewPath("profile.company")).toBe("profile.workplace");
    expect(canonicalizeInterviewPath("profile.employer")).toBe("profile.workplace");
    expect(canonicalizeInterviewPath("profile.role")).toBe("profile.jobTitle");
    expect(canonicalizeInterviewPath("profile.militaryRank")).toBe("profile.military.dischargeRank");
  });

  it("should pass through canonical paths unchanged", () => {
    expect(canonicalizeInterviewPath("profile.firstName")).toBe("profile.firstName");
    expect(canonicalizeInterviewPath("profile.workplace")).toBe("profile.workplace");
  });

  it("should handle empty strings", () => {
    expect(canonicalizeInterviewPath("")).toBe("");
    expect(canonicalizeInterviewPath("   ")).toBe("");
  });
});

describe("applyInterviewUpdates", () => {
  let state: ConversationState;
  const today = new Date("2024-07-15T00:00:00Z");

  beforeEach(() => {
    state = createInitialState("test-session", "he");
  });

  it("should apply simple profile updates", () => {
    const updates: InterviewUpdate[] = [
      { path: "profile.firstName", value: "דוד" },
      { path: "profile.lastName", value: "כהן" },
      { path: "profile.email", value: "david@example.com" },
    ];

    const result = applyInterviewUpdates(state, updates, today);

    expect(result.profile.firstName).toBe("דוד");
    expect(result.profile.lastName).toBe("כהן");
    expect(result.profile.email).toBe("david@example.com");
  });

  it("should parse age from various formats", () => {
    const updates: InterviewUpdate[] = [{ path: "profile.age", value: "45" }];
    const result = applyInterviewUpdates(state, updates, today);
    expect(result.profile.age).toBe(45);
  });

  it("should handle boolean fields", () => {
    const updates: InterviewUpdate[] = [
      { path: "hasSpouse", value: "true" },
      { path: "hasChildren", value: "false" },
    ];

    const result = applyInterviewUpdates(state, updates, today);

    expect(result.hasSpouse).toBe(true);
    expect(result.hasChildren).toBe(false);
  });

  it("should handle education history updates", () => {
    const updates: InterviewUpdate[] = [
      { path: "profile.educationHistory.0.degree", value: "תואר ראשון" },
      { path: "profile.educationHistory.0.institution", value: "אוניברסיטת תל אביב" },
      { path: "profile.educationHistory.0.graduationYear", value: "2010" },
    ];

    const result = applyInterviewUpdates(state, updates, today);

    expect(result.profile.educationHistory?.[0]?.degree).toBe("תואר ראשון");
    expect(result.profile.educationHistory?.[0]?.institution).toBe("אוניברסיטת תל אביב");
    expect(result.profile.educationHistory?.[0]?.graduationYear).toBe("2010");
  });

  it("should handle military service updates", () => {
    const updates: InterviewUpdate[] = [
      { path: "profile.military.framework", value: "idf" },
      { path: "profile.military.unit", value: "חיל האוויר" },
      { path: "profile.military.dischargeRank", value: "סרן" },
    ];

    const result = applyInterviewUpdates(state, updates, today);

    expect(result.profile.military?.framework).toBe("idf");
    expect(result.profile.military?.unit).toBe("חיל האוויר");
    expect(result.profile.military?.dischargeRank).toBe("סרן");
  });

  it("should handle rotary positions updates", () => {
    const updates: InterviewUpdate[] = [
      { path: "rotaryPositions.0.title", value: "נשיא מועדון" },
      { path: "rotaryPositions.0.level", value: "club" },
      { path: "rotaryPositions.0.fromYear", value: "2020" },
    ];

    const result = applyInterviewUpdates(state, updates, today);

    expect(result.rotaryPositions?.[0]?.title).toBe("נשיא מועדון");
    expect(result.rotaryPositions?.[0]?.level).toBe("club");
    expect(result.rotaryPositions?.[0]?.fromYear).toBe("2020");
  });

  it("should handle malformed path:value concatenated updates from Gemini", () => {
    // Gemini sometimes generates malformed updates like this:
    // { path: "field1:val1", value: "field2:val2" }
    const updates: InterviewUpdate[] = [
      {
        path: "rotaryPositions.0.level:club",
        value: "rotaryPositions.0.title:נשיא המועדון",
      },
      {
        path: "rotaryPositions.0.fromYear:2020",
        value: "rotaryPositions.0.toYear:2021",
      },
    ];

    const result = applyInterviewUpdates(state, updates, today);

    // Should correctly parse and apply all four updates
    expect(result.rotaryPositions?.[0]?.level).toBe("club");
    expect(result.rotaryPositions?.[0]?.title).toBe("נשיא המועדון");
    expect(result.rotaryPositions?.[0]?.fromYear).toBe("2020");
    expect(result.rotaryPositions?.[0]?.toYear).toBe("2021");
  });

  it("should handle JSON-like malformed updates with embedded quotes", () => {
    // Gemini sometimes generates malformed updates with JSON-like syntax:
    // { path: 'field1": "val1', value: 'field2": "val2' }
    const updates: InterviewUpdate[] = [
      {
        path: 'profile.educationHistory.0.completedDuringMilitaryService": "false',
        value: 'rotaryJoinDate": "2015-01',
      },
    ];

    const result = applyInterviewUpdates(state, updates, today);

    // Should correctly parse and apply both updates
    expect(result.profile.educationHistory?.[0]?.completedDuringMilitaryService).toBe(false);
    expect(result.rotaryJoinDate).toBe("2015-01");
  });

  it("should reject prototype pollution attempts", () => {
    const updates: InterviewUpdate[] = [
      { path: "__proto__.isAdmin", value: "true" },
      { path: "constructor.prototype.isAdmin", value: "true" },
      { path: "profile.__proto__.isAdmin", value: "true" },
    ];

    const result = applyInterviewUpdates(state, updates, today);

    // Should not affect prototype
    expect((result as Record<string, unknown>).isAdmin).toBeUndefined();
    expect((state as Record<string, unknown>).isAdmin).toBeUndefined();
  });

  it("should calculate age from dateOfBirth", () => {
    const updates: InterviewUpdate[] = [{ path: "profile.dateOfBirth", value: "1980-01-01" }];

    const result = applyInterviewUpdates(state, updates, today);

    expect(result.profile.dateOfBirth).toBe("1980-01-01");
    expect(result.profile.age).toBe(44);
  });

  it("should delete spouse when hasSpouse is false", () => {
    state.hasSpouse = true;
    state.spouse = { firstName: "Test" };

    const updates: InterviewUpdate[] = [{ path: "hasSpouse", value: "false" }];
    const result = applyInterviewUpdates(state, updates, today);

    expect(result.hasSpouse).toBe(false);
    expect(result.spouse).toBeUndefined();
  });

  it("should normalize year fields", () => {
    const updates: InterviewUpdate[] = [
      { path: "joinYear", value: "in 2015" },
    ];

    const result = applyInterviewUpdates(state, updates, today);

    expect(result.joinYear).toBe("2015");
  });
});

describe("eligibleChildren", () => {
  const today = new Date("2024-07-15T00:00:00Z");

  it("should filter children by minimum age", () => {
    const state = createInitialState("test", "he");
    state.children = [
      { name: "Child 1", age: 30 },
      { name: "Child 2", age: 25 },
      { name: "Child 3", age: 28 },
      { name: "Child 4", age: 35 },
    ];

    const result = eligibleChildren(state, today);

    expect(result).toHaveLength(3);
    expect(result.map((c) => c.name)).toEqual(["Child 1", "Child 3", "Child 4"]);
  });

  it("should calculate age from dateOfBirth", () => {
    const state = createInitialState("test", "he");
    state.children = [
      { name: "Child 1", dateOfBirth: "1990-01-01" }, // 34 years old
      { name: "Child 2", dateOfBirth: "2000-01-01" }, // 24 years old
    ];

    const result = eligibleChildren(state, today);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Child 1");
  });
});

describe("getInterviewQuestions", () => {
  let state: ConversationState;

  beforeEach(() => {
    state = createInitialState("test", "he");
  });

  it("should return required questions first", () => {
    const questions = getInterviewQuestions(state);

    const required = questions.filter((q) => q.required);
    expect(required.length).toBeGreaterThan(0);
    expect(required.some((q) => q.key === "profile.firstName")).toBe(true);
    expect(required.some((q) => q.key === "profile.lastName")).toBe(true);
  });

  it("should not return questions for known fields", () => {
    state.profile.firstName = "דוד";
    state.profile.lastName = "כהן";
    state.profile.email = "david@example.com";

    const questions = getInterviewQuestions(state);

    expect(questions.find((q) => q.key === "profile.firstName")).toBeUndefined();
    expect(questions.find((q) => q.key === "profile.lastName")).toBeUndefined();
    expect(questions.find((q) => q.key === "profile.email")).toBeUndefined();
  });

  it("should include spouse questions when hasSpouse is true", () => {
    state.hasSpouse = true;

    const questions = getInterviewQuestions(state);

    expect(questions.some((q) => q.key.startsWith("spouse."))).toBe(true);
  });

  it("should not include spouse questions when hasSpouse is false", () => {
    state.hasSpouse = false;

    const questions = getInterviewQuestions(state);

    expect(questions.some((q) => q.key.startsWith("spouse."))).toBe(false);
  });

  it("should include children questions when hasEligibleChildren is true", () => {
    state.hasChildren = true;
    state.hasEligibleChildren = true;

    const questions = getInterviewQuestions(state);

    expect(questions.some((q) => q.key.startsWith("children"))).toBe(true);
  });

  it("should respect skipped fields", () => {
    state.skippedFields = ["profile.phone", "profile.city"];

    const questions = getInterviewQuestions(state);

    expect(questions.find((q) => q.key === "profile.phone")).toBeUndefined();
    expect(questions.find((q) => q.key === "profile.city")).toBeUndefined();
  });
});

describe("generateProfileSummary", () => {
  let state: ConversationState;

  beforeEach(() => {
    state = createInitialState("test", "he");
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
  });

  it("should include basic profile information", () => {
    const summary = generateProfileSummary(state);

    expect(summary).toContain("דוד כהן");
    expect(summary).toContain("45");
    expect(summary).toContain("david@example.com");
  });

  it("should include Rotary information", () => {
    const summary = generateProfileSummary(state);

    expect(summary).toContain("רוטרי תל אביב");
    expect(summary).toContain("2015");
  });

  it("should include spouse information when present", () => {
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

  it("should include eligible children when present", () => {
    state.hasEligibleChildren = true;
    state.children = [
      { name: "יעל כהן", age: 30, profession: "מהנדסת תוכנה" },
    ];

    const summary = generateProfileSummary(state);

    expect(summary).toContain("יעל כהן");
    expect(summary).toContain("30");
    expect(summary).toContain("מהנדסת תוכנה");
  });

  it("should generate English summary when language is en", () => {
    state.language = "en";

    const summary = generateProfileSummary(state);

    expect(summary).toContain("Your profile summary");
  });
});

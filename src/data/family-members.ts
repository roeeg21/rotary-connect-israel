import type { Bi } from "./members";

export type Relationship = "spouse" | "child" | "parent" | "sibling" | "other";

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

export const familyMembers: FamilyMember[] = [];

// Helper function to get family members for a primary member
export function getFamilyMembers(primaryMemberId: string): FamilyMember[] {
  return familyMembers.filter(
    (f) => f.primaryMemberId === primaryMemberId && f.searchable
  );
}

// Helper function to get all searchable family members
export function getSearchableFamilyMembers(): FamilyMember[] {
  return familyMembers.filter((f) => f.searchable);
}

// Get a family member by ID
export function familyMemberById(id: string): FamilyMember | undefined {
  return familyMembers.find((f) => f.id === id);
}

// Get relationship label
export function getRelationshipLabel(
  relationship: Relationship,
  lang: "he" | "en"
): string {
  const labels: Record<Relationship, { he: string; en: string }> = {
    spouse: { he: "בן/בת זוג", en: "Spouse" },
    child: { he: "בן/בת", en: "Child" },
    parent: { he: "הורה", en: "Parent" },
    sibling: { he: "אח/אחות", en: "Sibling" },
    other: { he: "בן משפחה", en: "Family Member" },
  };
  return labels[relationship][lang];
}

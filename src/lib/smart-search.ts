import Fuse from "fuse.js";
import { members, type Member, type Bi } from "@/data/members";
import {
  familyMembers,
  type FamilyMember,
  getRelationshipLabel,
} from "@/data/family-members";

// Types for search results
export type SearchResultType = "member" | "family";

export interface SearchResult {
  id: string;
  type: SearchResultType;
  // Primary info
  name: Bi;
  profession?: Bi;
  jobTitle?: Bi;
  workplace?: string;
  location?: Bi;
  industry?: Bi;
  // Relationship info (for family members)
  relationship?: string;
  primaryMemberId?: string;
  primaryMemberName?: Bi;
  // Score and reasons
  score: number;
  reasons: string[];
  // Original data
  member?: Member;
  familyMember?: FamilyMember;
}

// Profession synonyms for better matching
const PROFESSION_SYNONYMS: Record<string, string[]> = {
  lawyer: ["attorney", "advocate", "legal counsel", "solicitor", "barrister", "עורך דין", "עורכת דין", "פרקליט"],
  doctor: ["physician", "medical doctor", "md", "surgeon", "רופא", "רופאה", "דוקטור"],
  chef: ["cook", "culinary", "kitchen", "שף", "שפית", "טבח", "טבחית"],
  engineer: ["developer", "programmer", "coder", "מהנדס", "מהנדסת", "מפתח", "מפתחת"],
  teacher: ["educator", "instructor", "professor", "lecturer", "מורה", "מחנך", "מחנכת", "מרצה"],
  accountant: ["cpa", "bookkeeper", "auditor", "רואה חשבון", "רואת חשבון", "חשבונאי"],
  architect: ["designer", "planner", "אדריכל", "אדריכלית", "מתכנן"],
  nurse: ["rn", "registered nurse", "אחות", "אח", "אחות מוסמכת"],
  dentist: ["orthodontist", "dental", "רופא שיניים", "רופאת שיניים"],
  pilot: ["aviator", "captain", "first officer", "טייס", "טייסת"],
  psychologist: ["therapist", "counselor", "פסיכולוג", "פסיכולוגית", "מטפל"],
  journalist: ["reporter", "editor", "writer", "עיתונאי", "עיתונאית", "כתב", "כתבת"],
  entrepreneur: ["founder", "startup", "יזם", "יזמית", "מייסד"],
  software: ["developer", "programmer", "coder", "תוכנה", "מפתח", "מתכנת"],
};

// Expand query with synonyms
function expandQueryWithSynonyms(query: string): string[] {
  const terms = query.toLowerCase().split(/\s+/);
  const expanded = new Set<string>(terms);

  for (const term of terms) {
    for (const [profession, synonyms] of Object.entries(PROFESSION_SYNONYMS)) {
      if (
        term === profession ||
        synonyms.some((s) => s.toLowerCase().includes(term) || term.includes(s.toLowerCase()))
      ) {
        expanded.add(profession);
        synonyms.forEach((s) => expanded.add(s.toLowerCase()));
      }
    }
  }

  return [...expanded];
}

// Parse natural language query to extract filters
export interface ParsedQuery {
  searchTerms: string[];
  filters: {
    relationship?: "spouse" | "child" | "member" | "family";
    location?: string;
    workplace?: string;
    profession?: string;
  };
}

// Simple AI-like query parser (deterministic, no external API needed)
export function parseNaturalLanguageQuery(query: string): ParsedQuery {
  const lowerQuery = query.toLowerCase();
  const filters: ParsedQuery["filters"] = {};
  let searchTerms: string[] = [];

  // Detect relationship filters
  const spousePatterns = [
    /\b(spouse|wife|husband|partner|בן זוג|בת זוג|אשת|בעל)\b/i,
    /\b(whose (?:spouse|wife|husband|partner)s? (?:is|are))\b/i,
    /\b(spouses who)\b/i,
  ];
  const childPatterns = [
    /\b(child|children|son|daughter|kid|ילד|ילדה|בן|בת)\b/i,
    /\b(whose (?:child|children|son|daughter)s? (?:is|are))\b/i,
    /\b(children who)\b/i,
  ];
  const familyPatterns = [/\b(family|family member|משפחה|בן משפחה)\b/i];
  const memberPatterns = [/\b(member|rotary member|חבר רוטרי)\b/i];

  if (spousePatterns.some((p) => p.test(lowerQuery))) {
    filters.relationship = "spouse";
  } else if (childPatterns.some((p) => p.test(lowerQuery))) {
    filters.relationship = "child";
  } else if (familyPatterns.some((p) => p.test(lowerQuery))) {
    filters.relationship = "family";
  } else if (memberPatterns.some((p) => p.test(lowerQuery))) {
    filters.relationship = "member";
  }

  // Detect location filters
  const locationMatch = lowerQuery.match(
    /\b(?:in|at|from|ב)\s*(tel aviv|haifa|jerusalem|herzliya|ramat gan|netanya|תל אביב|חיפה|ירושלים|הרצליה|רמת גן|נתניה)\b/i
  );
  if (locationMatch) {
    filters.location = locationMatch[1];
  }

  // Detect workplace filters
  const workplaceMatch = lowerQuery.match(
    /\b(?:at|working at|works at|employed at|עובד ב|עובדת ב)\s*([a-zA-Zא-ת\s&.]+?)(?:\s*$|\s+(?:in|who|that))/i
  );
  if (workplaceMatch) {
    filters.workplace = workplaceMatch[1].trim();
  }

  // Remove filter words from search terms
  let cleanedQuery = lowerQuery
    .replace(/\b(show me|find|search for|looking for|מצא|חפש|הראה לי)\b/gi, "")
    .replace(/\b(members whose|people whose|family members who)\b/gi, "")
    .replace(/\b(spouses who are|children who are|spouse is|child is)\b/gi, "")
    .replace(/\b(working at|works at|employed at)\b/gi, "")
    .replace(/\b(in|at|from|ב)\s*(tel aviv|haifa|jerusalem|herzliya|ramat gan|netanya|תל אביב|חיפה|ירושלים|הרצליה|רמת גן|נתניה)\b/gi, "")
    .trim();

  // Extract search terms
  searchTerms = cleanedQuery
    .split(/\s+/)
    .filter((t) => t.length > 1)
    .filter(
      (t) =>
        !["the", "a", "an", "is", "are", "who", "whose", "that", "of", "את", "של", "עם", "מי", "שהוא", "שהיא"].includes(t)
    );

  // Expand with synonyms
  searchTerms = [...new Set([...searchTerms, ...expandQueryWithSynonyms(searchTerms.join(" "))])];

  return { searchTerms, filters };
}

// Create unified search index
interface SearchDocument {
  id: string;
  type: SearchResultType;
  name: string;
  nameHe: string;
  profession?: string;
  professionHe?: string;
  jobTitle?: string;
  jobTitleHe?: string;
  workplace?: string;
  industry?: string;
  industryHe?: string;
  location?: string;
  locationHe?: string;
  bio?: string;
  bioHe?: string;
  relationship?: string;
  primaryMemberId?: string;
  // Original data references
  _member?: Member;
  _familyMember?: FamilyMember;
}

function buildSearchDocuments(): SearchDocument[] {
  const docs: SearchDocument[] = [];

  // Add all primary members
  for (const m of members) {
    docs.push({
      id: m.id,
      type: "member",
      name: m.name.en,
      nameHe: m.name.he,
      profession: m.profession.en,
      professionHe: m.profession.he,
      jobTitle: m.position.en,
      jobTitleHe: m.position.he,
      workplace: m.company,
      industry: m.industry.en,
      industryHe: m.industry.he,
      location: m.city.en,
      locationHe: m.city.he,
      bio: m.about.en,
      bioHe: m.about.he,
      _member: m,
    });
  }

  // Add all searchable family members
  for (const f of familyMembers) {
    if (!f.searchable) continue;

    const primaryMember = members.find((m) => m.id === f.primaryMemberId);

    docs.push({
      id: f.id,
      type: "family",
      name: f.firstName.en + " " + f.lastName.en,
      nameHe: f.firstName.he + " " + f.lastName.he,
      profession: f.profession?.en,
      professionHe: f.profession?.he,
      jobTitle: f.jobTitle?.en,
      jobTitleHe: f.jobTitle?.he,
      workplace: f.workplace,
      industry: f.industry?.en,
      industryHe: f.industry?.he,
      location: f.location?.en,
      locationHe: f.location?.he,
      bio: f.bio?.en,
      bioHe: f.bio?.he,
      relationship: f.relationship,
      primaryMemberId: f.primaryMemberId,
      _familyMember: f,
    });
  }

  return docs;
}

// Fuse.js instance for fuzzy search
let fuseInstance: Fuse<SearchDocument> | null = null;
let searchDocuments: SearchDocument[] = [];

function getFuseInstance(): Fuse<SearchDocument> {
  if (!fuseInstance) {
    searchDocuments = buildSearchDocuments();
    fuseInstance = new Fuse(searchDocuments, {
      keys: [
        { name: "name", weight: 0.3 },
        { name: "nameHe", weight: 0.3 },
        { name: "profession", weight: 0.25 },
        { name: "professionHe", weight: 0.25 },
        { name: "jobTitle", weight: 0.2 },
        { name: "jobTitleHe", weight: 0.2 },
        { name: "workplace", weight: 0.2 },
        { name: "industry", weight: 0.15 },
        { name: "industryHe", weight: 0.15 },
        { name: "location", weight: 0.1 },
        { name: "locationHe", weight: 0.1 },
        { name: "bio", weight: 0.05 },
        { name: "bioHe", weight: 0.05 },
      ],
      threshold: 0.6, // Fuzzy match threshold (lower = stricter, 0.6 is lenient)
      distance: 200,
      minMatchCharLength: 2,
      includeScore: true,
      ignoreLocation: true,
      useExtendedSearch: false, // Disabled for simpler matching
      isCaseSensitive: false,
      findAllMatches: true,
    });
  }
  return fuseInstance;
}

// Typo correction using Levenshtein distance
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// Find closest profession match with typo tolerance
function findClosestProfession(term: string): string | null {
  const allProfessions = Object.keys(PROFESSION_SYNONYMS).concat(
    Object.values(PROFESSION_SYNONYMS).flat()
  );

  let closest: string | null = null;
  let minDistance = Infinity;

  for (const profession of allProfessions) {
    const distance = levenshteinDistance(term.toLowerCase(), profession.toLowerCase());
    if (distance < minDistance && distance <= 2) {
      // Allow up to 2 character differences
      minDistance = distance;
      closest = profession;
    }
  }

  return closest;
}

// Suggest spelling corrections
export function suggestSpellingCorrection(term: string): string | null {
  const closest = findClosestProfession(term);
  if (closest && closest.toLowerCase() !== term.toLowerCase()) {
    return closest;
  }
  return null;
}

// Main smart search function
export function smartSearch(
  query: string,
  options: {
    limit?: number;
    relationshipFilter?: "member" | "spouse" | "child" | "family" | "all";
    locationFilter?: string;
  } = {}
): SearchResult[] {
  const { limit = 50, relationshipFilter = "all", locationFilter } = options;

  if (!query.trim()) {
    // Return all results if no query
    const docs = searchDocuments.length > 0 ? searchDocuments : buildSearchDocuments();
    return docs
      .filter((doc) => {
        if (relationshipFilter === "member") return doc.type === "member";
        if (relationshipFilter === "family") return doc.type === "family";
        if (relationshipFilter === "spouse")
          return doc.type === "family" && doc.relationship === "spouse";
        if (relationshipFilter === "child")
          return doc.type === "family" && doc.relationship === "child";
        return true;
      })
      .filter((doc) => {
        if (locationFilter) {
          const loc = (doc.location || doc.locationHe || "").toLowerCase();
          return loc.includes(locationFilter.toLowerCase());
        }
        return true;
      })
      .slice(0, limit)
      .map((doc) => documentToSearchResult(doc, 0, []));
  }

  // Parse the natural language query
  const parsed = parseNaturalLanguageQuery(query);

  // Get Fuse instance
  const fuse = getFuseInstance();

  // Build search queries with expanded terms
  const expandedTerms = expandQueryWithSynonyms(query);
  const searchQuery = expandedTerms.join(" ");

  // Perform fuzzy search
  const fuseResults = fuse.search(searchQuery);

  // Convert to SearchResult and apply filters
  const results: SearchResult[] = [];

  for (const result of fuseResults) {
    const doc = result.item;
    const score = 1 - (result.score || 0); // Convert Fuse score (lower = better) to our score (higher = better)

    // Apply relationship filter
    const effectiveRelFilter = relationshipFilter !== "all" ? relationshipFilter : parsed.filters.relationship;
    if (effectiveRelFilter) {
      if (effectiveRelFilter === "member" && doc.type !== "member") continue;
      if (effectiveRelFilter === "family" && doc.type !== "family") continue;
      if (effectiveRelFilter === "spouse" && !(doc.type === "family" && doc.relationship === "spouse")) continue;
      if (effectiveRelFilter === "child" && !(doc.type === "family" && doc.relationship === "child")) continue;
    }

    // Apply location filter
    const effectiveLocFilter = locationFilter || parsed.filters.location;
    if (effectiveLocFilter) {
      const loc = (doc.location || doc.locationHe || "").toLowerCase();
      if (!loc.includes(effectiveLocFilter.toLowerCase())) continue;
    }

    // Apply workplace filter
    if (parsed.filters.workplace) {
      const workplace = (doc.workplace || "").toLowerCase();
      if (!workplace.includes(parsed.filters.workplace.toLowerCase())) continue;
    }

    // Determine match reasons
    const reasons: string[] = [];
    const queryLower = query.toLowerCase();

    if (doc.profession?.toLowerCase().includes(queryLower) || doc.professionHe?.includes(query)) {
      reasons.push(doc.profession || doc.professionHe || "");
    }
    if (doc.workplace?.toLowerCase().includes(queryLower)) {
      reasons.push(doc.workplace);
    }
    if (doc.name.toLowerCase().includes(queryLower) || doc.nameHe.includes(query)) {
      reasons.push(doc.name);
    }
    if (doc.industry?.toLowerCase().includes(queryLower) || doc.industryHe?.includes(query)) {
      reasons.push(doc.industry || doc.industryHe || "");
    }

    results.push(documentToSearchResult(doc, score, reasons.slice(0, 3)));
  }

  return results.slice(0, limit);
}

// Convert SearchDocument to SearchResult
function documentToSearchResult(
  doc: SearchDocument,
  score: number,
  reasons: string[]
): SearchResult {
  if (doc.type === "member" && doc._member) {
    const m = doc._member;
    return {
      id: m.id,
      type: "member",
      name: m.name,
      profession: m.profession,
      jobTitle: m.position,
      workplace: m.company,
      location: m.city,
      industry: m.industry,
      score,
      reasons,
      member: m,
    };
  } else if (doc.type === "family" && doc._familyMember) {
    const f = doc._familyMember;
    const primaryMember = members.find((m) => m.id === f.primaryMemberId);
    return {
      id: f.id,
      type: "family",
      name: { he: `${f.firstName.he} ${f.lastName.he}`, en: `${f.firstName.en} ${f.lastName.en}` },
      profession: f.profession,
      jobTitle: f.jobTitle,
      workplace: f.workplace,
      location: f.location,
      industry: f.industry,
      relationship: f.relationship,
      primaryMemberId: f.primaryMemberId,
      primaryMemberName: primaryMember?.name,
      score,
      reasons,
      familyMember: f,
    };
  }

  // Fallback
  return {
    id: doc.id,
    type: doc.type,
    name: { he: doc.nameHe, en: doc.name },
    profession: doc.profession ? { he: doc.professionHe || "", en: doc.profession } : undefined,
    score,
    reasons,
  };
}

// Get unique values for faceted filtering
export function getSmartSearchFacets() {
  const docs = searchDocuments.length > 0 ? searchDocuments : buildSearchDocuments();

  const professions = new Set<string>();
  const industries = new Set<string>();
  const locations = new Set<string>();
  const workplaces = new Set<string>();

  for (const doc of docs) {
    if (doc.profession) professions.add(doc.profession);
    if (doc.industry) industries.add(doc.industry);
    if (doc.location) locations.add(doc.location);
    if (doc.workplace) workplaces.add(doc.workplace);
  }

  return {
    professions: [...professions].sort(),
    industries: [...industries].sort(),
    locations: [...locations].sort(),
    workplaces: [...workplaces].sort(),
  };
}

// Statistics
export function getSearchStats() {
  const docs = searchDocuments.length > 0 ? searchDocuments : buildSearchDocuments();
  return {
    totalMembers: docs.filter((d) => d.type === "member").length,
    totalFamilyMembers: docs.filter((d) => d.type === "family").length,
    totalSearchable: docs.length,
  };
}

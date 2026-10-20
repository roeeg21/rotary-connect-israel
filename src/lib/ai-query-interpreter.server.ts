/**
 * AI Query Interpreter Service
 * Uses Gemini to understand natural language search queries
 * and convert them to structured search intents
 */

import { z } from "zod/v4";
import { interpretSearchQuery, isGeminiConfigured } from "./gemini-client.server";

// Search intent types
export const SearchIntentSchema = z.object({
  // What the user is looking for
  searchType: z.enum([
    "person", // Looking for a specific person by name
    "profession", // Looking for professionals in a field
    "company", // Looking for people at a company
    "expertise", // Looking for specific expertise/skill
    "location", // Looking for people in a city/area
    "general", // General exploratory search
    "relationship", // Looking for family members
  ]),

  // Extracted entities
  entities: z.object({
    names: z.array(z.string()).default([]),
    professions: z.array(z.string()).default([]),
    companies: z.array(z.string()).default([]),
    locations: z.array(z.string()).default([]),
    industries: z.array(z.string()).default([]),
    skills: z.array(z.string()).default([]),
  }),

  // Relationship filter if applicable
  relationshipFilter: z.enum(["member", "spouse", "child", "family", "all"]).default("all"),

  // Original query terms for fallback search
  searchTerms: z.array(z.string()).default([]),

  // Confidence level (0-1)
  confidence: z.number().min(0).max(1).default(0.5),

  // Hebrew and English normalized search terms
  normalizedQuery: z.object({
    he: z.string().default(""),
    en: z.string().default(""),
  }),

  // Suggested spelling corrections
  corrections: z.array(z.object({
    original: z.string(),
    suggested: z.string(),
  })).default([]),
});

export type SearchIntent = z.infer<typeof SearchIntentSchema>;

// System prompt for query interpretation
const QUERY_INTERPRETATION_PROMPT = `אתה מנתח שאילתות חיפוש עבור רשת קשרים מקצועית של רוטרי ישראל.
המשתמשים מחפשים חברי רוטרי ובני משפחותיהם לפי מקצוע, חברה, מיקום ומומחיות.

המטרה שלך היא לנתח שאילתות בעברית ואנגלית ולחלץ מידע מובנה.

כללים חשובים:
1. זהה את סוג החיפוש (אדם ספציפי, מקצוע, חברה, מומחיות, מיקום, קשר משפחתי)
2. חלץ ישויות: שמות, מקצועות, חברות, ערים, תחומים, מיומנויות
3. זהה אם המשתמש מחפש בן/בת זוג או ילדים של חברים
4. תקן שגיאות כתיב נפוצות במקצועות ישראליים
5. נרמל את השאילתה לעברית ואנגלית

דוגמאות:
- "עורך דין בתל אביב" → profession search, professions: ["עורך דין", "lawyer"], locations: ["תל אביב", "Tel Aviv"]
- "מי עובד בגוגל" → company search, companies: ["Google", "גוגל"]
- "רופא שיניים בחיפה" → profession search, professions: ["רופא שיניים", "dentist"], locations: ["חיפה", "Haifa"]
- "בני זוג שהם רואי חשבון" → relationship search, relationshipFilter: "spouse", professions: ["רואה חשבון", "accountant"]
- "ילדים שעובדים בהייטק" → relationship search, relationshipFilter: "child", industries: ["הייטק", "High-Tech"]
- "דני כהן" → person search, names: ["דני כהן", "Danny Cohen"]
- "מישהו שמבין בבינה מלאכותית" → expertise search, skills: ["בינה מלאכותית", "AI", "artificial intelligence"]

החזר תוצאה מובנית בלבד.`;

/**
 * Interpret a search query using Claude AI
 */
export async function interpretQuery(query: string): Promise<SearchIntent> {
  // Check if Gemini is configured
  if (!isGeminiConfigured()) {
    // Return a basic parsed intent without AI
    return parseQueryBasic(query);
  }

  try {
    const intent = await interpretSearchQuery(
      query,
      SearchIntentSchema,
      QUERY_INTERPRETATION_PROMPT
    );

    return intent;
  } catch (error) {
    console.error("AI query interpretation failed, falling back to basic parsing:", error);
    return parseQueryBasic(query);
  }
}

/**
 * Basic query parsing without AI (fallback)
 */
function parseQueryBasic(query: string): SearchIntent {
  const lowerQuery = query.toLowerCase();
  const hebrewQuery = query;

  // Detect relationship keywords
  let relationshipFilter: SearchIntent["relationshipFilter"] = "all";
  if (/\b(spouse|wife|husband|בן זוג|בת זוג|אשת|בעל)\b/i.test(query)) {
    relationshipFilter = "spouse";
  } else if (/\b(child|children|son|daughter|ילד|ילדה|בן|בת)\b/i.test(query)) {
    relationshipFilter = "child";
  } else if (/\b(family|משפחה)\b/i.test(query)) {
    relationshipFilter = "family";
  } else if (/\b(member|חבר רוטרי)\b/i.test(query)) {
    relationshipFilter = "member";
  }

  // Extract locations
  const israeliCities = [
    { he: "תל אביב", en: "Tel Aviv" },
    { he: "ירושלים", en: "Jerusalem" },
    { he: "חיפה", en: "Haifa" },
    { he: "הרצליה", en: "Herzliya" },
    { he: "רמת גן", en: "Ramat Gan" },
    { he: "נתניה", en: "Netanya" },
    { he: "באר שבע", en: "Beer Sheva" },
    { he: "אשדוד", en: "Ashdod" },
    { he: "פתח תקווה", en: "Petah Tikva" },
    { he: "ראשון לציון", en: "Rishon LeZion" },
    { he: "כפר סבא", en: "Kfar Saba" },
    { he: "רעננה", en: "Raanana" },
    { he: "מודיעין", en: "Modiin" },
    { he: "רחובות", en: "Rehovot" },
  ];

  const locations: string[] = [];
  for (const city of israeliCities) {
    if (lowerQuery.includes(city.he) || lowerQuery.includes(city.en.toLowerCase())) {
      locations.push(city.he, city.en);
      break;
    }
  }

  // Extract common professions
  const professionMap = [
    { terms: ["עורך דין", "עורכת דין", "lawyer", "attorney"], normalized: ["עורך דין", "Lawyer"] },
    { terms: ["רופא", "רופאה", "doctor", "physician"], normalized: ["רופא", "Physician"] },
    { terms: ["רופא שיניים", "רופאת שיניים", "dentist"], normalized: ["רופא שיניים", "Dentist"] },
    { terms: ["מהנדס", "מהנדסת", "engineer"], normalized: ["מהנדס", "Engineer"] },
    { terms: ["רואה חשבון", "רואת חשבון", "accountant", "cpa"], normalized: ["רואה חשבון", "CPA"] },
    { terms: ["אדריכל", "אדריכלית", "architect"], normalized: ["אדריכל", "Architect"] },
    { terms: ["שף", "שפית", "chef", "cook"], normalized: ["שף", "Chef"] },
    { terms: ["פסיכולוג", "פסיכולוגית", "psychologist"], normalized: ["פסיכולוג", "Psychologist"] },
    { terms: ["יזם", "יזמית", "entrepreneur"], normalized: ["יזם", "Entrepreneur"] },
    { terms: ["מתכנת", "מפתח", "developer", "programmer"], normalized: ["מפתח תוכנה", "Software Developer"] },
  ];

  const professions: string[] = [];
  for (const prof of professionMap) {
    if (prof.terms.some(t => lowerQuery.includes(t.toLowerCase()))) {
      professions.push(...prof.normalized);
      break;
    }
  }

  // Extract company names (common Israeli companies)
  const companyPatterns = [
    /\b(google|גוגל)\b/i,
    /\b(wix|וויקס)\b/i,
    /\b(microsoft|מיקרוסופט)\b/i,
    /\b(intel|אינטל)\b/i,
    /\b(teva|טבע)\b/i,
    /\b(bank leumi|לאומי)\b/i,
    /\b(bank hapoalim|הפועלים)\b/i,
    /\b(netflix|נטפליקס)\b/i,
    /\b(hp|היולט פקרד)\b/i,
  ];

  const companies: string[] = [];
  for (const pattern of companyPatterns) {
    const match = query.match(pattern);
    if (match?.[1]) {
      companies.push(match[1]);
      break;
    }
  }

  // Determine search type
  let searchType: SearchIntent["searchType"] = "general";
  if (relationshipFilter !== "all") {
    searchType = "relationship";
  } else if (companies.length > 0) {
    searchType = "company";
  } else if (professions.length > 0) {
    searchType = "profession";
  } else if (locations.length > 0) {
    searchType = "location";
  } else if (/^[א-ת\s]+$/.test(query.trim()) && query.trim().split(/\s+/).length <= 3) {
    // Looks like a Hebrew name
    searchType = "person";
  }

  // Extract search terms (words after removing stop words)
  const stopWords = new Set([
    "who", "works", "at", "in", "the", "a", "an", "find", "someone", "is", "for", "me",
    "מי", "עובד", "עובדת", "ב", "את", "של", "מחפש", "מחפשת", "יש", "עם", "צריך", "שהוא", "שהיא",
  ]);

  const searchTerms = query
    .split(/[\s,.:;?!־-]+/)
    .filter(t => t.length > 1 && !stopWords.has(t.toLowerCase()));

  return {
    searchType,
    entities: {
      names: searchType === "person" ? [query.trim()] : [],
      professions,
      companies,
      locations,
      industries: [],
      skills: [],
    },
    relationshipFilter,
    searchTerms,
    confidence: 0.5,
    normalizedQuery: {
      he: hebrewQuery,
      en: query,
    },
    corrections: [],
  };
}

/**
 * Convert SearchIntent to smart-search compatible options
 */
export function intentToSearchOptions(intent: SearchIntent) {
  return {
    relationshipFilter: intent.relationshipFilter,
    locationFilter: intent.entities.locations[0] || undefined,
    searchTerms: [
      ...intent.entities.names,
      ...intent.entities.professions,
      ...intent.entities.companies,
      ...intent.entities.skills,
      ...intent.searchTerms,
    ].filter(Boolean),
  };
}

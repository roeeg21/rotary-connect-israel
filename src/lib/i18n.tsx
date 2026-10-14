import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Lang = "he" | "en";

type Dict = Record<string, { he: string; en: string }>;

const dict: Dict = {
  appName: { he: "רוטרי קונקט", en: "Rotary Connect" },
  appNameFull: { he: "רוטרי קונקט ישראל", en: "Rotary Connect Israel" },
  tagline: { he: "הקשרים של רוטרי. בחיפוש אחד.", en: "Your Rotary network. One search away." },
  navSearch: { he: "חיפוש", en: "Search" },
  navNetwork: { he: "הרשת", en: "Network" },
  navSaved: { he: "שמורים", en: "Saved" },
  navMe: { he: "אני", en: "Me" },
  signIn: { he: "כניסה", en: "Sign in" },
  createAccount: { he: "יצירת חשבון", en: "Create account" },
  homeQuestion: { he: "איך רשת רוטרי יכולה לעזור לך?", en: "How can the Rotary network help you?" },
  searchPlaceholder: {
    he: "חיפוש אנשים, חברות או תחומי מומחיות",
    en: "Search people, companies or expertise",
  },
  try: { he: "נסו", en: "Try" },
  recentlyViewed: { he: "נצפו לאחרונה", en: "Recently viewed" },
  recentSearches: { he: "חיפושים אחרונים", en: "Recent searches" },
  newToNetwork: { he: "חדשים ברשת", en: "New to the network" },
  suggested: { he: "אנשים שכדאי להכיר", en: "People you may want to know" },
  results: { he: "תוצאות", en: "results" },
  filters: { he: "סינון", en: "Filters" },
  clearFilters: { he: "ניקוי סינון", en: "Clear filters" },
  matched: { he: "התאמה", en: "Matched" },
  canHelpWith: { he: "יכול/ה לעזור ב", en: "Can help with" },
  expertise: { he: "מומחיות", en: "Expertise" },
  about: { he: "אודות", en: "About" },
  professional: { he: "מקצועי", en: "Professional" },
  rotary: { he: "רוטרי", en: "Rotary" },
  languages: { he: "שפות", en: "Languages" },
  contact: { he: "יצירת קשר", en: "Contact" },
  contactPerson: { he: "יצירת קשר עם", en: "Contact" },
  requestIntro: { he: "בקשת היכרות", en: "Request an introduction" },
  save: { he: "שמירה", en: "Save" },
  saved: { he: "נשמר", en: "Saved" },
  share: { he: "שיתוף", en: "Share" },
  memberSince: { he: "חבר/ה משנת", en: "Member since" },
  company: { he: "חברה", en: "Company" },
  position: { he: "תפקיד", en: "Position" },
  industry: { he: "ענף", en: "Industry" },
  profession: { he: "מקצוע", en: "Profession" },
  specialty: { he: "התמחות", en: "Specialty" },
  city: { he: "עיר", en: "City" },
  club: { he: "מועדון רוטרי", en: "Rotary club" },
  exploreTitle: { he: "גילוי הרשת", en: "Explore the network" },
  industries: { he: "ענפים", en: "Industries" },
  locations: { he: "אזורים", en: "Locations" },
  professions: { he: "מקצועות", en: "Professions" },
  people: { he: "אנשים", en: "people" },
  savedTitle: { he: "אנשי קשר שמורים", en: "Saved contacts" },
  savedEmpty: { he: "עדיין לא שמרתם אף אחד", en: "You haven't saved anyone yet" },
  savedEmptyHint: {
    he: "שמירת פרופיל מוסיפה אותו לרשימה פרטית שרק אתם רואים.",
    en: "Saving a profile adds it to a private list only you can see.",
  },
  noResults: { he: "לא נמצאו תוצאות", en: "No results found" },
  noResultsHint: {
    he: "נסו מונח רחב יותר, שם חברה או תחום מומחיות.",
    en: "Try a broader term, a company name or an area of expertise.",
  },
  networkEmpty: { he: "עדיין אין חברים ברשת", en: "There are no members in the network yet" },
  networkEmptyHint: {
    he: "פרופילים יופיעו כאן אחרי שחברי רוטרי יירשמו ויאושרו.",
    en: "Profiles will appear here after Rotary members register and are approved.",
  },
  startSearching: { he: "התחילו בחיפוש", en: "Start searching" },
  guestLimitTitle: { he: "החיפוש החינמי נוצל", en: "Free search used" },
  guestLimitBody: {
    he: "כדי לבצע חיפושים נוספים ברשת רוטרי ישראל, יש להירשם לאתר.",
    en: "To run more searches in the Rotary Israel network, please register.",
  },
  guestOneSearch: {
    he: "אורחים יכולים לבצע חיפוש אחד. ההרשמה חינם לחברי רוטרי.",
    en: "Guests get one search. Registration is free for Rotary members.",
  },
  registerNow: { he: "להרשמה", en: "Register now" },
  later: { he: "לא עכשיו", en: "Not now" },
  footerGovernor: {
    he: "מנחם גץ, נגיד רוטרי ישראל, 2027-2028",
    en: "Menachem Getz, District 2490 Governor, Israel, 2027-2028",
  },
  footerDistrict: { he: "רוטרי ישראל · מחוז 2490", en: "Rotary Israel · District 2490" },
  language: { he: "שפה", en: "Language" },
  myProfile: { he: "הפרופיל שלי", en: "My profile" },
  editProfile: { he: "עריכת פרופיל", en: "Edit profile" },
  signOut: { he: "יציאה", en: "Sign out" },
  notSignedIn: { he: "לא מחוברים", en: "Not signed in" },
  notSignedInHint: {
    he: "התחברו כדי לשמור אנשי קשר, לשלוח בקשות ולנהל את הפרופיל שלכם.",
    en: "Sign in to save contacts, send requests and manage your profile.",
  },
  backToSearch: { he: "חזרה לחיפוש", en: "Back to search" },
  verified: { he: "חבר רוטרי מאומת", en: "Verified Rotary member" },
  familyOf: { he: "בן/בת משפחה של", en: "Family of" },
  family: { he: "משפחה", en: "Family" },
  spouse: { he: "בן/בת זוג", en: "Spouse" },
  child: { he: "בן/בת", en: "Child" },
  parent: { he: "הורה", en: "Parent" },
  sibling: { he: "אח/אחות", en: "Sibling" },
  spouseOf: { he: "בן/בת זוג של", en: "Spouse of" },
  childOf: { he: "בן/בת של", en: "Child of" },
  age: { he: "גיל", en: "Age" },
  viewProfile: { he: "צפייה בפרופיל", en: "View profile" },
  allPeople: { he: "כל האנשים", en: "All people" },
  membersOnly: { he: "חברי רוטרי", en: "Rotary members" },
  familyMembers: { he: "בני משפחה", en: "Family members" },
  spouses: { he: "בני זוג", en: "Spouses" },
  children: { he: "ילדים", en: "Children" },
  searchSuggestion: { he: "האם התכוונת ל", en: "Did you mean" },
  searching: { he: "מחפש...", en: "Searching..." },
  resultsFor: { he: "תוצאות עבור", en: "Results for" },
  workplace: { he: "מקום עבודה", en: "Workplace" },
  yearsOld: { he: "שנים", en: "years old" },
  rotaryMember: { he: "חבר רוטרי", en: "Rotary member" },
  noFamilyMembers: { he: "אין בני משפחה רשומים", en: "No family members registered" },
  // Chatbot registration
  smartRegistration: { he: "הרשמה חכמה", en: "Smart Registration" },
  chatRegistration: { he: "הרשמה בשיחה", en: "Chat Registration" },
  startOver: { he: "התחלה מחדש", en: "Start over" },
  preferTraditional: { he: "מעדיפים טופס מסורתי?", en: "Prefer a traditional form?" },
  clickHere: { he: "לחצו כאן", en: "Click here" },
  typingPlaceholder: { he: "הקלידו את התשובה שלכם...", en: "Type your answer..." },
  enterToSend: { he: "Enter לשליחה · Shift+Enter לשורה חדשה", en: "Enter to send · Shift+Enter for new line" },
  send: { he: "שליחה", en: "Send" },
  letsStart: { he: "בוא נתחיל!", en: "Let's start!" },
  tellMeMore: { he: "ספר לי עוד", en: "Tell me more" },
  yes: { he: "כן", en: "Yes" },
  no: { he: "לא", en: "No" },
  skip: { he: "דלג", en: "Skip" },
  showSummary: { he: "הצג סיכום", en: "Show summary" },
  finishRegistration: { he: "סיים הרשמה", en: "Finish registration" },
};

type Ctx = {
  lang: Lang;
  dir: "rtl" | "ltr";
  t: (key: keyof typeof dict | string) => string;
  setLang: (l: Lang) => void;
  toggleLang: () => void;
};

const I18nContext = createContext<Ctx | null>(null);

const STORAGE_KEY = "rc-lang";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("he");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (stored === "en" || stored === "he") setLangState(stored);
  }, []);

  useEffect(() => {
    const dir = lang === "he" ? "rtl" : "ltr";
    document.documentElement.setAttribute("dir", dir);
    document.documentElement.setAttribute("lang", lang);
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    window.localStorage.setItem(STORAGE_KEY, l);
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      lang,
      dir: lang === "he" ? "rtl" : "ltr",
      t: (key: string) => dict[key]?.[lang] ?? key,
      setLang,
      toggleLang: () => setLang(lang === "he" ? "en" : "he"),
    }),
    [lang, setLang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}

/** Pick the right side of a bilingual value. */
export function bi(lang: Lang, he: string, en: string) {
  return lang === "he" ? he : en;
}

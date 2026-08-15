export type Bi = { he: string; en: string };

export type Member = {
  id: string;
  name: Bi;
  position: Bi;
  company: string;
  profession: Bi;
  specialty: Bi;
  industry: Bi;
  city: Bi;
  club: string; // club id
  clubName: Bi;
  memberSince: number;
  rotaryRole?: Bi;
  about: Bi;
  expertise: Bi[];
  helpWith: Bi[];
  languages: Bi[];
  previousEmployers?: string[];
  accountType: "member" | "family";
  familyOf?: Bi;
  photo?: string;
  isNew?: boolean;
};

export const members: Member[] = [
  {
    id: "david-levi",
    name: { he: "דוד לוי", en: "David Levi" },
    position: { he: 'סמנכ"ל פיתוח עסקי', en: "VP Business Development" },
    company: "Elbit Systems",
    profession: { he: "פיתוח עסקי", en: "Business Development" },
    specialty: { he: "עסקים בינלאומיים", en: "International Business" },
    industry: { he: "תעופה וביטחון", en: "Aerospace & Defense" },
    city: { he: "חיפה", en: "Haifa" },
    club: "haifa",
    clubName: { he: "רוטרי חיפה", en: "Rotary Haifa" },
    memberSince: 2017,
    rotaryRole: { he: "נשיא מועדון בעבר", en: "Past Club President" },
    about: {
      he: "עשרים שנה בפיתוח עסקי בינלאומי, בעיקר בשווקי אסיה. אוהב לחבר בין אנשים.",
      en: "Twenty years in international business development, mainly Asian markets. I enjoy connecting people.",
    },
    expertise: [
      { he: "עסקים בינלאומיים", en: "International Business" },
      { he: "טכנולוגיות ביטחוניות", en: "Defense Technology" },
      { he: "פיתוח עסקי", en: "Business Development" },
      { he: "אסיה", en: "Asia" },
    ],
    helpWith: [
      { he: "היכרויות עסקיות", en: "Corporate introductions" },
      { he: "שותפויות בינלאומיות", en: "International partnerships" },
      { he: "שווקי אסיה", en: "Asian markets" },
    ],
    languages: [
      { he: "עברית", en: "Hebrew" },
      { he: "אנגלית", en: "English" },
    ],
    previousEmployers: ["Rafael", "Israel Aerospace Industries"],
    accountType: "member",
  },
  {
    id: "yael-shani",
    name: { he: "יעל שני", en: "Yael Shani" },
    position: { he: "מנהלת מוצר בכירה", en: "Senior Product Manager" },
    company: "Microsoft",
    profession: { he: "ניהול מוצר", en: "Product Management" },
    specialty: { he: "בינה מלאכותית", en: "Artificial Intelligence" },
    industry: { he: "טכנולוגיה", en: "Technology" },
    city: { he: "הרצליה", en: "Herzliya" },
    club: "herzliya",
    clubName: { he: "רוטרי הרצליה", en: "Rotary Herzliya" },
    memberSince: 2021,
    about: {
      he: "בונה מוצרי ענן ובינה מלאכותית. מלווה יזמים בתחילת הדרך.",
      en: "Building cloud and AI products. I mentor early-stage founders.",
    },
    expertise: [
      { he: "בינה מלאכותית", en: "AI" },
      { he: "מוצרי ענן", en: "Cloud" },
      { he: "מוצר", en: "Product" },
      { he: "SaaS", en: "SaaS" },
    ],
    helpWith: [
      { he: "טכנולוגיה", en: "Technology" },
      { he: "מנטורינג", en: "Mentoring" },
      { he: "היכרות עם החברה שלי", en: "Introductions to my company" },
    ],
    languages: [
      { he: "עברית", en: "Hebrew" },
      { he: "אנגלית", en: "English" },
    ],
    previousEmployers: ["Wix", "Intel"],
    accountType: "member",
    isNew: true,
  },
  {
    id: "avi-mizrahi",
    name: { he: "אבי מזרחי", en: "Avi Mizrahi" },
    position: { he: "שותף", en: "Partner" },
    company: "Herzog Fox & Neeman",
    profession: { he: "עורך דין", en: "Lawyer" },
    specialty: { he: "דיני חברות ומיזוגים", en: "Corporate Law & M&A" },
    industry: { he: "שירותים משפטיים", en: "Legal Services" },
    city: { he: "תל אביב", en: "Tel Aviv" },
    club: "tel-aviv",
    clubName: { he: "רוטרי תל אביב", en: "Rotary Tel Aviv" },
    memberSince: 2012,
    rotaryRole: { he: "יו״ר ועדת פרויקטים", en: "Projects Committee Chair" },
    about: {
      he: "מלווה חברות טכנולוגיה בעסקאות מיזוג ורכישה וגיוסי הון.",
      en: "Advising technology companies on M&A transactions and fundraising.",
    },
    expertise: [
      { he: "דיני חברות", en: "Corporate Law" },
      { he: "מיזוגים ורכישות", en: "M&A" },
      { he: "משפט מסחרי", en: "Commercial Law" },
      { he: "השקעות", en: "Investment" },
    ],
    helpWith: [
      { he: "ייעוץ משפטי", en: "Legal advice" },
      { he: "השקעות", en: "Investments" },
      { he: "פרויקטים של רוטרי", en: "Rotary projects" },
    ],
    languages: [
      { he: "עברית", en: "Hebrew" },
      { he: "אנגלית", en: "English" },
      { he: "צרפתית", en: "French" },
    ],
    accountType: "member",
  },
  {
    id: "noa-barak",
    name: { he: "נועה ברק", en: "Noa Barak" },
    position: { he: "מנהלת מחלקת קרדיולוגיה", en: "Head of Cardiology" },
    company: "Rambam Health Care Campus",
    profession: { he: "רופאה", en: "Physician" },
    specialty: { he: "קרדיולוגיה", en: "Cardiology" },
    industry: { he: "בריאות", en: "Healthcare" },
    city: { he: "חיפה", en: "Haifa" },
    club: "haifa-carmel",
    clubName: { he: "רוטרי חיפה כרמל", en: "Rotary Haifa Carmel" },
    memberSince: 2019,
    about: {
      he: "קרדיולוגית, עוסקת גם ברגולציה של ציוד רפואי ובפרויקטים קהילתיים.",
      en: "Cardiologist, also involved in medical device regulation and community projects.",
    },
    expertise: [
      { he: "קרדיולוגיה", en: "Cardiology" },
      { he: "ציוד רפואי", en: "Medical Devices" },
      { he: "רגולציה", en: "Regulation" },
      { he: "בריאות", en: "Healthcare" },
    ],
    helpWith: [
      { he: "בריאות", en: "Healthcare" },
      { he: "ייעוץ", en: "Advice" },
      { he: "פרויקטים קהילתיים", en: "Community projects" },
    ],
    languages: [
      { he: "עברית", en: "Hebrew" },
      { he: "אנגלית", en: "English" },
      { he: "רוסית", en: "Russian" },
    ],
    accountType: "member",
  },
  {
    id: "ron-katz",
    name: { he: "רון כץ", en: "Ron Katz" },
    position: { he: "שותף מנהל", en: "Managing Partner" },
    company: "Aleph VC",
    profession: { he: "משקיע", en: "Investor" },
    specialty: { he: "הון סיכון", en: "Venture Capital" },
    industry: { he: "פיננסים", en: "Finance" },
    city: { he: "תל אביב", en: "Tel Aviv" },
    club: "tel-aviv-jaffa",
    clubName: { he: "רוטרי תל אביב יפו", en: "Rotary Tel Aviv Jaffa" },
    memberSince: 2015,
    about: {
      he: "משקיע בשלבים מוקדמים בתחומי תוכנה, סייבר ופינטק.",
      en: "Early-stage investor in software, cyber and fintech.",
    },
    expertise: [
      { he: "הון סיכון", en: "Venture Capital" },
      { he: "פינטק", en: "Fintech" },
      { he: "סייבר", en: "Cybersecurity" },
      { he: "גיוס הון", en: "Fundraising" },
    ],
    helpWith: [
      { he: "השקעות", en: "Investments" },
      { he: "מנטורינג", en: "Mentoring" },
      { he: "היכרויות עסקיות", en: "Corporate introductions" },
    ],
    languages: [
      { he: "עברית", en: "Hebrew" },
      { he: "אנגלית", en: "English" },
    ],
    accountType: "member",
  },
  {
    id: "dana-cohen",
    name: { he: "דנה כהן", en: "Dana Cohen" },
    position: { he: "מנהלת שיווק", en: "Marketing Director" },
    company: "Strauss Group",
    profession: { he: "שיווק", en: "Marketing" },
    specialty: { he: "מותגי מזון", en: "Food Brands" },
    industry: { he: "מזון וקמעונאות", en: "Food & Retail" },
    city: { he: "פתח תקווה", en: "Petah Tikva" },
    club: "haifa",
    clubName: { he: "רוטרי חיפה", en: "Rotary Haifa" },
    memberSince: 2022,
    about: {
      he: "מובילה מותגי מזון בשוק המקומי ובייצוא.",
      en: "Leading food brands in the local market and in export.",
    },
    expertise: [
      { he: "שיווק", en: "Marketing" },
      { he: "מותגים", en: "Branding" },
      { he: "קמעונאות", en: "Retail" },
      { he: "ייצוא", en: "Export" },
    ],
    helpWith: [
      { he: "שיווק", en: "Marketing" },
      { he: "ספקים", en: "Suppliers" },
      { he: "היכרות עם החברה שלי", en: "Introductions to my company" },
    ],
    languages: [
      { he: "עברית", en: "Hebrew" },
      { he: "אנגלית", en: "English" },
    ],
    accountType: "family",
    familyOf: { he: "דוד כהן", en: "David Cohen" },
  },
  {
    id: "eran-shalev",
    name: { he: "ערן שלו", en: "Eran Shalev" },
    position: { he: 'מנכ"ל', en: "CEO" },
    company: "CyberDome",
    profession: { he: "יזם", en: "Entrepreneur" },
    specialty: { he: "אבטחת מידע", en: "Cybersecurity" },
    industry: { he: "טכנולוגיה", en: "Technology" },
    city: { he: "באר שבע", en: "Beer Sheva" },
    club: "beer-sheva",
    clubName: { he: "רוטרי באר שבע", en: "Rotary Beer Sheva" },
    memberSince: 2020,
    about: {
      he: "מקים חברות סייבר, פעיל במערכת ההשכלה הגבוהה בנגב.",
      en: "Founder of cyber companies, active in higher education in the Negev.",
    },
    expertise: [
      { he: "סייבר", en: "Cybersecurity" },
      { he: "יזמות", en: "Entrepreneurship" },
      { he: "ענן", en: "Cloud" },
      { he: "ממשל", en: "Government" },
    ],
    helpWith: [
      { he: "טכנולוגיה", en: "Technology" },
      { he: "גיוס עובדים", en: "Recruitment" },
      { he: "מנטורינג", en: "Mentoring" },
    ],
    languages: [
      { he: "עברית", en: "Hebrew" },
      { he: "אנגלית", en: "English" },
    ],
    accountType: "member",
    isNew: true,
  },
  {
    id: "michal-adler",
    name: { he: "מיכל אדלר", en: "Michal Adler" },
    position: { he: "מנהלת נדל״ן מסחרי", en: "Head of Commercial Real Estate" },
    company: "Azrieli Group",
    profession: { he: "נדל״ן", en: "Real Estate" },
    specialty: { he: "נדל״ן מסחרי", en: "Commercial Real Estate" },
    industry: { he: "נדל״ן", en: "Real Estate" },
    city: { he: "תל אביב", en: "Tel Aviv" },
    club: "ramat-gan",
    clubName: { he: "רוטרי רמת גן", en: "Rotary Ramat Gan" },
    memberSince: 2018,
    about: {
      he: "מנהלת פרויקטים של נדל״ן מסחרי במרכז הארץ.",
      en: "Managing commercial real estate projects in central Israel.",
    },
    expertise: [
      { he: "נדל״ן", en: "Real Estate" },
      { he: "בנייה", en: "Construction" },
      { he: "השקעות", en: "Investment" },
    ],
    helpWith: [
      { he: "נדל״ן", en: "Real estate" },
      { he: "ייעוץ", en: "Advice" },
    ],
    languages: [
      { he: "עברית", en: "Hebrew" },
      { he: "אנגלית", en: "English" },
    ],
    accountType: "member",
  },
  {
    id: "yossi-friedman",
    name: { he: "יוסי פרידמן", en: "Yossi Friedman" },
    position: { he: "מנהל אגף בכיר", en: "Senior Division Director" },
    company: "Ministry of Education",
    profession: { he: "חינוך", en: "Education" },
    specialty: { he: "מדיניות חינוך", en: "Education Policy" },
    industry: { he: "ממשל וציבור", en: "Government & Public Sector" },
    city: { he: "ירושלים", en: "Jerusalem" },
    club: "jerusalem",
    clubName: { he: "רוטרי ירושלים", en: "Rotary Jerusalem" },
    memberSince: 2010,
    rotaryRole: { he: "תפקיד מחוזי בעבר", en: "Past District Role" },
    about: {
      he: "עוסק במדיניות חינוך ובשיתופי פעולה בין המגזר הציבורי לעסקי.",
      en: "Working on education policy and public-private collaboration.",
    },
    expertise: [
      { he: "חינוך", en: "Education" },
      { he: "ממשל", en: "Government" },
      { he: "מדיניות", en: "Public Policy" },
    ],
    helpWith: [
      { he: "פרויקטים של רוטרי", en: "Rotary projects" },
      { he: "ייעוץ", en: "Advice" },
      { he: "היכרויות", en: "Introductions" },
    ],
    languages: [
      { he: "עברית", en: "Hebrew" },
      { he: "אנגלית", en: "English" },
    ],
    accountType: "member",
  },
  {
    id: "lior-ben-ami",
    name: { he: "ליאור בן עמי", en: "Lior Ben Ami" },
    position: { he: "מנהל ייבוא", en: "Import Manager" },
    company: "MedTech Import Ltd",
    profession: { he: "סחר בינלאומי", en: "International Trade" },
    specialty: { he: "ייבוא ציוד רפואי", en: "Medical Equipment Import" },
    industry: { he: "בריאות", en: "Healthcare" },
    city: { he: "נתניה", en: "Netanya" },
    club: "netanya",
    clubName: { he: "רוטרי נתניה", en: "Rotary Netanya" },
    memberSince: 2016,
    about: {
      he: "מייבא ציוד רפואי מגרמניה ומדרום קוריאה, מומחה לרגולציה ולוגיסטיקה.",
      en: "Importing medical equipment from Germany and South Korea; regulation and logistics expert.",
    },
    expertise: [
      { he: "ייבוא", en: "Import" },
      { he: "ציוד רפואי", en: "Medical Devices" },
      { he: "שרשרת אספקה", en: "Supply Chain" },
      { he: "קוריאה", en: "South Korea" },
      { he: "גרמניה", en: "Germany" },
    ],
    helpWith: [
      { he: "ספקים", en: "Suppliers" },
      { he: "עסקים בינלאומיים", en: "International business" },
      { he: "ייעוץ", en: "Advice" },
    ],
    languages: [
      { he: "עברית", en: "Hebrew" },
      { he: "אנגלית", en: "English" },
      { he: "גרמנית", en: "German" },
    ],
    accountType: "member",
  },
  {
    id: "tamar-golan",
    name: { he: "תמר גולן", en: "Tamar Golan" },
    position: { he: "מנהלת מלונאות", en: "Hospitality Director" },
    company: "Isrotel",
    profession: { he: "מלונאות", en: "Hospitality" },
    specialty: { he: "תיירות נכנסת", en: "Inbound Tourism" },
    industry: { he: "תיירות", en: "Tourism" },
    city: { he: "אילת", en: "Eilat" },
    club: "eilat",
    clubName: { he: "רוטרי אילת", en: "Rotary Eilat" },
    memberSince: 2014,
    about: {
      he: "עשרים שנה בענף המלונאות, קשרים בשווקי אסיה ואירופה.",
      en: "Twenty years in hospitality with connections in Asian and European markets.",
    },
    expertise: [
      { he: "מלונאות", en: "Hospitality" },
      { he: "תיירות", en: "Tourism" },
      { he: "שירות", en: "Service" },
      { he: "קוריאה", en: "South Korea" },
    ],
    helpWith: [
      { he: "היכרויות", en: "Introductions" },
      { he: "עסקים בינלאומיים", en: "International business" },
    ],
    languages: [
      { he: "עברית", en: "Hebrew" },
      { he: "אנגלית", en: "English" },
    ],
    accountType: "member",
  },
  {
    id: "amit-regev",
    name: { he: "עמית רגב", en: "Amit Regev" },
    position: { he: "מהנדס תוכנה", en: "Software Engineer" },
    company: "Samsung Israel R&D",
    profession: { he: "הנדסת תוכנה", en: "Software Engineering" },
    specialty: { he: "מערכות משובצות", en: "Embedded Systems" },
    industry: { he: "טכנולוגיה", en: "Technology" },
    city: { he: "רעננה", en: "Raanana" },
    club: "raanana",
    clubName: { he: "רוטרי רעננה", en: "Rotary Raanana" },
    memberSince: 2023,
    about: {
      he: "מהנדס תוכנה, קשרים עם מטה החברה בקוריאה.",
      en: "Software engineer with connections to the company headquarters in Korea.",
    },
    expertise: [
      { he: "תוכנה", en: "Software" },
      { he: "חומרה", en: "Hardware" },
      { he: "קוריאה", en: "South Korea" },
    ],
    helpWith: [
      { he: "טכנולוגיה", en: "Technology" },
      { he: "היכרות עם החברה שלי", en: "Introductions to my company" },
    ],
    languages: [
      { he: "עברית", en: "Hebrew" },
      { he: "אנגלית", en: "English" },
    ],
    accountType: "family",
    familyOf: { he: "אורית רגב", en: "Orit Regev" },
    isNew: true,
  },
];

export function memberById(id: string) {
  return members.find((m) => m.id === id);
}

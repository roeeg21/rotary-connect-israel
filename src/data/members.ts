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
    id: "m1",
    name: { he: "דני כהן", en: "Danny Cohen" },
    position: { he: "שותף מנהל", en: "Managing Partner" },
    company: "Cohen & Partners Law",
    profession: { he: "עורך דין", en: "Lawyer" },
    specialty: { he: "משפט מסחרי", en: "Commercial Law" },
    industry: { he: "משפטים", en: "Legal" },
    city: { he: "תל אביב", en: "Tel Aviv" },
    club: "tel-aviv",
    clubName: { he: "רוטרי תל אביב", en: "Rotary Tel Aviv" },
    memberSince: 2015,
    about: {
      he: "עורך דין עם ניסיון של 25 שנה בתחום המשפט המסחרי והבינלאומי.",
      en: "Lawyer with 25 years of experience in commercial and international law.",
    },
    expertise: [
      { he: "מיזוגים ורכישות", en: "Mergers & Acquisitions" },
      { he: "חוזים בינלאומיים", en: "International Contracts" },
    ],
    helpWith: [
      { he: "ייעוץ משפטי", en: "Legal Advice" },
      { he: "הסכמי מסחר", en: "Commercial Agreements" },
    ],
    languages: [
      { he: "עברית", en: "Hebrew" },
      { he: "אנגלית", en: "English" },
    ],
    accountType: "member",
    isNew: true,
  },
  {
    id: "m2",
    name: { he: "מיכל לוי", en: "Michal Levi" },
    position: { he: "מנכ״לית", en: "CEO" },
    company: "HealthTech Solutions",
    profession: { he: "יזמית", en: "Entrepreneur" },
    specialty: { he: "טכנולוגיה רפואית", en: "Medical Technology" },
    industry: { he: "הייטק", en: "High-Tech" },
    city: { he: "הרצליה", en: "Herzliya" },
    club: "herzliya",
    clubName: { he: "רוטרי הרצליה", en: "Rotary Herzliya" },
    memberSince: 2018,
    about: {
      he: "יזמית סדרתית בתחום הבריאות הדיגיטלית, מייסדת שלוש חברות הזנק.",
      en: "Serial entrepreneur in digital health, founder of three startups.",
    },
    expertise: [
      { he: "גיוס הון", en: "Fundraising" },
      { he: "פיתוח עסקי", en: "Business Development" },
    ],
    helpWith: [
      { he: "ייעוץ ליזמים", en: "Startup Mentoring" },
      { he: "קשרים בתעשייה", en: "Industry Connections" },
    ],
    languages: [
      { he: "עברית", en: "Hebrew" },
      { he: "אנגלית", en: "English" },
    ],
    accountType: "member",
    isNew: true,
  },
  {
    id: "m3",
    name: { he: "יוסי אברהם", en: "Yossi Avraham" },
    position: { he: "רופא בכיר", en: "Senior Physician" },
    company: "Ichilov Medical Center",
    profession: { he: "רופא", en: "Physician" },
    specialty: { he: "קרדיולוגיה", en: "Cardiology" },
    industry: { he: "בריאות", en: "Healthcare" },
    city: { he: "תל אביב", en: "Tel Aviv" },
    club: "tel-aviv-jaffa",
    clubName: { he: "רוטרי תל אביב יפו", en: "Rotary Tel Aviv Jaffa" },
    memberSince: 2012,
    rotaryRole: { he: "נשיא לשעבר", en: "Past President" },
    about: {
      he: "קרדיולוג מוביל עם התמחות בטיפול במחלות לב מורכבות.",
      en: "Leading cardiologist specializing in complex heart disease treatment.",
    },
    expertise: [
      { he: "קרדיולוגיה פולשנית", en: "Interventional Cardiology" },
      { he: "מחקר קליני", en: "Clinical Research" },
    ],
    helpWith: [
      { he: "ייעוץ רפואי", en: "Medical Consultation" },
      { he: "חוות דעת מומחה", en: "Expert Opinion" },
    ],
    languages: [
      { he: "עברית", en: "Hebrew" },
      { he: "אנגלית", en: "English" },
      { he: "צרפתית", en: "French" },
    ],
    accountType: "member",
  },
  {
    id: "m4",
    name: { he: "רונית שרון", en: "Ronit Sharon" },
    position: { he: "מנהלת כספים ראשית", en: "CFO" },
    company: "Bank Leumi",
    profession: { he: "רואת חשבון", en: "CPA" },
    specialty: { he: "ניהול פיננסי", en: "Financial Management" },
    industry: { he: "פיננסים", en: "Finance" },
    city: { he: "רמת גן", en: "Ramat Gan" },
    club: "ramat-gan",
    clubName: { he: "רוטרי רמת גן", en: "Rotary Ramat Gan" },
    memberSince: 2016,
    about: {
      he: "מנהלת פיננסית בכירה עם ניסיון של 20 שנה במגזר הבנקאי.",
      en: "Senior financial executive with 20 years of experience in banking.",
    },
    expertise: [
      { he: "ניתוח פיננסי", en: "Financial Analysis" },
      { he: "ניהול סיכונים", en: "Risk Management" },
    ],
    helpWith: [
      { he: "תכנון פיננסי", en: "Financial Planning" },
      { he: "ייעוץ השקעות", en: "Investment Advice" },
    ],
    languages: [
      { he: "עברית", en: "Hebrew" },
      { he: "אנגלית", en: "English" },
    ],
    accountType: "member",
  },
  {
    id: "m5",
    name: { he: "אלון גולן", en: "Alon Golan" },
    position: { he: "אדריכל ראשי", en: "Chief Architect" },
    company: "Golan Architecture Studio",
    profession: { he: "אדריכל", en: "Architect" },
    specialty: { he: "אדריכלות בת-קיימא", en: "Sustainable Architecture" },
    industry: { he: "בנייה ונדל״ן", en: "Construction & Real Estate" },
    city: { he: "חיפה", en: "Haifa" },
    club: "haifa-carmel",
    clubName: { he: "רוטרי חיפה כרמל", en: "Rotary Haifa Carmel" },
    memberSince: 2014,
    about: {
      he: "אדריכל מוביל בתחום הבנייה הירוקה והאדריכלות בת-קיימא.",
      en: "Leading architect in green building and sustainable architecture.",
    },
    expertise: [
      { he: "בנייה ירוקה", en: "Green Building" },
      { he: "תכנון עירוני", en: "Urban Planning" },
    ],
    helpWith: [
      { he: "ייעוץ אדריכלי", en: "Architectural Consulting" },
      { he: "תכנון פרויקטים", en: "Project Planning" },
    ],
    languages: [
      { he: "עברית", en: "Hebrew" },
      { he: "אנגלית", en: "English" },
    ],
    accountType: "member",
    isNew: true,
  },
  {
    id: "m6",
    name: { he: "נועה ברק", en: "Noa Barak" },
    position: { he: "סמנכ״לית שיווק", en: "VP Marketing" },
    company: "Wix.com",
    profession: { he: "מנהלת שיווק", en: "Marketing Manager" },
    specialty: { he: "שיווק דיגיטלי", en: "Digital Marketing" },
    industry: { he: "הייטק", en: "High-Tech" },
    city: { he: "תל אביב", en: "Tel Aviv" },
    club: "tel-aviv",
    clubName: { he: "רוטרי תל אביב", en: "Rotary Tel Aviv" },
    memberSince: 2020,
    about: {
      he: "מומחית לשיווק דיגיטלי עם התמחות בצמיחה של חברות טכנולוגיה.",
      en: "Digital marketing expert specializing in tech company growth.",
    },
    expertise: [
      { he: "שיווק דיגיטלי", en: "Digital Marketing" },
      { he: "מיתוג", en: "Branding" },
    ],
    helpWith: [
      { he: "אסטרטגיית שיווק", en: "Marketing Strategy" },
      { he: "קידום מותג", en: "Brand Promotion" },
    ],
    languages: [
      { he: "עברית", en: "Hebrew" },
      { he: "אנגלית", en: "English" },
    ],
    accountType: "member",
    isNew: true,
  },
  {
    id: "m7",
    name: { he: "עמית רוזן", en: "Amit Rosen" },
    position: { he: "מייסד ומנכ״ל", en: "Founder & CEO" },
    company: "CyberShield Ltd",
    profession: { he: "יזם סייבר", en: "Cyber Entrepreneur" },
    specialty: { he: "אבטחת מידע", en: "Information Security" },
    industry: { he: "סייבר", en: "Cybersecurity" },
    city: { he: "רעננה", en: "Raanana" },
    club: "raanana",
    clubName: { he: "רוטרי רעננה", en: "Rotary Raanana" },
    memberSince: 2019,
    about: {
      he: "יזם סייבר עם רקע ביחידה 8200 ומייסד שתי חברות אבטחה.",
      en: "Cyber entrepreneur with Unit 8200 background, founded two security companies.",
    },
    expertise: [
      { he: "אבטחת סייבר", en: "Cyber Security" },
      { he: "הגנה על מידע", en: "Data Protection" },
    ],
    helpWith: [
      { he: "ייעוץ סייבר", en: "Cyber Consulting" },
      { he: "בדיקות חדירה", en: "Penetration Testing" },
    ],
    languages: [
      { he: "עברית", en: "Hebrew" },
      { he: "אנגלית", en: "English" },
    ],
    accountType: "member",
  },
  {
    id: "m8",
    name: { he: "שירה כץ", en: "Shira Katz" },
    position: { he: "פסיכולוגית קלינית", en: "Clinical Psychologist" },
    company: "Private Practice",
    profession: { he: "פסיכולוגית", en: "Psychologist" },
    specialty: { he: "טיפול קוגניטיבי-התנהגותי", en: "CBT Therapy" },
    industry: { he: "בריאות", en: "Healthcare" },
    city: { he: "ירושלים", en: "Jerusalem" },
    club: "jerusalem",
    clubName: { he: "רוטרי ירושלים", en: "Rotary Jerusalem" },
    memberSince: 2017,
    about: {
      he: "פסיכולוגית קלינית מומחית בטיפול בחרדה ודיכאון.",
      en: "Clinical psychologist specializing in anxiety and depression treatment.",
    },
    expertise: [
      { he: "טיפול CBT", en: "CBT Therapy" },
      { he: "טיפול בטראומה", en: "Trauma Therapy" },
    ],
    helpWith: [
      { he: "ייעוץ פסיכולוגי", en: "Psychological Counseling" },
      { he: "סדנאות", en: "Workshops" },
    ],
    languages: [
      { he: "עברית", en: "Hebrew" },
      { he: "אנגלית", en: "English" },
    ],
    accountType: "member",
  },
  {
    id: "m9",
    name: { he: "גיא מזרחי", en: "Guy Mizrachi" },
    position: { he: "מנהל השקעות", en: "Investment Manager" },
    company: "Clal Insurance",
    profession: { he: "מנהל השקעות", en: "Investment Manager" },
    specialty: { he: "ניהול תיקים", en: "Portfolio Management" },
    industry: { he: "פיננסים", en: "Finance" },
    city: { he: "פתח תקווה", en: "Petah Tikva" },
    club: "petah-tikva",
    clubName: { he: "רוטרי פתח תקווה", en: "Rotary Petah Tikva" },
    memberSince: 2013,
    about: {
      he: "מנהל השקעות בכיר עם ניסיון של 18 שנה בשוק ההון.",
      en: "Senior investment manager with 18 years of capital market experience.",
    },
    expertise: [
      { he: "ניהול תיקים", en: "Portfolio Management" },
      { he: "ניתוח שוק", en: "Market Analysis" },
    ],
    helpWith: [
      { he: "תכנון פנסיוני", en: "Pension Planning" },
      { he: "ייעוץ השקעות", en: "Investment Advice" },
    ],
    languages: [
      { he: "עברית", en: "Hebrew" },
      { he: "אנגלית", en: "English" },
    ],
    accountType: "member",
  },
  {
    id: "m10",
    name: { he: "תמר אלון", en: "Tamar Alon" },
    position: { he: "עורכת דין שותפה", en: "Partner Attorney" },
    company: "Herzog Fox & Neeman",
    profession: { he: "עורכת דין", en: "Lawyer" },
    specialty: { he: "קניין רוחני", en: "Intellectual Property" },
    industry: { he: "משפטים", en: "Legal" },
    city: { he: "תל אביב", en: "Tel Aviv" },
    club: "ramat-hasharon",
    clubName: { he: "רוטרי רמת השרון", en: "Rotary Ramat Hasharon" },
    memberSince: 2016,
    about: {
      he: "עורכת דין בכירה המתמחה בקניין רוחני וטכנולוגיה.",
      en: "Senior attorney specializing in intellectual property and technology.",
    },
    expertise: [
      { he: "פטנטים", en: "Patents" },
      { he: "סימני מסחר", en: "Trademarks" },
    ],
    helpWith: [
      { he: "הגנה על IP", en: "IP Protection" },
      { he: "ליטיגציה", en: "Litigation" },
    ],
    languages: [
      { he: "עברית", en: "Hebrew" },
      { he: "אנגלית", en: "English" },
      { he: "גרמנית", en: "German" },
    ],
    accountType: "member",
  },
  {
    id: "m11",
    name: { he: "אורי דוד", en: "Uri David" },
    position: { he: "מהנדס תוכנה בכיר", en: "Senior Software Engineer" },
    company: "Google Israel",
    profession: { he: "מהנדס תוכנה", en: "Software Engineer" },
    specialty: { he: "בינה מלאכותית", en: "Artificial Intelligence" },
    industry: { he: "הייטק", en: "High-Tech" },
    city: { he: "תל אביב", en: "Tel Aviv" },
    club: "tel-aviv",
    clubName: { he: "רוטרי תל אביב", en: "Rotary Tel Aviv" },
    memberSince: 2021,
    about: {
      he: "מהנדס AI בכיר בגוגל עם התמחות בלמידת מכונה.",
      en: "Senior AI engineer at Google specializing in machine learning.",
    },
    expertise: [
      { he: "למידת מכונה", en: "Machine Learning" },
      { he: "עיבוד שפה טבעית", en: "NLP" },
    ],
    helpWith: [
      { he: "ייעוץ טכנולוגי", en: "Tech Consulting" },
      { he: "מנטורינג קריירה", en: "Career Mentoring" },
    ],
    languages: [
      { he: "עברית", en: "Hebrew" },
      { he: "אנגלית", en: "English" },
    ],
    accountType: "member",
    isNew: true,
  },
  {
    id: "m12",
    name: { he: "ליאת גבע", en: "Liat Geva" },
    position: { he: "מנהלת משאבי אנוש", en: "HR Director" },
    company: "Intel Israel",
    profession: { he: "מנהלת HR", en: "HR Manager" },
    specialty: { he: "פיתוח ארגוני", en: "Organizational Development" },
    industry: { he: "הייטק", en: "High-Tech" },
    city: { he: "חיפה", en: "Haifa" },
    club: "haifa",
    clubName: { he: "רוטרי חיפה", en: "Rotary Haifa" },
    memberSince: 2015,
    about: {
      he: "מנהלת HR עם ניסיון של 15 שנה בחברות טכנולוגיה מובילות.",
      en: "HR director with 15 years of experience in leading tech companies.",
    },
    expertise: [
      { he: "גיוס עובדים", en: "Recruitment" },
      { he: "פיתוח מנהלים", en: "Leadership Development" },
    ],
    helpWith: [
      { he: "ייעוץ קריירה", en: "Career Advice" },
      { he: "אסטרטגיית HR", en: "HR Strategy" },
    ],
    languages: [
      { he: "עברית", en: "Hebrew" },
      { he: "אנגלית", en: "English" },
    ],
    accountType: "member",
  },
  {
    id: "m13",
    name: { he: "משה פרידמן", en: "Moshe Friedman" },
    position: { he: "קבלן ראשי", en: "General Contractor" },
    company: "Friedman Construction",
    profession: { he: "קבלן בניין", en: "Building Contractor" },
    specialty: { he: "בנייה למגורים", en: "Residential Construction" },
    industry: { he: "בנייה ונדל״ן", en: "Construction & Real Estate" },
    city: { he: "נתניה", en: "Netanya" },
    club: "netanya",
    clubName: { he: "רוטרי נתניה", en: "Rotary Netanya" },
    memberSince: 2010,
    rotaryRole: { he: "נשיא לשעבר", en: "Past President" },
    about: {
      he: "קבלן ותיק עם ניסיון של 30 שנה בבניית פרויקטים למגורים.",
      en: "Veteran contractor with 30 years of residential project experience.",
    },
    expertise: [
      { he: "ניהול פרויקטים", en: "Project Management" },
      { he: "שיפוץ ובנייה", en: "Renovation & Construction" },
    ],
    helpWith: [
      { he: "ייעוץ בנייה", en: "Construction Consulting" },
      { he: "הערכת עלויות", en: "Cost Estimation" },
    ],
    languages: [
      { he: "עברית", en: "Hebrew" },
      { he: "אנגלית", en: "English" },
    ],
    accountType: "member",
  },
  {
    id: "m14",
    name: { he: "הדס יוסף", en: "Hadas Yosef" },
    position: { he: "מנהלת חינוך", en: "Education Director" },
    company: "ORT Israel",
    profession: { he: "מנהלת חינוך", en: "Education Administrator" },
    specialty: { he: "חינוך טכנולוגי", en: "Technology Education" },
    industry: { he: "חינוך", en: "Education" },
    city: { he: "ראשון לציון", en: "Rishon LeZion" },
    club: "rishon",
    clubName: { he: "רוטרי ראשון לציון", en: "Rotary Rishon LeZion" },
    memberSince: 2018,
    about: {
      he: "מנהלת חינוך עם חזון לשילוב טכנולוגיה בלמידה.",
      en: "Education leader with a vision for integrating technology in learning.",
    },
    expertise: [
      { he: "חינוך STEM", en: "STEM Education" },
      { he: "פיתוח תכניות לימוד", en: "Curriculum Development" },
    ],
    helpWith: [
      { he: "ייעוץ חינוכי", en: "Educational Consulting" },
      { he: "הכשרת מורים", en: "Teacher Training" },
    ],
    languages: [
      { he: "עברית", en: "Hebrew" },
      { he: "אנגלית", en: "English" },
    ],
    accountType: "member",
  },
  {
    id: "m15",
    name: { he: "עידו נחמיאס", en: "Ido Nachmias" },
    position: { he: "מנכ״ל", en: "CEO" },
    company: "Nachmias Import-Export",
    profession: { he: "יבואן", en: "Importer" },
    specialty: { he: "סחר בינלאומי", en: "International Trade" },
    industry: { he: "מסחר בינלאומי", en: "International Trade" },
    city: { he: "אשדוד", en: "Ashdod" },
    club: "ashdod",
    clubName: { he: "רוטרי אשדוד", en: "Rotary Ashdod" },
    memberSince: 2014,
    about: {
      he: "יבואן ויצואן מנוסה עם קשרים בינלאומיים נרחבים.",
      en: "Experienced importer-exporter with extensive international connections.",
    },
    expertise: [
      { he: "יבוא ויצוא", en: "Import-Export" },
      { he: "לוגיסטיקה", en: "Logistics" },
    ],
    helpWith: [
      { he: "קשרי סחר", en: "Trade Connections" },
      { he: "ייעוץ מכס", en: "Customs Advice" },
    ],
    languages: [
      { he: "עברית", en: "Hebrew" },
      { he: "אנגלית", en: "English" },
      { he: "רוסית", en: "Russian" },
    ],
    accountType: "member",
  },
  {
    id: "m16",
    name: { he: "אסתר בן-דוד", en: "Esther Ben-David" },
    position: { he: "רופאת שיניים", en: "Dentist" },
    company: "Ben-David Dental Clinic",
    profession: { he: "רופאת שיניים", en: "Dentist" },
    specialty: { he: "אורתודונטיה", en: "Orthodontics" },
    industry: { he: "בריאות", en: "Healthcare" },
    city: { he: "כפר סבא", en: "Kfar Saba" },
    club: "kfar-saba",
    clubName: { he: "רוטרי כפר סבא", en: "Rotary Kfar Saba" },
    memberSince: 2019,
    about: {
      he: "רופאת שיניים מומחית באורתודונטיה עם קליניקה פרטית.",
      en: "Orthodontist running a private dental clinic.",
    },
    expertise: [
      { he: "יישור שיניים", en: "Teeth Alignment" },
      { he: "טיפולי Invisalign", en: "Invisalign Treatment" },
    ],
    helpWith: [
      { he: "ייעוץ רפואי", en: "Medical Advice" },
      { he: "הפניות רפואיות", en: "Medical Referrals" },
    ],
    languages: [
      { he: "עברית", en: "Hebrew" },
      { he: "אנגלית", en: "English" },
    ],
    accountType: "member",
    isNew: true,
  },
  {
    id: "m17",
    name: { he: "רועי שמש", en: "Roy Shemesh" },
    position: { he: "שף ובעלים", en: "Chef & Owner" },
    company: "Shemesh Restaurant",
    profession: { he: "שף", en: "Chef" },
    specialty: { he: "מטבח ישראלי מודרני", en: "Modern Israeli Cuisine" },
    industry: { he: "מזון ואירוח", en: "Food & Hospitality" },
    city: { he: "תל אביב", en: "Tel Aviv" },
    club: "tel-aviv-jaffa",
    clubName: { he: "רוטרי תל אביב יפו", en: "Rotary Tel Aviv Jaffa" },
    memberSince: 2020,
    about: {
      he: "שף מוביל בזירה הקולינרית הישראלית עם מסעדה מצליחה.",
      en: "Leading chef in the Israeli culinary scene with a successful restaurant.",
    },
    expertise: [
      { he: "קולינריה", en: "Culinary Arts" },
      { he: "ניהול מסעדות", en: "Restaurant Management" },
    ],
    helpWith: [
      { he: "ייעוץ קולינרי", en: "Culinary Consulting" },
      { he: "אירועים", en: "Event Catering" },
    ],
    languages: [
      { he: "עברית", en: "Hebrew" },
      { he: "אנגלית", en: "English" },
    ],
    accountType: "member",
  },
  {
    id: "m18",
    name: { he: "דנה ויס", en: "Dana Weiss" },
    position: { he: "עיתונאית בכירה", en: "Senior Journalist" },
    company: "Channel 12 News",
    profession: { he: "עיתונאית", en: "Journalist" },
    specialty: { he: "עיתונות חקירה", en: "Investigative Journalism" },
    industry: { he: "תקשורת", en: "Media" },
    city: { he: "תל אביב", en: "Tel Aviv" },
    club: "tel-aviv",
    clubName: { he: "רוטרי תל אביב", en: "Rotary Tel Aviv" },
    memberSince: 2017,
    about: {
      he: "עיתונאית חקירה ותיקה עם קריירה של 20 שנה בתקשורת.",
      en: "Veteran investigative journalist with 20 years in media.",
    },
    expertise: [
      { he: "עיתונות", en: "Journalism" },
      { he: "יחסי ציבור", en: "Public Relations" },
    ],
    helpWith: [
      { he: "ייעוץ תקשורתי", en: "Media Consulting" },
      { he: "הכנה לראיונות", en: "Interview Preparation" },
    ],
    languages: [
      { he: "עברית", en: "Hebrew" },
      { he: "אנגלית", en: "English" },
    ],
    accountType: "member",
  },
  {
    id: "m19",
    name: { he: "יעקב הלל", en: "Yaakov Hillel" },
    position: { he: "רב ומרצה", en: "Rabbi & Lecturer" },
    company: "Yeshivat Ahavat Shalom",
    profession: { he: "רב", en: "Rabbi" },
    specialty: { he: "קבלה יהודית", en: "Jewish Mysticism" },
    industry: { he: "דת וקהילה", en: "Religion & Community" },
    city: { he: "ירושלים", en: "Jerusalem" },
    club: "jerusalem-hills",
    clubName: { he: "רוטרי הרי ירושלים", en: "Rotary Jerusalem Hills" },
    memberSince: 2011,
    about: {
      he: "רב ומרצה בינלאומי בנושאי יהדות ורוחניות.",
      en: "Rabbi and international lecturer on Judaism and spirituality.",
    },
    expertise: [
      { he: "לימודי יהדות", en: "Jewish Studies" },
      { he: "הנחיית קבוצות", en: "Group Facilitation" },
    ],
    helpWith: [
      { he: "ייעוץ רוחני", en: "Spiritual Guidance" },
      { he: "הרצאות", en: "Lectures" },
    ],
    languages: [
      { he: "עברית", en: "Hebrew" },
      { he: "אנגלית", en: "English" },
      { he: "ארמית", en: "Aramaic" },
    ],
    accountType: "member",
  },
  {
    id: "m20",
    name: { he: "מאיה שפירא", en: "Maya Shapira" },
    position: { he: "מנהלת מחקר ופיתוח", en: "R&D Director" },
    company: "Teva Pharmaceutical",
    profession: { he: "מדענית", en: "Scientist" },
    specialty: { he: "פיתוח תרופות", en: "Drug Development" },
    industry: { he: "פארמה", en: "Pharma" },
    city: { he: "רחובות", en: "Rehovot" },
    club: "rehovot",
    clubName: { he: "רוטרי רחובות", en: "Rotary Rehovot" },
    memberSince: 2016,
    about: {
      he: "מדענית בכירה בתעשיית הפארמה עם פטנטים רבים.",
      en: "Senior scientist in the pharma industry with numerous patents.",
    },
    expertise: [
      { he: "מחקר קליני", en: "Clinical Research" },
      { he: "ביוטכנולוגיה", en: "Biotechnology" },
    ],
    helpWith: [
      { he: "ייעוץ מדעי", en: "Scientific Consulting" },
      { he: "קשרי אקדמיה-תעשייה", en: "Academia-Industry Connections" },
    ],
    languages: [
      { he: "עברית", en: "Hebrew" },
      { he: "אנגלית", en: "English" },
    ],
    accountType: "member",
    isNew: true,
  },
];

export function memberById(id: string) {
  return members.find((m) => m.id === id);
}

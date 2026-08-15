import { members, type Member } from "@/data/members";

export type Facets = {
  company?: string | undefined;
  profession?: string | undefined;
  industry?: string | undefined;
  city?: string | undefined;
  club?: string | undefined;
  accountType?: "member" | "family" | undefined;
};

export type Hit = { member: Member; score: number; reasons: string[] };

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/["'׳״]/g, "")
    .trim();

const STOP = new Set([
  "who","works","at","in","the","a","an","find","someone","some","one","is","for","me","need","i",
  "מי","עובד","עובדת","ב","את","של","מחפש","מחפשת","מישהו","מישהי","יש","עם","צריך",
]);

function tokens(q: string) {
  return norm(q)
    .split(/[\s,.:;?!־-]+/)
    .filter((t) => t.length > 1 && !STOP.has(t));
}

function fieldHits(member: Member, token: string) {
  const reasons: string[] = [];
  let score = 0;
  const push = (weight: number, label: string) => {
    score += weight;
    reasons.push(label);
  };
  const has = (v: string) => norm(v).includes(token);

  if (has(member.company)) push(10, member.company);
  member.expertise.forEach((e) => {
    if (has(e.he) || has(e.en)) push(8, e.en);
  });
  if (has(member.profession.he) || has(member.profession.en)) push(7, member.profession.en);
  if (has(member.specialty.he) || has(member.specialty.en)) push(7, member.specialty.en);
  if (has(member.position.he) || has(member.position.en)) push(6, member.position.en);
  member.helpWith.forEach((h) => {
    if (has(h.he) || has(h.en)) push(5, h.en);
  });
  if (has(member.industry.he) || has(member.industry.en)) push(5, member.industry.en);
  if (has(member.name.he) || has(member.name.en)) push(9, member.name.en);
  if (has(member.city.he) || has(member.city.en)) push(4, member.city.en);
  if (has(member.clubName.he) || has(member.clubName.en)) push(4, member.clubName.en);
  (member.previousEmployers ?? []).forEach((p) => {
    if (has(p)) push(3, p);
  });
  member.languages.forEach((l) => {
    if (has(l.he) || has(l.en)) push(2, l.en);
  });
  return { score, reasons };
}

export function searchMembers(query: string, facets: Facets = {}): Hit[] {
  const list = members.filter((m) => {
    if (facets.company && m.company !== facets.company) return false;
    if (facets.profession && m.profession.en !== facets.profession) return false;
    if (facets.industry && m.industry.en !== facets.industry) return false;
    if (facets.city && m.city.en !== facets.city) return false;
    if (facets.club && m.club !== facets.club) return false;
    if (facets.accountType && m.accountType !== facets.accountType) return false;
    return true;
  });

  const ts = tokens(query);
  if (ts.length === 0) {
    return list.map((member) => ({ member, score: 0, reasons: [] }));
  }

  return list
    .map((member) => {
      let score = 0;
      const reasons = new Set<string>();
      ts.forEach((t) => {
        const r = fieldHits(member, t);
        score += r.score;
        r.reasons.forEach((x) => reasons.add(x));
      });
      return { member, score, reasons: [...reasons].slice(0, 3) };
    })
    .filter((h) => h.score > 0)
    .sort((a, b) => b.score - a.score);
}

export function facetValues() {
  const uniq = <T,>(arr: T[]) => [...new Set(arr)];
  return {
    companies: uniq(members.map((m) => m.company)).sort(),
    professions: uniq(members.map((m) => m.profession.en)).sort(),
    industries: uniq(members.map((m) => m.industry.en)).sort(),
    cities: uniq(members.map((m) => m.city.en)).sort(),
    clubs: uniq(members.map((m) => m.club)).sort(),
  };
}

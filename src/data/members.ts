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

export const members: Member[] = [];

export function memberById(id: string) {
  return members.find((m) => m.id === id);
}

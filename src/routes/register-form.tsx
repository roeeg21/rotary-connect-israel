import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ArrowRight, MessageSquare, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Logo } from "@/components/brand/RotaryMark";
import { clubs } from "@/data/clubs";
import { useAppState } from "@/lib/app-state";
import { useI18n } from "@/lib/i18n";
import { saveUserRegistration } from "@/lib/users.functions";
import type { Child, Job, Person } from "@/lib/user-registration";

// Search params schema for pre-filled data from chatbot
const searchParamsSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  profession: z.string().optional(),
  workplace: z.string().optional(),
  club: z.string().optional(),
});

export const Route = createFileRoute("/register-form")({
  validateSearch: (search) => searchParamsSchema.parse(search),
  head: () => ({
    meta: [
      { title: "שאלון הרשמה — Rotary Connect Israel" },
      {
        name: "description",
        content: "שאלון ההרשמה של רוטרי קונקט ישראל: פרטים אישיים, תעסוקה, בן או בת זוג ומשפחה.",
      },
      { property: "og:title", content: "Registration Questionnaire — Rotary Connect Israel" },
      {
        property: "og:description",
        content: "Create your Rotary Connect Israel profile in four short steps.",
      },
    ],
  }),
  component: RegisterPage,
});

const CHILD_MIN_AGE = 28;
const MAX_AGE = 130;

const emptyJob = (): Job => ({ employer: "", role: "", from: "", to: "", description: "" });
const emptyPerson = (): Person => ({
  gender: "",
  age: "",
  education: "",
  jobs: [emptyJob()],
  boards: "",
  hobbies: "",
});
const emptyChild = (): Child => ({ name: "", dob: "", status: "" });

function calculateAge(dateString: string) {
  if (!dateString) return null;

  const [year, month, day] = dateString.split("-").map(Number);
  if (!year || !month || !day) return null;

  const birthDate = new Date(year, month - 1, day);
  if (
    Number.isNaN(birthDate.getTime()) ||
    birthDate.getFullYear() !== year ||
    birthDate.getMonth() !== month - 1 ||
    birthDate.getDate() !== day
  ) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - year;
  const monthDiff = today.getMonth() - (month - 1);

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < day)) {
    age--;
  }

  return age >= 0 && age < MAX_AGE ? age : null;
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="mt-2">{children}</div>
      {hint && <span className="mt-1.5 block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

const inputCls =
  "h-12 w-full rounded-xl border bg-card px-4 text-[15px] transition-all outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10";

type JobsEditorLabels = {
  position: string;
  removePosition: string;
  employer: string;
  role: string;
  fromDate: string;
  toDate: string;
  jobDescription: string;
  addPosition: string;
};

function JobsEditor({
  jobs,
  onChange,
  labels,
}: {
  jobs: Job[];
  onChange: (jobs: Job[]) => void;
  labels: JobsEditorLabels;
}) {
  const set = (i: number, patch: Partial<Job>) =>
    onChange(jobs.map((j, idx) => (idx === i ? { ...j, ...patch } : j)));

  return (
    <div className="space-y-4">
      {jobs.map((job, i) => (
        <div key={i} className="bg-surface rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold">
              {labels.position} {i + 1}
            </p>
            {jobs.length > 1 && (
              <button
                type="button"
                onClick={() => onChange(jobs.filter((_, idx) => idx !== i))}
                className="text-muted-foreground hover:text-destructive"
                aria-label={labels.removePosition}
              >
                <Trash2 className="size-4" />
              </button>
            )}
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label={labels.employer}>
              <input
                className={inputCls}
                value={job.employer}
                onChange={(e) => set(i, { employer: e.target.value })}
              />
            </Field>
            <Field label={labels.role}>
              <input
                className={inputCls}
                value={job.role}
                onChange={(e) => set(i, { role: e.target.value })}
              />
            </Field>
            <Field label={labels.fromDate}>
              <input
                type="month"
                className={inputCls}
                value={job.from}
                onChange={(e) => set(i, { from: e.target.value })}
              />
            </Field>
            <Field label={labels.toDate}>
              <input
                type="month"
                className={inputCls}
                value={job.to}
                onChange={(e) => set(i, { to: e.target.value })}
              />
            </Field>
          </div>
          <div className="mt-3">
            <Field label={labels.jobDescription}>
              <textarea
                rows={3}
                className="bg-card focus:border-primary w-full rounded-md border border-border p-3 text-sm outline-none"
                value={job.description}
                onChange={(e) => set(i, { description: e.target.value })}
              />
            </Field>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...jobs, emptyJob()])}
        className="hover:bg-secondary inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-semibold"
      >
        <Plus className="size-4" aria-hidden />
        {labels.addPosition}
      </button>
    </div>
  );
}

function RegisterPage() {
  const navigate = useNavigate();
  const { signIn } = useAppState();
  const { lang, dir } = useI18n();
  const searchParams = Route.useSearch();
  const saveUserRegistrationFn = useServerFn(saveUserRegistration);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const he = lang === "he";
  const tr = (heText: string, enText: string) => (he ? heText : enText);
  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;

  // Step 1 - pre-fill from search params if available
  const [firstName, setFirstName] = useState(searchParams.firstName || "");
  const [lastName, setLastName] = useState(searchParams.lastName || "");
  const [email, setEmail] = useState(searchParams.email || "");
  const [dob, setDob] = useState("");
  const [club, setClub] = useState(searchParams.club || "");
  const [customClub, setCustomClub] = useState("");
  const [joinYear, setJoinYear] = useState("");
  const [facebook, setFacebook] = useState("");
  const [instagram, setInstagram] = useState("");
  const [linkedin, setLinkedin] = useState("");

  // Step 2 - pre-fill profession/workplace if available
  const [me, setMe] = useState<Person>(() => {
    const initial = emptyPerson();
    if (searchParams.profession || searchParams.workplace) {
      initial.jobs = [{
        employer: searchParams.workplace || "",
        role: searchParams.profession || "",
        from: "",
        to: "",
        description: "",
      }];
    }
    return initial;
  });

  // Step 3
  const [married, setMarried] = useState<"yes" | "no" | "">("");
  const [spouse, setSpouse] = useState<Person>(emptyPerson());

  // Step 4
  const [children, setChildren] = useState<Child[]>([]);

  const age = useMemo(() => calculateAge(dob), [dob]);

  const years = useMemo(() => {
    const y = new Date().getFullYear();
    return Array.from({ length: 70 }, (_, i) => y - i);
  }, []);

  function setChild(i: number, patch: Partial<Child>) {
    setChildren((cs) => cs.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  }

  function onChildDob(i: number, value: string) {
    const childAge = calculateAge(value);
    if (childAge !== null && childAge < CHILD_MIN_AGE) {
      toast.error(
        tr(
          `מטעמי פרטיות והגנה, לא ניתן להזין פרטים לגבי ילדים מתחת לגיל ${CHILD_MIN_AGE}.`,
          `For privacy and safeguarding reasons, details of children under ${CHILD_MIN_AGE} cannot be entered.`,
        ),
      );
      setChild(i, { dob: value, status: "" });
      return;
    }
    setChild(i, { dob: value });
  }

  function next() {
    if (step === 1) {
      if (!firstName || !lastName || !email || !dob || (!club && !customClub) || !joinYear) {
        toast.error(tr("נא להשלים את כל הפרטים האישיים.", "Please complete all personal details."));
        return;
      }
    }
    if (step === 3 && married === "") {
      toast.error(tr("נא לציין אם יש בן או בת זוג.", "Please indicate whether you are married."));
      return;
    }
    setStep((s) => Math.min(4, s + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function finish() {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      await saveUserRegistrationFn({
        data: {
          firstName,
          lastName,
          email,
          dob,
          clubId: club,
          customClub,
          joinYear,
          socialProfiles: {
            facebook,
            instagram,
            linkedin,
          },
          me,
          married,
          spouse: married === "yes" ? spouse : null,
          children,
          onboarded: true,
        },
      });

      signIn({
        firstName,
        lastName,
        email,
        club: club || customClub,
        onboarded: true,
      });
      toast.success(tr("ברוכים הבאים לרשת", "Welcome to the network"));
      await navigate({ to: "/" });
    } catch (error) {
      console.error(error);
      toast.error(
        tr(
          "שמירת ההרשמה נכשלה. בדקו את חיבור מסד הנתונים ונסו שוב.",
          "We couldn't save your registration. Please check the database connection and try again.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const steps = [
    tr("אישי", "Personal"),
    tr("תעסוקה", "Employment"),
    tr("בן או בת זוג", "Spouse"),
    tr("משפחה", "Family"),
  ];
  const jobLabels = {
    position: tr("משרה", "Position"),
    removePosition: tr("הסרת משרה", "Remove position"),
    employer: tr("מעסיק", "Employer"),
    role: tr("תפקיד / שם המשרה", "Role / job title"),
    fromDate: tr("מתאריך", "From date"),
    toDate: tr("עד תאריך", "To date"),
    jobDescription: tr("תיאור התפקיד", "Job description"),
    addPosition: tr("הוספת משרה", "Add position"),
  };

  return (
    <div className="container-narrow py-10 sm:py-14" dir={dir}>
      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center">
          <Logo size="lg" />
        </div>
        <h1 className="mt-6 text-2xl font-bold tracking-tight sm:text-3xl">
          {tr("יצירת הפרופיל שלך", "Create your profile")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {tr("ארבעה שלבים קצרים · בערך 3 דקות", "Four short steps · about 3 minutes")}
        </p>

        {/* Switch to chat registration */}
        <div className="mt-4">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
          >
            <MessageSquare className="size-4" />
            {tr("מעדיפים הרשמה בשיחה? לחצו כאן", "Prefer chat registration? Click here")}
            <Arrow className="size-4" />
          </Link>
        </div>
      </div>

      {/* Progress Steps */}
      <ol className="mt-8 grid grid-cols-4 gap-3" aria-label={tr("התקדמות", "Progress")}>
        {steps.map((label, i) => (
          <li key={label} className="text-center">
            <div
              className={`h-1 rounded-full transition-colors ${i + 1 <= step ? "bg-primary" : "bg-border"}`}
              aria-hidden
            />
            <span
              className={`mt-2 block text-[11px] font-semibold transition-colors ${
                i + 1 === step ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {label}
            </span>
          </li>
        ))}
      </ol>

      {/* Form Card */}
      <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
        <div className="space-y-6">
        {step === 1 && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={tr("שם פרטי", "First name")}>
                <input
                  className={inputCls}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </Field>
              <Field label={tr("שם משפחה", "Last name")}>
                <input
                  className={inputCls}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </Field>
              <Field label={tr('דוא"ל', "Email")}>
                <input
                  type="email"
                  className={inputCls}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <Field
                label={tr("תאריך לידה", "Date of birth")}
                {...(age !== null ? { hint: tr(`גיל נוכחי: ${age}`, `Current age: ${age}`) } : {})}
              >
                <input
                  type="date"
                  className={inputCls}
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                />
              </Field>
              <Field label={tr("שם מועדון הרוטרי", "Rotary club name")}>
                <select className={inputCls} value={club} onChange={(e) => setClub(e.target.value)}>
                  <option value="">{tr("בחרו את המועדון שלכם", "Select your club")}</option>
                  {clubs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c[lang]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={tr("שנת ההצטרפות לרוטרי", "Year you joined Rotary")}>
                <select
                  className={inputCls}
                  value={joinYear}
                  onChange={(e) => setJoinYear(e.target.value)}
                >
                  <option value="">{tr("בחרו שנה", "Select year")}</option>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field
              label={tr("המועדון לא מופיע? הוסיפו את שמו", "Club not listed? Add your club name")}
              hint={tr(
                "פרטי המועדון ייבדקו על ידי הנהלת המחוז.",
                "Your club will be reviewed by the district administrator.",
              )}
            >
              <input
                className={inputCls}
                value={customClub}
                onChange={(e) => setCustomClub(e.target.value)}
                placeholder={tr("לדוגמה: רוטרי כפר ורדים", "e.g. Rotary Kfar Vradim")}
              />
            </Field>
            <h2 className="font-heading text-base font-bold">
              {tr("פרטי רשתות חברתיות", "Social profiles")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Facebook">
                <input
                  className={inputCls}
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  placeholder={tr("שם משתמש", "username")}
                />
              </Field>
              <Field label="Instagram">
                <input
                  className={inputCls}
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder={tr("שם משתמש", "username")}
                />
              </Field>
              <Field label="LinkedIn">
                <input
                  className={inputCls}
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  placeholder={tr("שם משתמש", "username")}
                />
              </Field>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="font-heading text-base font-bold">
              {tr(
                "היסטוריית התעסוקה שלך (5 השנים האחרונות)",
                "Your employment history (last 5 years)",
              )}
            </h2>
            <JobsEditor
              jobs={me.jobs}
              onChange={(jobs) => setMe({ ...me, jobs })}
              labels={jobLabels}
            />
            <Field label={tr("השכלה", "Education")}>
              <input
                className={inputCls}
                value={me.education}
                onChange={(e) => setMe({ ...me, education: e.target.value })}
                placeholder={tr("תואר, מוסד לימודים, שנה", "Degree, institution, year")}
              />
            </Field>
            <Field
              label={tr(
                "דירקטוריונים, עמותות או פעילות חברתית",
                "Boards, associations or social activity",
              )}
            >
              <textarea
                rows={3}
                className="bg-card focus:border-primary w-full rounded-md border border-border p-3 text-sm outline-none"
                value={me.boards}
                onChange={(e) => setMe({ ...me, boards: e.target.value })}
              />
            </Field>
            <Field label={tr("תחביבים", "Hobbies")}>
              <input
                className={inputCls}
                value={me.hobbies}
                onChange={(e) => setMe({ ...me, hobbies: e.target.value })}
              />
            </Field>
          </>
        )}

        {step === 3 && (
          <>
            <Field label={tr("האם יש לך בן או בת זוג?", "Are you married / with a partner?")}>
              <div className="flex gap-2">
                {(["yes", "no"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setMarried(v)}
                    className={`h-11 flex-1 rounded-md border text-sm font-semibold ${
                      lang === "en" ? "capitalize " : ""
                    }${
                      married === v
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border"
                    }`}
                  >
                    {v === "yes" ? tr("כן", "yes") : tr("לא", "no")}
                  </button>
                ))}
              </div>
            </Field>

            {married === "yes" && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={tr("מגדר", "Gender")}>
                    <select
                      className={inputCls}
                      value={spouse.gender}
                      onChange={(e) => setSpouse({ ...spouse, gender: e.target.value })}
                    >
                      <option value="">{tr("בחרו", "Select")}</option>
                      <option value="female">{tr("אישה", "Female")}</option>
                      <option value="male">{tr("גבר", "Male")}</option>
                      <option value="other">
                        {tr("אחר / מעדיפ/ה לא לציין", "Other / prefer not to say")}
                      </option>
                    </select>
                  </Field>
                  <Field label={tr("גיל", "Age")}>
                    <input
                      type="number"
                      min={18}
                      className={inputCls}
                      value={spouse.age}
                      onChange={(e) => setSpouse({ ...spouse, age: e.target.value })}
                    />
                  </Field>
                </div>
                <h2 className="font-heading text-base font-bold">
                  {tr(
                    "היסטוריית התעסוקה של בן/בת הזוג (5 השנים האחרונות)",
                    "Partner employment history (last 5 years)",
                  )}
                </h2>
                <JobsEditor
                  jobs={spouse.jobs}
                  onChange={(jobs) => setSpouse({ ...spouse, jobs })}
                  labels={jobLabels}
                />
                <Field label={tr("השכלה", "Education")}>
                  <input
                    className={inputCls}
                    value={spouse.education}
                    onChange={(e) => setSpouse({ ...spouse, education: e.target.value })}
                  />
                </Field>
                <Field
                  label={tr(
                    "דירקטוריונים, עמותות או פעילות חברתית",
                    "Boards, associations or social activity",
                  )}
                >
                  <textarea
                    rows={3}
                    className="bg-card focus:border-primary w-full rounded-md border border-border p-3 text-sm outline-none"
                    value={spouse.boards}
                    onChange={(e) => setSpouse({ ...spouse, boards: e.target.value })}
                  />
                </Field>
                <Field label={tr("תחביבים", "Hobbies")}>
                  <input
                    className={inputCls}
                    value={spouse.hobbies}
                    onChange={(e) => setSpouse({ ...spouse, hobbies: e.target.value })}
                  />
                </Field>
              </>
            )}
          </>
        )}

        {step === 4 && (
          <>
            <div>
              <h2 className="font-heading text-base font-bold">
                {tr("שאלון ילדים", "Children questionnaire")}
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                {tr(
                  "הוסיפו את שם הילד או הילדה ואת תאריך הלידה. הגיל יחושב אוטומטית.",
                  "Add each child's name and date of birth. Age is calculated automatically.",
                )}
              </p>
            </div>
            <Field label={tr("מספר הילדים", "Number of children")}>
              <select
                className={inputCls}
                value={String(children.length)}
                onChange={(e) =>
                  setChildren(
                    Array.from(
                      { length: Number(e.target.value) },
                      (_, i) => children[i] ?? emptyChild(),
                    ),
                  )
                }
              >
                {Array.from({ length: 11 }, (_, i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </Field>

            {children.map((child, i) => {
              const childAge = calculateAge(child.dob);
              const blocked = childAge !== null && childAge < CHILD_MIN_AGE;
              const canShareChildDetails = childAge !== null && childAge >= CHILD_MIN_AGE;
              return (
                <div key={i} className="bg-surface rounded-lg border border-border p-4">
                  <p className="text-xs font-semibold">
                    {tr("ילד/ה", "Child")} {i + 1}
                  </p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <Field label={tr("שם", "Name")}>
                      <input
                        className={inputCls}
                        value={child.name}
                        onChange={(e) => setChild(i, { name: e.target.value })}
                        placeholder={tr("שם מלא", "Full name")}
                      />
                    </Field>
                    <Field
                      label={tr("תאריך לידה", "Date of birth")}
                      hint={
                        childAge !== null
                          ? tr(`גיל נוכחי: ${childAge}`, `Current age: ${childAge}`)
                          : undefined
                      }
                    >
                      <input
                        type="date"
                        className={inputCls}
                        value={child.dob}
                        onChange={(e) => onChildDob(i, e.target.value)}
                      />
                    </Field>
                    <Field label={tr("גיל", "Age")}>
                      <input
                        readOnly
                        className={inputCls}
                        value={childAge ?? ""}
                        placeholder={tr("מחושב אוטומטית", "Calculated automatically")}
                      />
                    </Field>
                  </div>
                  <div className="mt-3 grid gap-3">
                    <Field
                      label={tr(
                        "עיסוק נוכחי (לימודים / עבודה)",
                        "Current situation (studies / work)",
                      )}
                    >
                      <input
                        className={inputCls}
                        disabled={!canShareChildDetails}
                        value={child.status}
                        onChange={(e) => setChild(i, { status: e.target.value })}
                        placeholder={
                          canShareChildDetails
                            ? tr(
                                "לדוגמה: מהנדס/ת תוכנה באינטל / תואר ראשון באוניברסיטת תל אביב",
                                "e.g. Software engineer at Intel / BA at Tel Aviv University",
                              )
                            : tr(
                                "הזינו תאריך לידה של ילד/ה בוגר/ת כדי לפתוח את השדה",
                                "Enter date of birth for an adult child to unlock this field",
                              )
                        }
                      />
                    </Field>
                  </div>
                  {blocked && (
                    <p className="text-destructive mt-2 text-xs font-medium">
                      {tr(
                        `מטעמי פרטיות והגנה, לא ניתן להזין פרטים לגבי ילדים מתחת לגיל ${CHILD_MIN_AGE}.`,
                        `For privacy and safeguarding reasons, details of children under ${CHILD_MIN_AGE} cannot be entered.`,
                      )}
                    </p>
                  )}
                </div>
              );
            })}
          </>
        )}
        </div>

        {/* Form Navigation */}
        <div className="mt-8 flex items-center justify-between gap-4 border-t border-border pt-6">
          <button
            type="button"
            disabled={step === 1 || isSubmitting}
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            className="rounded-xl border border-border px-5 py-3 text-sm font-semibold transition-all hover:bg-secondary disabled:opacity-40"
          >
            {tr("חזרה", "Back")}
          </button>
          {step < 4 ? (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={next}
              className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-raised disabled:opacity-60"
            >
              {tr("המשך", "Continue")}
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={finish}
              className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-raised disabled:opacity-60"
            >
              {isSubmitting ? tr("שומר...", "Saving...") : tr("סיום", "Finish")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

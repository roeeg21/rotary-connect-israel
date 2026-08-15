import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Logo } from "@/components/brand/RotaryMark";
import { clubs } from "@/data/clubs";
import { useAppState } from "@/lib/app-state";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Register — Rotary Connect Israel" },
      {
        name: "description",
        content:
          "Join Rotary Connect Israel: personal details, employment history, spouse and family information.",
      },
      { property: "og:title", content: "Register — Rotary Connect Israel" },
      {
        property: "og:description",
        content: "Create your Rotary Connect Israel profile in four short steps.",
      },
    ],
  }),
  component: RegisterPage,
});

const CHILD_MIN_AGE = 28;

type Job = { employer: string; role: string; from: string; to: string; description: string };
type Person = {
  gender: string;
  age: string;
  education: string;
  jobs: Job[];
  boards: string;
  hobbies: string;
};
type Child = { age: string; status: string };

const emptyJob = (): Job => ({ employer: "", role: "", from: "", to: "", description: "" });
const emptyPerson = (): Person => ({
  gender: "",
  age: "",
  education: "",
  jobs: [emptyJob()],
  boards: "",
  hobbies: "",
});

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
      <span className="text-muted-foreground text-xs font-semibold">{label}</span>
      <div className="mt-1.5">{children}</div>
      {hint && <span className="text-muted-foreground mt-1 block text-xs">{hint}</span>}
    </label>
  );
}

const inputCls =
  "bg-card focus:border-primary h-11 w-full rounded-md border border-border px-3 text-sm outline-none";

function JobsEditor({ jobs, onChange }: { jobs: Job[]; onChange: (jobs: Job[]) => void }) {
  const set = (i: number, patch: Partial<Job>) =>
    onChange(jobs.map((j, idx) => (idx === i ? { ...j, ...patch } : j)));

  return (
    <div className="space-y-4">
      {jobs.map((job, i) => (
        <div key={i} className="bg-surface rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold">Position {i + 1}</p>
            {jobs.length > 1 && (
              <button
                type="button"
                onClick={() => onChange(jobs.filter((_, idx) => idx !== i))}
                className="text-muted-foreground hover:text-destructive"
                aria-label="Remove position"
              >
                <Trash2 className="size-4" />
              </button>
            )}
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="Employer">
              <input
                className={inputCls}
                value={job.employer}
                onChange={(e) => set(i, { employer: e.target.value })}
              />
            </Field>
            <Field label="Role / job title">
              <input
                className={inputCls}
                value={job.role}
                onChange={(e) => set(i, { role: e.target.value })}
              />
            </Field>
            <Field label="From date">
              <input
                type="month"
                className={inputCls}
                value={job.from}
                onChange={(e) => set(i, { from: e.target.value })}
              />
            </Field>
            <Field label="To date">
              <input
                type="month"
                className={inputCls}
                value={job.to}
                onChange={(e) => set(i, { to: e.target.value })}
              />
            </Field>
          </div>
          <div className="mt-3">
            <Field label="Job description">
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
        Add position
      </button>
    </div>
  );
}

function RegisterPage() {
  const navigate = useNavigate();
  const { signIn } = useAppState();
  const [step, setStep] = useState(1);

  // Step 1
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [club, setClub] = useState("");
  const [customClub, setCustomClub] = useState("");
  const [joinYear, setJoinYear] = useState("");

  // Step 2
  const [me, setMe] = useState<Person>(emptyPerson());

  // Step 3
  const [married, setMarried] = useState<"yes" | "no" | "">("");
  const [spouse, setSpouse] = useState<Person>(emptyPerson());

  // Step 4
  const [children, setChildren] = useState<Child[]>([]);
  const [facebook, setFacebook] = useState("");
  const [instagram, setInstagram] = useState("");
  const [linkedin, setLinkedin] = useState("");

  const age = useMemo(() => {
    if (!dob) return null;
    const d = new Date(dob);
    if (Number.isNaN(d.getTime())) return null;
    const now = new Date();
    let a = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--;
    return a >= 0 && a < 130 ? a : null;
  }, [dob]);

  const years = useMemo(() => {
    const y = new Date().getFullYear();
    return Array.from({ length: 70 }, (_, i) => y - i);
  }, []);

  function setChild(i: number, patch: Partial<Child>) {
    setChildren((cs) => cs.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  }

  function onChildAge(i: number, value: string) {
    const n = Number(value);
    if (value && !Number.isNaN(n) && n < CHILD_MIN_AGE) {
      toast.error(
        `For privacy and safeguarding reasons, details of children under ${CHILD_MIN_AGE} cannot be entered.`,
      );
      setChild(i, { age: value, status: "" });
      return;
    }
    setChild(i, { age: value });
  }

  function next() {
    if (step === 1) {
      if (!firstName || !lastName || !email || !dob || (!club && !customClub) || !joinYear) {
        toast.error("Please complete all personal details.");
        return;
      }
    }
    if (step === 3 && married === "") {
      toast.error("Please indicate whether you are married.");
      return;
    }
    setStep((s) => Math.min(4, s + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function finish() {
    signIn({
      firstName,
      lastName,
      email,
      club: club || customClub,
      onboarded: true,
    });
    toast.success("Welcome to the network");
    void navigate({ to: "/" });
  }

  const steps = ["Personal", "Employment", "Spouse", "Family"];

  return (
    <div className="container-app max-w-2xl py-8 sm:py-12" dir="ltr">
      <div className="flex justify-center">
        <Logo size="lg" />
      </div>
      <h1 className="mt-6 text-center font-heading text-2xl font-bold">Create your profile</h1>
      <p className="text-muted-foreground mt-1 text-center text-sm">
        Four short steps · about 3 minutes
      </p>

      <ol className="mt-6 grid grid-cols-4 gap-2" aria-label="Progress">
        {steps.map((label, i) => (
          <li key={label}>
            <div
              className={`h-1 rounded-full ${i + 1 <= step ? "bg-primary" : "bg-border"}`}
              aria-hidden
            />
            <span
              className={`mt-2 block text-[11px] font-semibold ${
                i + 1 === step ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {label}
            </span>
          </li>
        ))}
      </ol>

      <div className="mt-8 space-y-5">
        {step === 1 && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="First name">
                <input
                  className={inputCls}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </Field>
              <Field label="Last name">
                <input
                  className={inputCls}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  className={inputCls}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <Field
                label="Date of birth"
                {...(age !== null ? { hint: `Current age: ${age}` } : {})}
              >
                <input
                  type="date"
                  className={inputCls}
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                />
              </Field>
              <Field label="Rotary club name">
                <select
                  className={inputCls}
                  value={club}
                  onChange={(e) => setClub(e.target.value)}
                >
                  <option value="">Select your club</option>
                  {clubs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.en} — {c.he}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Year you joined Rotary">
                <select
                  className={inputCls}
                  value={joinYear}
                  onChange={(e) => setJoinYear(e.target.value)}
                >
                  <option value="">Select year</option>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field
              label="Club not listed? Add your club name"
              hint="Your club will be reviewed by the district administrator."
            >
              <input
                className={inputCls}
                value={customClub}
                onChange={(e) => setCustomClub(e.target.value)}
                placeholder="e.g. Rotary Kfar Vradim"
              />
            </Field>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="font-heading text-base font-bold">
              Your employment history (last 5 years)
            </h2>
            <JobsEditor jobs={me.jobs} onChange={(jobs) => setMe({ ...me, jobs })} />
            <Field label="Education">
              <input
                className={inputCls}
                value={me.education}
                onChange={(e) => setMe({ ...me, education: e.target.value })}
                placeholder="Degree, institution, year"
              />
            </Field>
            <Field label="Boards, associations or social activity">
              <textarea
                rows={3}
                className="bg-card focus:border-primary w-full rounded-md border border-border p-3 text-sm outline-none"
                value={me.boards}
                onChange={(e) => setMe({ ...me, boards: e.target.value })}
              />
            </Field>
            <Field label="Hobbies">
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
            <Field label="Are you married / with a partner?">
              <div className="flex gap-2">
                {(["yes", "no"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setMarried(v)}
                    className={`h-11 flex-1 rounded-md border text-sm font-semibold capitalize ${
                      married === v
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </Field>

            {married === "yes" && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Gender">
                    <select
                      className={inputCls}
                      value={spouse.gender}
                      onChange={(e) => setSpouse({ ...spouse, gender: e.target.value })}
                    >
                      <option value="">Select</option>
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                      <option value="other">Other / prefer not to say</option>
                    </select>
                  </Field>
                  <Field label="Age">
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
                  Partner employment history (last 5 years)
                </h2>
                <JobsEditor
                  jobs={spouse.jobs}
                  onChange={(jobs) => setSpouse({ ...spouse, jobs })}
                />
                <Field label="Education">
                  <input
                    className={inputCls}
                    value={spouse.education}
                    onChange={(e) => setSpouse({ ...spouse, education: e.target.value })}
                  />
                </Field>
                <Field label="Boards, associations or social activity">
                  <textarea
                    rows={3}
                    className="bg-card focus:border-primary w-full rounded-md border border-border p-3 text-sm outline-none"
                    value={spouse.boards}
                    onChange={(e) => setSpouse({ ...spouse, boards: e.target.value })}
                  />
                </Field>
                <Field label="Hobbies">
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
            <Field label="Number of children">
              <select
                className={inputCls}
                value={String(children.length)}
                onChange={(e) =>
                  setChildren(
                    Array.from(
                      { length: Number(e.target.value) },
                      (_, i) => children[i] ?? { age: "", status: "" },
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
              const blocked = child.age !== "" && Number(child.age) < CHILD_MIN_AGE;
              return (
                <div key={i} className="bg-surface rounded-lg border border-border p-4">
                  <p className="text-xs font-semibold">Child {i + 1}</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <Field label="Age">
                      <input
                        type="number"
                        min={0}
                        className={inputCls}
                        value={child.age}
                        onChange={(e) => onChildAge(i, e.target.value)}
                      />
                    </Field>
                    <Field label="Current situation (studies / work)">
                      <input
                        className={inputCls}
                        disabled={blocked}
                        value={child.status}
                        onChange={(e) => setChild(i, { status: e.target.value })}
                        placeholder="e.g. Software engineer at Intel / BA at Tel Aviv University"
                      />
                    </Field>
                  </div>
                  {blocked && (
                    <p className="text-destructive mt-2 text-xs font-medium">
                      For privacy and safeguarding reasons, details of children under{" "}
                      {CHILD_MIN_AGE} cannot be entered.
                    </p>
                  )}
                </div>
              );
            })}

            <h2 className="font-heading text-base font-bold">Social profiles</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Facebook">
                <input
                  className={inputCls}
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  placeholder="username"
                />
              </Field>
              <Field label="Instagram">
                <input
                  className={inputCls}
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="username"
                />
              </Field>
              <Field label="LinkedIn">
                <input
                  className={inputCls}
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  placeholder="username"
                />
              </Field>
            </div>
          </>
        )}
      </div>

      <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-5">
        <button
          type="button"
          disabled={step === 1}
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          className="hover:bg-secondary rounded-md border border-border px-4 py-2.5 text-sm font-semibold disabled:opacity-40"
        >
          Back
        </button>
        {step < 4 ? (
          <button
            type="button"
            onClick={next}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-6 py-2.5 text-sm font-semibold"
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            onClick={finish}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-6 py-2.5 text-sm font-semibold"
          >
            Finish
          </button>
        )}
      </div>
    </div>
  );
}

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  GraduationCap,
  Heart,
  Lock,
  MessageSquare,
  Plus,
  Shield,
  Sparkles,
  Trash2,
  User,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Logo } from "@/components/brand/RotaryMark";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { clubs } from "@/data/clubs";
import { useAppState } from "@/lib/app-state";
import { useI18n } from "@/lib/i18n";
import {
  type RegistrationData,
  type RegistrationStep,
  type EducationRecord,
  type EmploymentRecord,
  type RotaryPosition,
  type Child,
  REGISTRATION_STEPS,
  STEP_CONFIGS,
  EMPLOYMENT_STATUS_LABELS,
  EDUCATION_LEVEL_LABELS,
  MILITARY_FRAMEWORK_LABELS,
  INTEREST_CATEGORY_LABELS,
  calculateAge,
  MIN_CHILD_AGE,
  educationLevelOptions,
  employmentStatusOptions,
  militaryFrameworkOptions,
  interestCategoryOptions,
  rotaryPositionLevelOptions,
  ROTARY_POSITION_LEVEL_LABELS,
} from "@/lib/registration-schema";
import {
  createDraft,
  updateDraft,
  completeRegistration,
  getDraftByEmail,
} from "@/lib/registration.functions";
import { generateId } from "@/lib/utils";

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
  draftId: z.string().optional(),
});

export const Route = createFileRoute("/register-form")({
  validateSearch: (search) => searchParamsSchema.parse(search),
  head: () => ({
    meta: [
      { title: "שאלון הרשמה — Rotary Connect Israel" },
      {
        name: "description",
        content: "שאלון ההרשמה של רוטרי קונקט ישראל: תשעה שלבים לבניית הפרופיל המקצועי שלך.",
      },
      { property: "og:title", content: "Registration Questionnaire — Rotary Connect Israel" },
      {
        property: "og:description",
        content: "Create your Rotary Connect Israel profile in nine comprehensive steps.",
      },
    ],
  }),
  component: RegisterPage,
});

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function Field({
  label,
  children,
  hint,
  required,
  error,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  required?: boolean;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">
        {label}
        {required && <span className="text-destructive ms-1">*</span>}
      </span>
      <div className="mt-2">{children}</div>
      {hint && <span className="mt-1.5 block text-xs text-muted-foreground">{hint}</span>}
      {error && <span className="mt-1.5 block text-xs text-destructive">{error}</span>}
    </label>
  );
}

const inputCls =
  "h-12 w-full rounded-xl border bg-card px-4 text-[15px] transition-all outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10";

const selectCls = inputCls;

// ============================================================================
// STEP ICONS
// ============================================================================

const STEP_ICONS: Record<RegistrationStep, React.ReactNode> = {
  personal: <User className="size-5" />,
  rotary: <Sparkles className="size-5" />,
  professional: <Briefcase className="size-5" />,
  education: <GraduationCap className="size-5" />,
  military: <Shield className="size-5" />,
  interests: <Heart className="size-5" />,
  spouse: <Users className="size-5" />,
  children: <Users className="size-5" />,
  review: <Check className="size-5" />,
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function RegisterPage() {
  const navigate = useNavigate();
  const { signIn } = useAppState();
  const { lang, dir } = useI18n();
  const searchParams = Route.useSearch();

  // Server functions
  const createDraftFn = useServerFn(createDraft);
  const updateDraftFn = useServerFn(updateDraft);
  const completeRegistrationFn = useServerFn(completeRegistration);
  const getDraftByEmailFn = useServerFn(getDraftByEmail);

  const he = lang === "he";
  const tr = useCallback((heText: string, enText: string) => (he ? heText : enText), [he]);
  const isRTL = dir === "rtl";
  const NavArrow = isRTL ? ChevronRight : ChevronLeft;
  const ForwardArrow = isRTL ? ArrowLeft : ArrowRight;

  // Form state
  const [currentStep, setCurrentStep] = useState<RegistrationStep>("personal");
  const [draftId, setDraftId] = useState<string | null>(searchParams.draftId || null);
  const [isLoading, setIsLoading] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<RegistrationStep[]>([]);

  // Password setup state (for final step)
  const [showPasswordSetup, setShowPasswordSetup] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Form data - initialized from search params
  const [formData, setFormData] = useState<Partial<RegistrationData>>(() => ({
    firstName: searchParams.firstName || "",
    lastName: searchParams.lastName || "",
    email: searchParams.email || "",
    phone: searchParams.phone || "",
    city: searchParams.city || "",
    clubId: searchParams.club || "",
    currentEmployment: searchParams.profession || searchParams.workplace ? {
      role: searchParams.profession || "",
      employer: searchParams.workplace || "",
    } : undefined,
    registrationMethod: "form",
  }));

  // Update form data helper
  const updateFormData = useCallback((updates: Partial<RegistrationData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  // Current step index
  const currentStepIndex = REGISTRATION_STEPS.indexOf(currentStep);
  const currentStepConfig = STEP_CONFIGS.find((s) => s.id === currentStep);

  // Calculate progress percentage
  const progress = Math.round(((currentStepIndex + 1) / REGISTRATION_STEPS.length) * 100);

  // Years for dropdowns
  const years = useMemo(() => {
    const y = new Date().getFullYear();
    return Array.from({ length: 70 }, (_, i) => y - i);
  }, []);

  // Auto-save draft periodically
  useEffect(() => {
    if (!draftId || !formData.email) return;

    const timer = setTimeout(async () => {
      try {
        await updateDraftFn({
          data: {
            id: draftId,
            updates: {
              data: formData,
              currentStep,
              completedSteps,
            },
          },
        });
      } catch (error) {
        console.error("Auto-save failed:", error);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [formData, draftId, currentStep, completedSteps, updateDraftFn]);

  // Navigation functions
  const goToStep = useCallback((step: RegistrationStep) => {
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const goNext = useCallback(() => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < REGISTRATION_STEPS.length) {
      // Mark current step as completed
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps((prev) => [...prev, currentStep]);
      }
      goToStep(REGISTRATION_STEPS[nextIndex]);
    }
  }, [currentStepIndex, currentStep, completedSteps, goToStep]);

  const goBack = useCallback(() => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      goToStep(REGISTRATION_STEPS[prevIndex]);
    }
  }, [currentStepIndex, goToStep]);

  // Validation for current step
  const validateCurrentStep = useCallback((): boolean => {
    switch (currentStep) {
      case "personal":
        if (!formData.firstName?.trim()) {
          toast.error(tr("נא להזין שם פרטי", "Please enter first name"));
          return false;
        }
        if (!formData.lastName?.trim()) {
          toast.error(tr("נא להזין שם משפחה", "Please enter last name"));
          return false;
        }
        if (!formData.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          toast.error(tr("נא להזין כתובת דוא״ל תקינה", "Please enter a valid email address"));
          return false;
        }
        return true;

      case "rotary":
        if (!formData.clubId && !formData.customClub?.trim()) {
          toast.error(tr("נא לבחור מועדון רוטרי", "Please select a Rotary club"));
          return false;
        }
        if (!formData.joinYear?.trim()) {
          toast.error(tr("נא לבחור שנת הצטרפות", "Please select join year"));
          return false;
        }
        return true;

      case "review":
        if (!formData.consent?.dataAccuracy) {
          toast.error(tr("נא לאשר את נכונות הפרטים", "Please confirm data accuracy"));
          return false;
        }
        if (!formData.consent?.privacyNotice) {
          toast.error(tr("נא לאשר את מדיניות הפרטיות", "Please accept privacy policy"));
          return false;
        }
        return true;

      default:
        return true;
    }
  }, [currentStep, formData, tr]);

  // Handle next button click
  const handleNext = useCallback(async () => {
    if (!validateCurrentStep()) return;

    // Create draft if this is the first step and we don't have one
    if (currentStep === "personal" && !draftId && formData.email) {
      setIsLoading(true);
      try {
        // Check for existing draft
        const existingDraft = await getDraftByEmailFn({ data: { email: formData.email } });
        if (existingDraft) {
          // Resume existing draft
          setDraftId(existingDraft.id);
          setFormData((prev) => ({ ...prev, ...existingDraft.data }));
          setCompletedSteps(existingDraft.completedSteps);
          toast.info(tr("נמצאה הרשמה קודמת - ממשיכים ממנה", "Found previous registration - resuming"));
        } else {
          // Create new draft
          const draft = await createDraftFn({
            data: {
              method: "form",
              email: formData.email,
              initialData: formData,
            },
          });
          setDraftId(draft.id);
        }
      } catch (error) {
        console.error("Failed to create draft:", error);
      } finally {
        setIsLoading(false);
      }
    }

    // If on review step, show password setup
    if (currentStep === "review") {
      setShowPasswordSetup(true);
      return;
    }

    goNext();
  }, [currentStep, draftId, formData, validateCurrentStep, getDraftByEmailFn, createDraftFn, goNext, tr]);

  // Handle password submission and final registration
  const handlePasswordSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (password.length < 6) {
      setPasswordError(tr("הסיסמה חייבת להכיל לפחות 6 תווים", "Password must be at least 6 characters"));
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError(tr("הסיסמאות אינן תואמות", "Passwords do not match"));
      return;
    }

    setIsLoading(true);

    try {
      if (draftId) {
        // Save final data and complete registration
        await updateDraftFn({
          data: {
            id: draftId,
            updates: {
              data: formData,
              completedSteps: [...completedSteps, "review"],
            },
          },
        });

        const result = await completeRegistrationFn({
          data: { draftId, password },
        });

        if (!result.success) {
          throw new Error(result.error || "Registration failed");
        }
      }

      // Sign in the user
      signIn({
        firstName: formData.firstName || "",
        lastName: formData.lastName || "",
        email: formData.email || "",
        club: formData.customClub || formData.clubId || "",
        onboarded: true,
      });

      toast.success(tr("ברוכים הבאים לרשת!", "Welcome to the network!"));
      await navigate({ to: "/me" });
    } catch (error) {
      console.error("Registration failed:", error);
      setPasswordError(tr("אירעה שגיאה. נסו שוב.", "An error occurred. Please try again."));
    } finally {
      setIsLoading(false);
    }
  }, [password, confirmPassword, draftId, formData, completedSteps, updateDraftFn, completeRegistrationFn, signIn, navigate, tr]);

  // Password setup screen
  if (showPasswordSetup) {
    return (
      <div className="container-narrow py-10 sm:py-14" dir={dir}>
        <div className="mx-auto max-w-md">
          <div className="mb-6 flex justify-center">
            <div className="flex size-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <Check className="size-10 text-green-600 dark:text-green-400" />
            </div>
          </div>

          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-foreground">
              {tr(`ברוך הבא, ${formData.firstName}!`, `Welcome, ${formData.firstName}!`)}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {tr("כעת צור סיסמה כדי לגשת לפרופיל שלך", "Now create a password to access your profile")}
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <Field label={tr("סיסמה", "Password")} required>
              <div className="relative">
                <Lock className="absolute start-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={tr("לפחות 6 תווים", "At least 6 characters")}
                  className={`${inputCls} pe-12 ps-11`}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
            </Field>

            <Field label={tr("אימות סיסמה", "Confirm Password")} required>
              <div className="relative">
                <Lock className="absolute start-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={tr("הזן שוב את הסיסמה", "Enter password again")}
                  className={`${inputCls} ps-11`}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
            </Field>

            {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPasswordSetup(false)}
                className="flex-1"
              >
                {tr("חזרה", "Back")}
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? tr("יוצר חשבון...", "Creating account...") : tr("צור חשבון", "Create Account")}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

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
          {tr("תשעה שלבים לבניית הפרופיל המקצועי שלך", "Nine steps to build your professional profile")}
        </p>

        {/* Switch to chat registration */}
        <div className="mt-4">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
          >
            <MessageSquare className="size-4" />
            {tr("מעדיפים הרשמה בשיחה? לחצו כאן", "Prefer chat registration? Click here")}
            <ForwardArrow className="size-4" />
          </Link>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-8">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>{currentStepConfig?.title[lang] || ""}</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-border overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step Navigation (Horizontal on desktop, simplified on mobile) */}
      <div className="mt-6 hidden sm:block">
        <div className="flex gap-1 overflow-x-auto pb-2">
          {REGISTRATION_STEPS.map((step, index) => {
            const config = STEP_CONFIGS.find((s) => s.id === step);
            const isActive = step === currentStep;
            const isCompleted = completedSteps.includes(step);
            const isPast = index < currentStepIndex;

            return (
              <button
                key={step}
                onClick={() => (isPast || isCompleted) && goToStep(step)}
                disabled={!isPast && !isCompleted && !isActive}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isCompleted || isPast
                      ? "bg-secondary text-foreground hover:bg-secondary/80 cursor-pointer"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
              >
                {isCompleted ? (
                  <Check className="size-4" />
                ) : (
                  <span className="flex size-5 items-center justify-center rounded-full bg-background/20 text-[10px]">
                    {index + 1}
                  </span>
                )}
                {config?.title[lang]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Step Indicator */}
      <div className="mt-4 flex items-center justify-between sm:hidden">
        <button
          onClick={goBack}
          disabled={currentStepIndex === 0}
          className="flex items-center gap-1 text-sm text-muted-foreground disabled:opacity-50"
        >
          <NavArrow className="size-4" />
          {tr("הקודם", "Previous")}
        </button>
        <span className="text-sm font-medium">
          {currentStepIndex + 1} / {REGISTRATION_STEPS.length}
        </span>
        <div className="w-16" /> {/* Spacer */}
      </div>

      {/* Form Card */}
      <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            {STEP_ICONS[currentStep]}
          </div>
          <div>
            <h2 className="font-heading text-lg font-bold">{currentStepConfig?.title[lang]}</h2>
            <p className="text-sm text-muted-foreground">{currentStepConfig?.description[lang]}</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Step 1: Personal Information */}
          {currentStep === "personal" && (
            <PersonalStep formData={formData} updateFormData={updateFormData} tr={tr} lang={lang} />
          )}

          {/* Step 2: Rotary Membership */}
          {currentStep === "rotary" && (
            <RotaryStep formData={formData} updateFormData={updateFormData} tr={tr} lang={lang} years={years} />
          )}

          {/* Step 3: Professional Background */}
          {currentStep === "professional" && (
            <ProfessionalStep formData={formData} updateFormData={updateFormData} tr={tr} lang={lang} />
          )}

          {/* Step 4: Academic Education */}
          {currentStep === "education" && (
            <EducationStep formData={formData} updateFormData={updateFormData} tr={tr} lang={lang} />
          )}

          {/* Step 5: Military Service */}
          {currentStep === "military" && (
            <MilitaryStep formData={formData} updateFormData={updateFormData} tr={tr} lang={lang} />
          )}

          {/* Step 6: Interests & Activities */}
          {currentStep === "interests" && (
            <InterestsStep formData={formData} updateFormData={updateFormData} tr={tr} lang={lang} />
          )}

          {/* Step 7: Spouse/Partner */}
          {currentStep === "spouse" && (
            <SpouseStep formData={formData} updateFormData={updateFormData} tr={tr} lang={lang} />
          )}

          {/* Step 8: Children */}
          {currentStep === "children" && (
            <ChildrenStep formData={formData} updateFormData={updateFormData} tr={tr} lang={lang} />
          )}

          {/* Step 9: Review & Submit */}
          {currentStep === "review" && (
            <ReviewStep formData={formData} updateFormData={updateFormData} tr={tr} lang={lang} goToStep={goToStep} />
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="mt-8 flex items-center justify-between gap-4 border-t border-border pt-6">
          <Button
            variant="outline"
            onClick={goBack}
            disabled={currentStepIndex === 0 || isLoading}
            className="rounded-xl"
          >
            {tr("חזרה", "Back")}
          </Button>
          <Button
            onClick={handleNext}
            disabled={isLoading}
            className="rounded-xl"
          >
            {isLoading
              ? tr("שומר...", "Saving...")
              : currentStep === "review"
                ? tr("סיום והמשך", "Finish & Continue")
                : tr("המשך", "Continue")}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// STEP COMPONENTS
// ============================================================================

interface StepProps {
  formData: Partial<RegistrationData>;
  updateFormData: (updates: Partial<RegistrationData>) => void;
  tr: (he: string, en: string) => string;
  lang: "he" | "en";
}

function PersonalStep({ formData, updateFormData, tr, lang }: StepProps) {
  const age = formData.dateOfBirth ? calculateAge(formData.dateOfBirth) : null;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={tr("שם פרטי", "First name")} required>
          <input
            className={inputCls}
            value={formData.firstName || ""}
            onChange={(e) => updateFormData({ firstName: e.target.value })}
            placeholder={tr("לדוגמה: דוד", "e.g. David")}
          />
        </Field>
        <Field label={tr("שם משפחה", "Last name")} required>
          <input
            className={inputCls}
            value={formData.lastName || ""}
            onChange={(e) => updateFormData({ lastName: e.target.value })}
            placeholder={tr("לדוגמה: כהן", "e.g. Cohen")}
          />
        </Field>
        <Field label={tr('דוא"ל', "Email")} required>
          <input
            type="email"
            className={inputCls}
            value={formData.email || ""}
            onChange={(e) => updateFormData({ email: e.target.value })}
            placeholder="email@example.com"
          />
        </Field>
        <Field label={tr("טלפון", "Phone")}>
          <input
            type="tel"
            className={inputCls}
            value={formData.phone || ""}
            onChange={(e) => updateFormData({ phone: e.target.value })}
            placeholder="050-1234567"
          />
        </Field>
        <Field
          label={tr("תאריך לידה", "Date of birth")}
          hint={age !== null ? tr(`גיל נוכחי: ${age}`, `Current age: ${age}`) : undefined}
        >
          <input
            type="date"
            className={inputCls}
            value={formData.dateOfBirth || ""}
            onChange={(e) => {
              const newAge = calculateAge(e.target.value);
              updateFormData({ dateOfBirth: e.target.value, age: newAge ?? undefined });
            }}
          />
        </Field>
        <Field label={tr("עיר מגורים", "City")}>
          <input
            className={inputCls}
            value={formData.city || ""}
            onChange={(e) => updateFormData({ city: e.target.value })}
            placeholder={tr("לדוגמה: תל אביב", "e.g. Tel Aviv")}
          />
        </Field>
      </div>

      <h3 className="font-heading text-base font-bold mt-6">
        {tr("פרטי קשר נוספים", "Additional contact info")}
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="WhatsApp">
          <input
            className={inputCls}
            value={formData.contactInfo?.whatsapp || ""}
            onChange={(e) => updateFormData({
              contactInfo: { ...formData.contactInfo, whatsapp: e.target.value },
            })}
            placeholder="050-1234567"
          />
        </Field>
        <Field label="LinkedIn">
          <input
            className={inputCls}
            value={formData.socialProfiles?.linkedin || ""}
            onChange={(e) => updateFormData({
              socialProfiles: { ...formData.socialProfiles, linkedin: e.target.value },
            })}
            placeholder={tr("קישור לפרופיל או שם משתמש", "Profile URL or username")}
          />
        </Field>
      </div>
    </>
  );
}

function RotaryStep({ formData, updateFormData, tr, lang, years }: StepProps & { years: number[] }) {
  const [positions, setPositions] = useState<RotaryPosition[]>(formData.rotaryPositions || []);

  const addPosition = () => {
    const newPosition: RotaryPosition = { id: generateId(), level: "club" };
    setPositions([...positions, newPosition]);
    updateFormData({ rotaryPositions: [...positions, newPosition] });
  };

  const updatePosition = (index: number, updates: Partial<RotaryPosition>) => {
    const updated = positions.map((p, i) => (i === index ? { ...p, ...updates } : p));
    setPositions(updated);
    updateFormData({ rotaryPositions: updated });
  };

  const removePosition = (index: number) => {
    const updated = positions.filter((_, i) => i !== index);
    setPositions(updated);
    updateFormData({ rotaryPositions: updated });
  };

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={tr("מועדון רוטרי", "Rotary Club")} required>
          <select
            className={selectCls}
            value={formData.clubId || ""}
            onChange={(e) => updateFormData({ clubId: e.target.value })}
          >
            <option value="">{tr("בחרו את המועדון שלכם", "Select your club")}</option>
            {clubs.map((c) => (
              <option key={c.id} value={c.id}>
                {c[lang]}
              </option>
            ))}
          </select>
        </Field>
        <Field label={tr("שנת הצטרפות לרוטרי", "Year joined Rotary")} required>
          <select
            className={selectCls}
            value={formData.joinYear || ""}
            onChange={(e) => updateFormData({ joinYear: e.target.value })}
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
        label={tr("המועדון לא מופיע?", "Club not listed?")}
        hint={tr("פרטי המועדון ייבדקו על ידי הנהלת המחוז", "Your club will be reviewed by district")}
      >
        <input
          className={inputCls}
          value={formData.customClub || ""}
          onChange={(e) => updateFormData({ customClub: e.target.value })}
          placeholder={tr("לדוגמה: רוטרי כפר ורדים", "e.g. Rotary Kfar Vradim")}
        />
      </Field>

      <Field label={tr("מועדון קודם", "Previous Club")}>
        <input
          className={inputCls}
          value={formData.previousClub || ""}
          onChange={(e) => updateFormData({ previousClub: e.target.value })}
          placeholder={tr("אם היית חבר/ה במועדון אחר בעבר", "If you were a member of another club")}
        />
      </Field>

      {/* Rotary Positions */}
      <div className="mt-6">
        <h3 className="font-heading text-base font-bold mb-4">
          {tr("תפקידים ברוטרי", "Rotary Positions")}
        </h3>
        {positions.map((position, index) => (
          <div key={position.id || index} className="mb-4 rounded-lg border border-border p-4 bg-surface">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold">{tr("תפקיד", "Position")} {index + 1}</span>
              <button
                type="button"
                onClick={() => removePosition(index)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={tr("רמה", "Level")}>
                <select
                  className={selectCls}
                  value={position.level || ""}
                  onChange={(e) => updatePosition(index, { level: e.target.value as RotaryPosition["level"] })}
                >
                  {rotaryPositionLevelOptions.map((level) => (
                    <option key={level} value={level}>
                      {ROTARY_POSITION_LEVEL_LABELS[level]?.[lang] || level}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={tr("תפקיד", "Title")}>
                <input
                  className={inputCls}
                  value={position.title || ""}
                  onChange={(e) => updatePosition(index, { title: e.target.value })}
                  placeholder={tr("לדוגמה: נשיא מועדון", "e.g. Club President")}
                />
              </Field>
              <Field label={tr("משנה", "From Year")}>
                <input
                  type="number"
                  className={inputCls}
                  value={position.fromYear || ""}
                  onChange={(e) => updatePosition(index, { fromYear: e.target.value })}
                  placeholder="2020"
                />
              </Field>
              <Field label={tr("עד שנה", "To Year")}>
                <input
                  type="number"
                  className={inputCls}
                  value={position.toYear || ""}
                  onChange={(e) => updatePosition(index, { toYear: e.target.value })}
                  placeholder={tr("השאר ריק אם נוכחי", "Leave empty if current")}
                />
              </Field>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={addPosition}
          className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-semibold hover:bg-secondary"
        >
          <Plus className="size-4" />
          {tr("הוספת תפקיד", "Add Position")}
        </button>
      </div>
    </>
  );
}

function ProfessionalStep({ formData, updateFormData, tr, lang }: StepProps) {
  const [employmentHistory, setEmploymentHistory] = useState<EmploymentRecord[]>(
    formData.employmentHistory || []
  );

  const addEmployment = () => {
    const newRecord: EmploymentRecord = { id: generateId() };
    setEmploymentHistory([...employmentHistory, newRecord]);
    updateFormData({ employmentHistory: [...employmentHistory, newRecord] });
  };

  const updateEmployment = (index: number, updates: Partial<EmploymentRecord>) => {
    const updated = employmentHistory.map((e, i) => (i === index ? { ...e, ...updates } : e));
    setEmploymentHistory(updated);
    updateFormData({ employmentHistory: updated });
  };

  const removeEmployment = (index: number) => {
    const updated = employmentHistory.filter((_, i) => i !== index);
    setEmploymentHistory(updated);
    updateFormData({ employmentHistory: updated });
  };

  return (
    <>
      <Field label={tr("סטטוס תעסוקה", "Employment Status")}>
        <select
          className={selectCls}
          value={formData.employmentStatus || ""}
          onChange={(e) => updateFormData({ employmentStatus: e.target.value as RegistrationData["employmentStatus"] })}
        >
          <option value="">{tr("בחרו סטטוס", "Select status")}</option>
          {employmentStatusOptions.map((status) => (
            <option key={status} value={status}>
              {EMPLOYMENT_STATUS_LABELS[status]?.[lang] || status}
            </option>
          ))}
        </select>
      </Field>

      {formData.employmentStatus === "retired" && (
        <Field label={tr("שנת פרישה", "Retirement Year")}>
          <input
            type="number"
            className={inputCls}
            value={formData.retirementYear || ""}
            onChange={(e) => updateFormData({ retirementYear: e.target.value })}
            placeholder="2023"
          />
        </Field>
      )}

      {/* Current Employment */}
      {(formData.employmentStatus === "employed" || formData.employmentStatus === "self_employed") && (
        <div className="rounded-lg border border-border p-4 bg-surface">
          <h3 className="font-heading text-sm font-bold mb-4">
            {tr("עבודה נוכחית", "Current Employment")}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={tr("מעסיק / שם העסק", "Employer / Business Name")}>
              <input
                className={inputCls}
                value={formData.currentEmployment?.employer || ""}
                onChange={(e) => updateFormData({
                  currentEmployment: { ...formData.currentEmployment, employer: e.target.value },
                })}
              />
            </Field>
            <Field label={tr("תפקיד", "Role")}>
              <input
                className={inputCls}
                value={formData.currentEmployment?.role || ""}
                onChange={(e) => updateFormData({
                  currentEmployment: { ...formData.currentEmployment, role: e.target.value },
                })}
              />
            </Field>
            <Field label={tr("תעשייה / תחום", "Industry")}>
              <input
                className={inputCls}
                value={formData.currentEmployment?.industry || ""}
                onChange={(e) => updateFormData({
                  currentEmployment: { ...formData.currentEmployment, industry: e.target.value },
                })}
                placeholder={tr("לדוגמה: טכנולוגיה, רפואה", "e.g. Technology, Healthcare")}
              />
            </Field>
            <Field label={tr("משנה", "From Year")}>
              <input
                type="number"
                className={inputCls}
                value={formData.currentEmployment?.fromYear || ""}
                onChange={(e) => updateFormData({
                  currentEmployment: { ...formData.currentEmployment, fromYear: e.target.value },
                })}
              />
            </Field>
          </div>
        </div>
      )}

      {/* Employment History */}
      <div className="mt-6">
        <h3 className="font-heading text-base font-bold mb-4">
          {tr("היסטוריית תעסוקה", "Employment History")}
        </h3>
        {employmentHistory.map((record, index) => (
          <div key={record.id || index} className="mb-4 rounded-lg border border-border p-4 bg-surface">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold">{tr("משרה קודמת", "Previous Position")} {index + 1}</span>
              <button
                type="button"
                onClick={() => removeEmployment(index)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={tr("מעסיק", "Employer")}>
                <input
                  className={inputCls}
                  value={record.employer || ""}
                  onChange={(e) => updateEmployment(index, { employer: e.target.value })}
                />
              </Field>
              <Field label={tr("תפקיד", "Role")}>
                <input
                  className={inputCls}
                  value={record.role || ""}
                  onChange={(e) => updateEmployment(index, { role: e.target.value })}
                />
              </Field>
              <Field label={tr("משנה", "From")}>
                <input
                  type="number"
                  className={inputCls}
                  value={record.fromYear || ""}
                  onChange={(e) => updateEmployment(index, { fromYear: e.target.value })}
                />
              </Field>
              <Field label={tr("עד שנה", "To")}>
                <input
                  type="number"
                  className={inputCls}
                  value={record.toYear || ""}
                  onChange={(e) => updateEmployment(index, { toYear: e.target.value })}
                />
              </Field>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={addEmployment}
          className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-semibold hover:bg-secondary"
        >
          <Plus className="size-4" />
          {tr("הוספת משרה קודמת", "Add Previous Position")}
        </button>
      </div>
    </>
  );
}

function EducationStep({ formData, updateFormData, tr, lang }: StepProps) {
  const [educationHistory, setEducationHistory] = useState<EducationRecord[]>(
    formData.educationHistory || []
  );

  const addEducation = () => {
    const newRecord: EducationRecord = { id: generateId() };
    setEducationHistory([...educationHistory, newRecord]);
    updateFormData({ educationHistory: [...educationHistory, newRecord] });
  };

  const updateEducation = (index: number, updates: Partial<EducationRecord>) => {
    const updated = educationHistory.map((e, i) => (i === index ? { ...e, ...updates } : e));
    setEducationHistory(updated);
    updateFormData({ educationHistory: updated });
  };

  const removeEducation = (index: number) => {
    const updated = educationHistory.filter((_, i) => i !== index);
    setEducationHistory(updated);
    updateFormData({ educationHistory: updated });
  };

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <Checkbox
          id="hasHigherEducation"
          checked={formData.hasHigherEducation || false}
          onCheckedChange={(checked) => updateFormData({ hasHigherEducation: checked === true })}
        />
        <label htmlFor="hasHigherEducation" className="text-sm font-medium cursor-pointer">
          {tr("יש לי השכלה אקדמית / מקצועית", "I have academic / professional education")}
        </label>
      </div>

      {formData.hasHigherEducation && (
        <>
          {educationHistory.map((record, index) => (
            <div key={record.id || index} className="mb-4 rounded-lg border border-border p-4 bg-surface">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold">{tr("תואר", "Degree")} {index + 1}</span>
                <button
                  type="button"
                  onClick={() => removeEducation(index)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={tr("סוג תואר", "Degree Level")}>
                  <select
                    className={selectCls}
                    value={record.level || ""}
                    onChange={(e) => updateEducation(index, { level: e.target.value as EducationRecord["level"] })}
                  >
                    <option value="">{tr("בחרו סוג", "Select type")}</option>
                    {educationLevelOptions.map((level) => (
                      <option key={level} value={level}>
                        {EDUCATION_LEVEL_LABELS[level]?.[lang] || level}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={tr("תחום לימודים", "Field of Study")}>
                  <input
                    className={inputCls}
                    value={record.fieldOfStudy || ""}
                    onChange={(e) => updateEducation(index, { fieldOfStudy: e.target.value })}
                    placeholder={tr("לדוגמה: מדעי המחשב", "e.g. Computer Science")}
                  />
                </Field>
                <Field label={tr("מוסד לימודים", "Institution")}>
                  <input
                    className={inputCls}
                    value={record.institution || ""}
                    onChange={(e) => updateEducation(index, { institution: e.target.value })}
                    placeholder={tr("לדוגמה: אוניברסיטת תל אביב", "e.g. Tel Aviv University")}
                  />
                </Field>
                <Field label={tr("שנת סיום", "Graduation Year")}>
                  <input
                    type="number"
                    className={inputCls}
                    value={record.graduationYear || ""}
                    onChange={(e) => updateEducation(index, { graduationYear: e.target.value })}
                  />
                </Field>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addEducation}
            className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-semibold hover:bg-secondary"
          >
            <Plus className="size-4" />
            {tr("הוספת תואר", "Add Degree")}
          </button>
        </>
      )}
    </>
  );
}

function MilitaryStep({ formData, updateFormData, tr, lang }: StepProps) {
  return (
    <>
      <Field label={tr("מסגרת שירות", "Service Framework")}>
        <select
          className={selectCls}
          value={formData.military?.framework || ""}
          onChange={(e) => updateFormData({
            military: {
              ...formData.military,
              framework: e.target.value as RegistrationData["military"]["framework"],
              served: e.target.value !== "none" && e.target.value !== "",
            },
          })}
        >
          <option value="">{tr("בחרו מסגרת", "Select framework")}</option>
          {militaryFrameworkOptions.map((framework) => (
            <option key={framework} value={framework}>
              {MILITARY_FRAMEWORK_LABELS[framework]?.[lang] || framework}
            </option>
          ))}
        </select>
      </Field>

      {formData.military?.served && formData.military.framework !== "none" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={tr("יחידה / חיל", "Unit / Corps")}>
            <input
              className={inputCls}
              value={formData.military?.unit || ""}
              onChange={(e) => updateFormData({
                military: { ...formData.military, unit: e.target.value },
              })}
              placeholder={tr("לדוגמה: חיל האוויר", "e.g. Air Force")}
            />
          </Field>
          <Field label={tr("תפקיד", "Role")}>
            <input
              className={inputCls}
              value={formData.military?.role || ""}
              onChange={(e) => updateFormData({
                military: { ...formData.military, role: e.target.value },
              })}
            />
          </Field>
          <Field label={tr("דרגת שחרור", "Discharge Rank")}>
            <input
              className={inputCls}
              value={formData.military?.dischargeRank || ""}
              onChange={(e) => updateFormData({
                military: { ...formData.military, dischargeRank: e.target.value },
              })}
              placeholder={tr("לדוגמה: סרן", "e.g. Captain")}
            />
          </Field>
          <Field label={tr("שנת שחרור", "Discharge Year")}>
            <input
              type="number"
              className={inputCls}
              value={formData.military?.dischargeYear || ""}
              onChange={(e) => updateFormData({
                military: { ...formData.military, dischargeYear: e.target.value },
              })}
            />
          </Field>
          <Field label={tr("ניסיון פיקודי", "Command Experience")}>
            <textarea
              className="bg-card focus:border-primary w-full rounded-xl border border-border p-3 text-sm outline-none min-h-[80px]"
              value={formData.military?.commandExperience || ""}
              onChange={(e) => updateFormData({
                military: { ...formData.military, commandExperience: e.target.value },
              })}
              placeholder={tr("תאר/י ניסיון פיקודי אם רלוונטי", "Describe command experience if relevant")}
            />
          </Field>
        </div>
      )}
    </>
  );
}

function InterestsStep({ formData, updateFormData, tr, lang }: StepProps) {
  const selectedCategories = formData.interests?.categories || [];

  const toggleCategory = (category: string) => {
    const current = formData.interests?.categories || [];
    const updated = current.includes(category as typeof interestCategoryOptions[number])
      ? current.filter((c) => c !== category)
      : [...current, category as typeof interestCategoryOptions[number]];
    updateFormData({
      interests: { ...formData.interests, categories: updated },
    });
  };

  return (
    <>
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-3 block">
          {tr("תחומי עניין (בחרו כמה שתרצו)", "Areas of Interest (select as many as you like)")}
        </label>
        <div className="flex flex-wrap gap-2">
          {interestCategoryOptions.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => toggleCategory(category)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                selectedCategories.includes(category)
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-foreground hover:bg-secondary/80"
              }`}
            >
              {INTEREST_CATEGORY_LABELS[category]?.[lang] || category}
            </button>
          ))}
        </div>
      </div>

      <Field label={tr("תחביבים", "Hobbies")}>
        <input
          className={inputCls}
          value={formData.interests?.hobbies?.join(", ") || ""}
          onChange={(e) => updateFormData({
            interests: {
              ...formData.interests,
              hobbies: e.target.value.split(",").map((h) => h.trim()).filter(Boolean),
            },
          })}
          placeholder={tr("הפרידו בפסיקים: טניס, קריאה, בישול", "Separate with commas: tennis, reading, cooking")}
        />
      </Field>

      <Field label={tr("תחומי מומחיות", "Areas of Expertise")}>
        <input
          className={inputCls}
          value={formData.interests?.expertise?.join(", ") || ""}
          onChange={(e) => updateFormData({
            interests: {
              ...formData.interests,
              expertise: e.target.value.split(",").map((h) => h.trim()).filter(Boolean),
            },
          })}
          placeholder={tr("תחומים שבהם תוכל/י לסייע לאחרים", "Areas where you can help others")}
        />
      </Field>

      <Field label={tr("פעילות התנדבותית", "Volunteering Activities")}>
        <textarea
          className="bg-card focus:border-primary w-full rounded-xl border border-border p-3 text-sm outline-none min-h-[80px]"
          value={formData.interests?.volunteering || ""}
          onChange={(e) => updateFormData({
            interests: { ...formData.interests, volunteering: e.target.value },
          })}
          placeholder={tr("תאר/י פעילות התנדבותית נוכחית או קודמת", "Describe current or past volunteering")}
        />
      </Field>
    </>
  );
}

function SpouseStep({ formData, updateFormData, tr, lang }: StepProps) {
  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <Checkbox
          id="hasSpouse"
          checked={formData.hasSpouse || false}
          onCheckedChange={(checked) => updateFormData({ hasSpouse: checked === true })}
        />
        <label htmlFor="hasSpouse" className="text-sm font-medium cursor-pointer">
          {tr("יש לי בן/בת זוג", "I have a spouse/partner")}
        </label>
      </div>

      {formData.hasSpouse && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={tr("שם פרטי", "First Name")}>
              <input
                className={inputCls}
                value={formData.spouse?.firstName || ""}
                onChange={(e) => updateFormData({
                  spouse: { ...formData.spouse, firstName: e.target.value },
                })}
              />
            </Field>
            <Field label={tr("שם משפחה", "Last Name")}>
              <input
                className={inputCls}
                value={formData.spouse?.lastName || ""}
                onChange={(e) => updateFormData({
                  spouse: { ...formData.spouse, lastName: e.target.value },
                })}
              />
            </Field>
            <Field label={tr("מקצוע", "Profession")}>
              <input
                className={inputCls}
                value={formData.spouse?.profession || ""}
                onChange={(e) => updateFormData({
                  spouse: { ...formData.spouse, profession: e.target.value },
                })}
              />
            </Field>
            <Field label={tr("שנת לידה", "Birth Year")}>
              <input
                type="number"
                className={inputCls}
                value={formData.spouse?.birthYear || ""}
                onChange={(e) => updateFormData({
                  spouse: { ...formData.spouse, birthYear: e.target.value },
                })}
              />
            </Field>
          </div>

          <h3 className="font-heading text-sm font-bold mt-6 mb-4">
            {tr("עבודה נוכחית של בן/בת הזוג", "Spouse's Current Employment")}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={tr("מעסיק", "Employer")}>
              <input
                className={inputCls}
                value={formData.spouse?.employment?.employer || ""}
                onChange={(e) => updateFormData({
                  spouse: {
                    ...formData.spouse,
                    employment: { ...formData.spouse?.employment, employer: e.target.value },
                  },
                })}
              />
            </Field>
            <Field label={tr("תפקיד", "Role")}>
              <input
                className={inputCls}
                value={formData.spouse?.employment?.role || ""}
                onChange={(e) => updateFormData({
                  spouse: {
                    ...formData.spouse,
                    employment: { ...formData.spouse?.employment, role: e.target.value },
                  },
                })}
              />
            </Field>
          </div>

          <h3 className="font-heading text-sm font-bold mt-6 mb-4">
            {tr("השכלת בן/בת הזוג", "Spouse's Education")}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={tr("תואר", "Degree")}>
              <input
                className={inputCls}
                value={formData.spouse?.education?.degree || ""}
                onChange={(e) => updateFormData({
                  spouse: {
                    ...formData.spouse,
                    education: { ...formData.spouse?.education, degree: e.target.value },
                  },
                })}
              />
            </Field>
            <Field label={tr("מוסד לימודים", "Institution")}>
              <input
                className={inputCls}
                value={formData.spouse?.education?.institution || ""}
                onChange={(e) => updateFormData({
                  spouse: {
                    ...formData.spouse,
                    education: { ...formData.spouse?.education, institution: e.target.value },
                  },
                })}
              />
            </Field>
          </div>
        </>
      )}
    </>
  );
}

function ChildrenStep({ formData, updateFormData, tr, lang }: StepProps) {
  const [children, setChildren] = useState<Child[]>(formData.children || []);

  const addChild = () => {
    const newChild: Child = { id: generateId() };
    setChildren([...children, newChild]);
    updateFormData({ children: [...children, newChild], hasChildren: true, hasEligibleChildren: true });
  };

  const updateChild = (index: number, updates: Partial<Child>) => {
    const updated = children.map((c, i) => (i === index ? { ...c, ...updates } : c));
    setChildren(updated);
    updateFormData({ children: updated });
  };

  const removeChild = (index: number) => {
    const updated = children.filter((_, i) => i !== index);
    setChildren(updated);
    updateFormData({
      children: updated,
      hasChildren: updated.length > 0,
      hasEligibleChildren: updated.length > 0,
    });
  };

  return (
    <>
      <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 p-4 mb-6">
        <p className="text-sm text-amber-800 dark:text-amber-200">
          {tr(
            `מטעמי פרטיות והגנה, ניתן להזין פרטים רק לגבי ילדים בני ${MIN_CHILD_AGE} ומעלה.`,
            `For privacy and safeguarding reasons, you can only enter details for children aged ${MIN_CHILD_AGE} and above.`
          )}
        </p>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <Checkbox
          id="hasEligibleChildren"
          checked={formData.hasEligibleChildren || false}
          onCheckedChange={(checked) => {
            updateFormData({ hasEligibleChildren: checked === true, hasChildren: checked === true });
            if (!checked) {
              setChildren([]);
              updateFormData({ children: [] });
            }
          }}
        />
        <label htmlFor="hasEligibleChildren" className="text-sm font-medium cursor-pointer">
          {tr(`יש לי ילדים בני ${MIN_CHILD_AGE} ומעלה`, `I have children aged ${MIN_CHILD_AGE} or above`)}
        </label>
      </div>

      {formData.hasEligibleChildren && (
        <>
          {children.map((child, index) => (
            <div key={child.id || index} className="mb-4 rounded-lg border border-border p-4 bg-surface">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold">{tr("ילד/ה", "Child")} {index + 1}</span>
                <button
                  type="button"
                  onClick={() => removeChild(index)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={tr("שם פרטי", "First Name")}>
                  <input
                    className={inputCls}
                    value={child.firstName || ""}
                    onChange={(e) => updateChild(index, { firstName: e.target.value })}
                  />
                </Field>
                <Field label={tr("שנת לידה", "Birth Year")}>
                  <input
                    type="number"
                    className={inputCls}
                    value={child.birthYear || ""}
                    onChange={(e) => {
                      const year = e.target.value;
                      const age = year ? new Date().getFullYear() - parseInt(year, 10) : undefined;
                      if (age !== undefined && age < MIN_CHILD_AGE) {
                        toast.error(tr(
                          `ניתן להזין רק ילדים בני ${MIN_CHILD_AGE} ומעלה`,
                          `Only children aged ${MIN_CHILD_AGE} or above can be entered`
                        ));
                        return;
                      }
                      updateChild(index, { birthYear: year, age });
                    }}
                  />
                </Field>
                <Field label={tr("מקצוע", "Profession")}>
                  <input
                    className={inputCls}
                    value={child.profession || ""}
                    onChange={(e) => updateChild(index, { profession: e.target.value })}
                  />
                </Field>
                <Field label={tr("מעסיק", "Employer")}>
                  <input
                    className={inputCls}
                    value={child.employment?.employer || ""}
                    onChange={(e) => updateChild(index, {
                      employment: { ...child.employment, employer: e.target.value },
                    })}
                  />
                </Field>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addChild}
            className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-semibold hover:bg-secondary"
          >
            <Plus className="size-4" />
            {tr("הוספת ילד/ה", "Add Child")}
          </button>
        </>
      )}
    </>
  );
}

function ReviewStep({ formData, updateFormData, tr, lang, goToStep }: StepProps & { goToStep: (step: RegistrationStep) => void }) {
  const sections = [
    {
      step: "personal" as RegistrationStep,
      title: tr("פרטים אישיים", "Personal Information"),
      items: [
        { label: tr("שם", "Name"), value: `${formData.firstName || ""} ${formData.lastName || ""}`.trim() },
        { label: tr("דוא״ל", "Email"), value: formData.email },
        { label: tr("טלפון", "Phone"), value: formData.phone },
        { label: tr("עיר", "City"), value: formData.city },
      ].filter((item) => item.value),
    },
    {
      step: "rotary" as RegistrationStep,
      title: tr("חברות ברוטרי", "Rotary Membership"),
      items: [
        { label: tr("מועדון", "Club"), value: formData.customClub || formData.clubId },
        { label: tr("שנת הצטרפות", "Join Year"), value: formData.joinYear },
        { label: tr("תפקידים", "Positions"), value: formData.rotaryPositions?.map((p) => p.title).filter(Boolean).join(", ") },
      ].filter((item) => item.value),
    },
    {
      step: "professional" as RegistrationStep,
      title: tr("רקע מקצועי", "Professional Background"),
      items: [
        { label: tr("סטטוס", "Status"), value: formData.employmentStatus ? EMPLOYMENT_STATUS_LABELS[formData.employmentStatus]?.[lang] : undefined },
        { label: tr("עבודה נוכחית", "Current Work"), value: formData.currentEmployment?.employer ? `${formData.currentEmployment.role || ""} · ${formData.currentEmployment.employer}` : undefined },
      ].filter((item) => item.value),
    },
    {
      step: "education" as RegistrationStep,
      title: tr("השכלה", "Education"),
      items: formData.educationHistory?.map((edu) => ({
        label: EDUCATION_LEVEL_LABELS[edu.level || "other"]?.[lang] || tr("תואר", "Degree"),
        value: [edu.fieldOfStudy, edu.institution, edu.graduationYear].filter(Boolean).join(" · "),
      })) || [],
    },
    {
      step: "military" as RegistrationStep,
      title: tr("שירות צבאי", "Military Service"),
      items: formData.military?.served
        ? [
            { label: tr("מסגרת", "Framework"), value: MILITARY_FRAMEWORK_LABELS[formData.military.framework || ""]?.[lang] },
            { label: tr("יחידה", "Unit"), value: formData.military.unit },
            { label: tr("דרגה", "Rank"), value: formData.military.dischargeRank },
          ].filter((item) => item.value)
        : [{ label: tr("שירות", "Service"), value: tr("לא שירת/ה", "Did not serve") }],
    },
    {
      step: "interests" as RegistrationStep,
      title: tr("תחומי עניין", "Interests"),
      items: [
        { label: tr("תחומים", "Areas"), value: formData.interests?.categories?.map((c) => INTEREST_CATEGORY_LABELS[c]?.[lang]).join(", ") },
        { label: tr("תחביבים", "Hobbies"), value: formData.interests?.hobbies?.join(", ") },
      ].filter((item) => item.value),
    },
    {
      step: "spouse" as RegistrationStep,
      title: tr("בן/בת זוג", "Spouse"),
      items: formData.hasSpouse && formData.spouse
        ? [
            { label: tr("שם", "Name"), value: `${formData.spouse.firstName || ""} ${formData.spouse.lastName || ""}`.trim() },
            { label: tr("מקצוע", "Profession"), value: formData.spouse.profession },
          ].filter((item) => item.value)
        : [{ label: "", value: tr("אין בן/בת זוג", "No spouse") }],
    },
    {
      step: "children" as RegistrationStep,
      title: tr("ילדים", "Children"),
      items: formData.hasEligibleChildren && formData.children?.length
        ? formData.children.map((child) => ({
            label: child.firstName || tr("ילד/ה", "Child"),
            value: [child.profession, child.employment?.employer].filter(Boolean).join(" · ") || tr("לא צוין", "Not specified"),
          }))
        : [{ label: "", value: tr("אין ילדים בני 28+", "No children 28+") }],
    },
  ];

  return (
    <>
      <p className="text-sm text-muted-foreground mb-6">
        {tr(
          "סקרו את הפרטים שהזנתם ואשרו שהם נכונים לפני סיום ההרשמה.",
          "Review the information you've entered and confirm it's correct before completing registration."
        )}
      </p>

      {sections.map((section) => (
        <div key={section.step} className="mb-4 rounded-lg border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-heading text-sm font-bold">{section.title}</h3>
            <button
              type="button"
              onClick={() => goToStep(section.step)}
              className="text-xs text-primary hover:underline"
            >
              {tr("עריכה", "Edit")}
            </button>
          </div>
          <div className="space-y-1">
            {section.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                {item.label && <span className="text-muted-foreground">{item.label}</span>}
                <span className={item.label ? "font-medium" : "text-muted-foreground"}>{item.value}</span>
              </div>
            ))}
            {section.items.length === 0 && (
              <p className="text-sm text-muted-foreground italic">
                {tr("לא הוזנו פרטים", "No information entered")}
              </p>
            )}
          </div>
        </div>
      ))}

      {/* Consent checkboxes */}
      <div className="mt-8 space-y-4 border-t border-border pt-6">
        <h3 className="font-heading text-base font-bold">
          {tr("אישורים והסכמות", "Consents & Agreements")}
        </h3>

        <div className="flex items-start gap-3">
          <Checkbox
            id="dataAccuracy"
            checked={formData.consent?.dataAccuracy || false}
            onCheckedChange={(checked) => updateFormData({
              consent: { ...formData.consent, dataAccuracy: checked === true, timestamp: Date.now() },
            })}
          />
          <label htmlFor="dataAccuracy" className="text-sm cursor-pointer">
            {tr(
              "אני מאשר/ת שכל הפרטים שמסרתי נכונים ומדויקים",
              "I confirm that all information I provided is true and accurate"
            )}
            <span className="text-destructive ms-1">*</span>
          </label>
        </div>

        <div className="flex items-start gap-3">
          <Checkbox
            id="privacyNotice"
            checked={formData.consent?.privacyNotice || false}
            onCheckedChange={(checked) => updateFormData({
              consent: { ...formData.consent, privacyNotice: checked === true, timestamp: Date.now() },
            })}
          />
          <label htmlFor="privacyNotice" className="text-sm cursor-pointer">
            {tr(
              "קראתי ואני מסכים/ה למדיניות הפרטיות ולתנאי השימוש",
              "I have read and agree to the Privacy Policy and Terms of Use"
            )}
            <span className="text-destructive ms-1">*</span>
          </label>
        </div>

        {(formData.hasSpouse || formData.hasEligibleChildren) && (
          <div className="flex items-start gap-3">
            <Checkbox
              id="familyDataProcessing"
              checked={formData.consent?.familyDataProcessing || false}
              onCheckedChange={(checked) => updateFormData({
                consent: { ...formData.consent, familyDataProcessing: checked === true, timestamp: Date.now() },
              })}
            />
            <label htmlFor="familyDataProcessing" className="text-sm cursor-pointer">
              {tr(
                "אני מאשר/ת שקיבלתי הסכמה מבני המשפחה שפרטיהם נמסרו",
                "I confirm I have obtained consent from family members whose details were provided"
              )}
            </label>
          </div>
        )}

        <div className="flex items-start gap-3">
          <Checkbox
            id="marketingCommunications"
            checked={formData.consent?.marketingCommunications || false}
            onCheckedChange={(checked) => updateFormData({
              consent: { ...formData.consent, marketingCommunications: checked === true, timestamp: Date.now() },
            })}
          />
          <label htmlFor="marketingCommunications" className="text-sm cursor-pointer">
            {tr(
              "אני מסכים/ה לקבל עדכונים ותקשורת מרוטרי ישראל",
              "I agree to receive updates and communications from Rotary Israel"
            )}
          </label>
        </div>
      </div>
    </>
  );
}

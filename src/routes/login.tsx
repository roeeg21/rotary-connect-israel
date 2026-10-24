import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, KeyRound, Loader2, Mail, Sparkles } from "lucide-react";
import { useState, useRef, useEffect } from "react";

import { Logo, RotaryWheel } from "@/components/brand/RotaryMark";
import { SearchField } from "@/components/SearchField";
import { useAppState } from "@/lib/app-state";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "כניסה לחשבון | Rotary Connect Israel" },
      { name: "description", content: "כניסה לרוטרי קונקט ישראל — רשת הקשרים של חברי רוטרי." },
      { property: "og:title", content: "Sign in to Rotary Connect Israel" },
      { property: "og:description", content: "Sign in to the Rotary Israel professional network." },
    ],
  }),
  component: LoginPage,
});

type LoginStep = "email" | "method" | "otp" | "password";

function LoginPage() {
  const { lang, t, dir } = useI18n();
  const navigate = useNavigate();
  const { guestSearches, setAccount } = useAppState();

  // Form state
  const [step, setStep] = useState<LoginStep>("email");
  const [email, setEmail] = useState("");
  const [sessionKey, setSessionKey] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", ""]);
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // OTP input refs
  const otpRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const he = lang === "he";
  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;

  // Focus first OTP input when step changes to OTP
  useEffect(() => {
    if (step === "otp") {
      otpRefs[0].current?.focus();
    }
  }, [step]);

  // Handle email submission - go to method selection
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setStep("method");
  };

  // Handle selecting OTP method
  const handleSelectOtp = async () => {
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || (he ? "שגיאה בשליחת הקוד" : "Failed to send code"));
        return;
      }

      setSessionKey(data.sessionKey);
      setStep("otp");
    } catch {
      setError(he ? "שגיאה בשליחת הקוד. נסו שוב." : "Failed to send code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle selecting password method
  const handleSelectPassword = () => {
    setError("");
    setStep("password");
  };

  // Handle password submission
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || (he ? "סיסמה שגויה" : "Invalid password"));
        return;
      }

      // Success! Set account and navigate
      setAccount({
        firstName: data.user?.firstName || "",
        lastName: data.user?.lastName || "",
        email: data.email || email,
        club: data.user?.club || "",
      });

      void navigate({ to: "/" });
    } catch {
      setError(he ? "שגיאה בכניסה. נסו שוב." : "Failed to sign in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP digit input
  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, "").slice(-1);

    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);
    setError("");

    // Auto-advance to next input
    if (digit && index < 3) {
      otpRefs[index + 1].current?.focus();
    }

    // Auto-submit when all digits are entered
    if (digit && index === 3) {
      const fullCode = [...newDigits.slice(0, 3), digit].join("");
      if (fullCode.length === 4) {
        void verifyOtp(fullCode);
      }
    }
  };

  // Handle OTP backspace
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  // Handle OTP paste
  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (pasted.length === 4) {
      const digits = pasted.split("");
      setOtpDigits(digits);
      otpRefs[3].current?.focus();
      void verifyOtp(pasted);
    }
  };

  // Verify OTP
  const verifyOtp = async (code: string) => {
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionKey, code }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || (he ? "קוד שגוי" : "Invalid code"));
        // Clear OTP on error
        setOtpDigits(["", "", "", ""]);
        otpRefs[0].current?.focus();
        return;
      }

      // Success! Set account and navigate
      setAccount({
        firstName: "",
        lastName: "",
        email: data.email,
        club: "",
      });

      // Navigate to registration to complete profile
      void navigate({ to: "/register-form" });
    } catch {
      setError(he ? "שגיאה באימות הקוד. נסו שוב." : "Failed to verify code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    setError("");
    setIsLoading(true);
    setOtpDigits(["", "", "", ""]);

    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || (he ? "שגיאה בשליחת הקוד" : "Failed to send code"));
        return;
      }

      setSessionKey(data.sessionKey);
      otpRefs[0].current?.focus();
    } catch {
      setError(he ? "שגיאה בשליחת הקוד. נסו שוב." : "Failed to send code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Go back to email step
  const handleBackToEmail = () => {
    setStep("email");
    setOtpDigits(["", "", "", ""]);
    setPassword("");
    setError("");
  };

  // Go back to method selection
  const handleBackToMethod = () => {
    setStep("method");
    setOtpDigits(["", "", "", ""]);
    setPassword("");
    setError("");
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center py-12">
      <div className="container-narrow">
        {/* Card Container */}
        <div className="mx-auto max-w-md animate-fade-up">
          {/* Logo & Title */}
          <div className="text-center">
            <div className="flex justify-center">
              <Logo size="lg" />
            </div>
            <h1 className="mt-7 text-2xl font-bold tracking-tight sm:text-[1.75rem]">
              {step === "email" && (he ? "כניסה לחשבון" : "Sign in")}
              {step === "method" && (he ? "בחרו אופן כניסה" : "Choose sign-in method")}
              {step === "otp" && (he ? "הזינו את הקוד" : "Enter the code")}
              {step === "password" && (he ? "הזינו סיסמה" : "Enter password")}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              {step === "email" && t("tagline")}
              {step === "method" && (
                <>
                  {he ? "כניסה עם" : "Signing in as"}{" "}
                  <span className="font-semibold text-foreground">{email}</span>
                </>
              )}
              {step === "otp" && (
                <>
                  {he ? "שלחנו קוד בן 4 ספרות אל" : "We sent a 4-digit code to"}{" "}
                  <span className="font-semibold text-foreground">{email}</span>
                </>
              )}
              {step === "password" && (
                <>
                  {he ? "כניסה עם" : "Signing in as"}{" "}
                  <span className="font-semibold text-foreground">{email}</span>
                </>
              )}
            </p>
          </div>

          {/* Login Form */}
          <div className="card-elevated mt-8 p-6 sm:p-8">
            {step === "email" && (
              // Email Step
              <form onSubmit={handleEmailSubmit}>
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {he ? "כתובת דוא״ל" : "Email address"}
                  </span>
                  <div className="relative mt-2.5">
                    <Mail
                      className={`pointer-events-none absolute top-1/2 -translate-y-1/2 start-4 size-4 transition-all ${
                        isFocused ? "text-primary scale-105" : "text-muted-foreground"
                      }`}
                      strokeWidth={1.75}
                    />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError("");
                      }}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      className="h-12 w-full rounded-xl border border-border bg-card ps-12 pe-4 text-[15px] transition-all outline-none placeholder:text-muted-foreground/70 hover:border-border-strong focus:border-primary focus:ring-4 focus:ring-primary/10"
                      placeholder="name@example.com"
                      disabled={isLoading}
                    />
                  </div>
                </label>

                {error && (
                  <p className="mt-3 text-sm text-red-600 font-medium">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !email}
                  className="btn-press mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-[var(--primary-hover)] hover:shadow-raised disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {he ? "המשך" : "Continue"}
                  <Arrow className="size-4" />
                </button>
              </form>
            )}

            {step === "method" && (
              // Method Selection Step
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => void handleSelectOtp()}
                  disabled={isLoading}
                  className="btn-press flex w-full items-center gap-4 rounded-xl border-2 border-border bg-card p-4 text-start transition-all hover:border-primary hover:bg-primary/5 disabled:opacity-50"
                >
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Sparkles className="size-5 text-primary" strokeWidth={1.75} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold tracking-tight">
                      {he ? "קוד חד־פעמי" : "One-time code"}
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {he ? "נשלח קוד בן 4 ספרות לדוא״ל" : "We'll send a 4-digit code to your email"}
                    </p>
                  </div>
                  {isLoading ? (
                    <Loader2 className="size-5 animate-spin text-primary" />
                  ) : (
                    <Arrow className="size-5 text-muted-foreground" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleSelectPassword}
                  disabled={isLoading}
                  className="btn-press flex w-full items-center gap-4 rounded-xl border-2 border-border bg-card p-4 text-start transition-all hover:border-primary hover:bg-primary/5 disabled:opacity-50"
                >
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-secondary">
                    <KeyRound className="size-5 text-muted-foreground" strokeWidth={1.75} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold tracking-tight">
                      {he ? "סיסמה" : "Password"}
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {he ? "כניסה עם סיסמה קבועה" : "Sign in with your password"}
                    </p>
                  </div>
                  <Arrow className="size-5 text-muted-foreground" />
                </button>

                {error && (
                  <p className="mt-3 text-center text-sm text-red-600 font-medium">{error}</p>
                )}

                <button
                  type="button"
                  onClick={handleBackToEmail}
                  className="mt-4 w-full text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {he ? "שינוי כתובת דוא״ל" : "Change email address"}
                </button>
              </div>
            )}

            {step === "password" && (
              // Password Step
              <form onSubmit={handlePasswordSubmit}>
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {he ? "סיסמה" : "Password"}
                  </span>
                  <div className="relative mt-2.5">
                    <KeyRound
                      className={`pointer-events-none absolute top-1/2 -translate-y-1/2 start-4 size-4 transition-all ${
                        passwordFocused ? "text-primary scale-105" : "text-muted-foreground"
                      }`}
                      strokeWidth={1.75}
                    />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError("");
                      }}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                      className="h-12 w-full rounded-xl border border-border bg-card ps-12 pe-4 text-[15px] transition-all outline-none placeholder:text-muted-foreground/70 hover:border-border-strong focus:border-primary focus:ring-4 focus:ring-primary/10"
                      placeholder={he ? "הזינו סיסמה" : "Enter your password"}
                      disabled={isLoading}
                      autoFocus
                    />
                  </div>
                </label>

                {error && (
                  <p className="mt-3 text-sm text-red-600 font-medium">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !password}
                  className="btn-press mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-[var(--primary-hover)] hover:shadow-raised disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    <>
                      {he ? "כניסה" : "Sign in"}
                      <Arrow className="size-4" />
                    </>
                  )}
                </button>

                <div className="mt-4 flex flex-col items-center gap-2">
                  <button
                    type="button"
                    onClick={handleBackToMethod}
                    disabled={isLoading}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                  >
                    {he ? "שינוי אופן כניסה" : "Change sign-in method"}
                  </button>
                </div>
              </form>
            )}

            {step === "otp" && (
              // OTP Step
              <div>
                <div className="flex justify-center gap-3" dir="ltr">
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={otpRefs[index]}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={index === 0 ? handleOtpPaste : undefined}
                      disabled={isLoading}
                      className={`h-16 w-14 rounded-xl border-2 text-center text-2xl font-bold transition-all outline-none ${
                        digit
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border bg-card text-foreground"
                      } focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:opacity-50`}
                    />
                  ))}
                </div>

                {error && (
                  <p className="mt-4 text-center text-sm text-red-600 font-medium">{error}</p>
                )}

                {isLoading && (
                  <div className="mt-4 flex justify-center">
                    <Loader2 className="size-6 animate-spin text-primary" />
                  </div>
                )}

                <div className="mt-6 flex flex-col items-center gap-3">
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isLoading}
                    className="text-sm font-semibold text-primary transition-colors hover:text-primary/80 disabled:opacity-50"
                  >
                    {he ? "שליחת קוד חדש" : "Resend code"}
                  </button>
                  <button
                    type="button"
                    onClick={handleBackToMethod}
                    disabled={isLoading}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                  >
                    {he ? "שינוי אופן כניסה" : "Change sign-in method"}
                  </button>
                </div>
              </div>
            )}

            {step === "email" && (
              <>
                {/* Divider */}
                <div className="my-7 flex items-center gap-4">
                  <span className="section-divider flex-1" />
                  <span className="text-xs font-semibold text-muted-foreground">{he ? "או" : "or"}</span>
                  <span className="section-divider flex-1" />
                </div>

                {/* Google Sign In */}
                <button
                  type="button"
                  onClick={() => void navigate({ to: "/register-form" })}
                  className="btn-press flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-border bg-card text-sm font-semibold transition-all hover:bg-secondary hover:border-border-strong"
                >
                  <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
                    <path
                      fill="#4285F4"
                      d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.9Z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.1-4 1.1-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24Z"
                    />
                    <path fill="#FBBC05" d="M5.4 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.4a12 12 0 0 0 0 10.8l4-3.1Z" />
                    <path
                      fill="#EA4335"
                      d="M12 4.8c1.8 0 3.3.6 4.5 1.8l3.4-3.4A12 12 0 0 0 1.4 6.6l4 3.1C6.3 6.9 8.9 4.8 12 4.8Z"
                    />
                  </svg>
                  {he ? "המשך עם Google" : "Continue with Google"}
                </button>

                <p className="mt-4 text-center text-xs text-muted-foreground leading-relaxed">
                  {he
                    ? "גם בכניסה עם Google יש להשלים את שאלון ההרשמה."
                    : "Even with Google sign-in you must complete the registration questionnaire."}
                </p>
              </>
            )}
          </div>

          {/* Try Before Register */}
          <div className="card-premium mt-6 p-6">
            <div className="flex items-start gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gold-soft">
                <RotaryWheel className="size-5 text-gold" />
              </div>
              <div className="flex-1">
                <p className="font-bold tracking-tight">
                  {he ? "רוצים לנסות לפני ההרשמה?" : "Want to try before registering?"}
                </p>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                  {guestSearches >= 1 ? t("guestLimitBody") : t("guestOneSearch")}
                </p>
              </div>
            </div>
            <div className="mt-5">
              <SearchField size="md" />
            </div>
          </div>

          {/* Create Account Link */}
          <div className="mt-10 text-center">
            <p className="text-sm text-muted-foreground">
              {he ? "אין לכם חשבון?" : "No account yet?"}{" "}
            </p>
            <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
              <Link
                to="/register-form"
                className="btn-press inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-[var(--primary-hover)] hover:shadow-raised"
              >
                {he ? "הרשמה בטופס" : "Registration form"}
                <Arrow className="size-4" />
              </Link>
              <Link
                to="/register"
                className="btn-press inline-flex items-center justify-center gap-2 rounded-xl border border-border px-6 py-3 text-sm font-semibold text-muted-foreground transition-all hover:bg-secondary hover:border-border-strong hover:text-foreground"
              >
                {he ? "הרשמה חכמה בשיחה" : "Smart chat registration"}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

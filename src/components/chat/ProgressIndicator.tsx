import { cn } from "@/lib/utils";
import type { RegistrationStage } from "@/lib/conversation";

interface ProgressIndicatorProps {
  currentStage: RegistrationStage;
  progress: number;
  isRTL: boolean;
}

// Stage labels for display
const STAGE_LABELS = {
  he: {
    welcome: "ברוכים הבאים",
    language: "שפה",
    account: "חשבון",
    personal: "פרטים אישיים",
    professional: "מקצועי",
    community: "קהילה",
    spouse_intro: "בן/בת זוג",
    spouse_details: "פרטי בן/בת זוג",
    children_intro: "ילדים",
    children_details: "פרטי ילדים",
    networking: "רשת קשרים",
    review: "סקירה",
    completed: "הושלם",
  },
  en: {
    welcome: "Welcome",
    language: "Language",
    account: "Account",
    personal: "Personal",
    professional: "Professional",
    community: "Community",
    spouse_intro: "Spouse",
    spouse_details: "Spouse Details",
    children_intro: "Children",
    children_details: "Children Details",
    networking: "Networking",
    review: "Review",
    completed: "Completed",
  },
};

export function ProgressIndicator({
  currentStage,
  progress,
  isRTL,
}: ProgressIndicatorProps) {
  const labels = STAGE_LABELS[isRTL ? "he" : "en"];
  const currentLabel = labels[currentStage] || currentStage;

  return (
    <div className="border-b border-border bg-card px-4 py-3">
      <div className="mx-auto max-w-2xl">
        {/* Stage label */}
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-foreground">{currentLabel}</span>
          <span className="text-muted-foreground">{progress}%</span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full bg-primary transition-all duration-500 ease-out"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

import { RotaryWheel } from "@/components/brand/RotaryMark";
import { useI18n } from "@/lib/i18n";

export function SiteFooter() {
  const { t } = useI18n();
  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="container-app flex flex-col items-center gap-3 py-8 text-center sm:flex-row sm:justify-between sm:text-start">
        <div className="flex items-center gap-3">
          <span className="text-gold">
            <RotaryWheel className="h-7 w-7" />
          </span>
          <div>
            <p className="text-sm font-semibold">{t("footerGovernor")}</p>
            <p className="text-muted-foreground text-xs">{t("footerDistrict")}</p>
          </div>
        </div>
        <p className="text-muted-foreground text-xs">
          © {new Date().getFullYear()} Rotary Connect Israel
        </p>
      </div>
    </footer>
  );
}

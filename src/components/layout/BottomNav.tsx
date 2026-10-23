import { Link, useRouterState } from "@tanstack/react-router";

import { navItems } from "@/components/layout/AppHeader";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const { t } = useI18n();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      className="glass fixed inset-x-0 bottom-0 z-40 border-t border-border/60 md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Primary"
    >
      <ul className="grid h-[68px] grid-cols-4">
        {navItems.map((item) => {
          const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <li key={item.to}>
              <Link
                to={item.to}
                className={cn(
                  "btn-press flex h-full flex-col items-center justify-center gap-1.5 text-[10px] font-medium transition-all",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <div
                  className={cn(
                    "flex size-9 items-center justify-center rounded-full transition-all",
                    active ? "bg-primary/12 scale-105" : "hover:bg-secondary/60",
                  )}
                >
                  <Icon
                    className="size-[22px]"
                    strokeWidth={active ? 2.2 : 1.75}
                    aria-hidden
                  />
                </div>
                <span className={cn("tracking-tight", active && "font-semibold")}>{t(item.key)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

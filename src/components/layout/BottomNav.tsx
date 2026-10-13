import { Link, useRouterState } from "@tanstack/react-router";

import { navItems } from "@/components/layout/AppHeader";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const { t } = useI18n();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      className="glass fixed inset-x-0 bottom-0 z-40 border-t border-border md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Primary"
    >
      <ul className="grid h-16 grid-cols-4">
        {navItems.map((item) => {
          const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <li key={item.to}>
              <Link
                to={item.to}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors duration-200",
                  active ? "text-primary" : "text-muted-foreground active:text-foreground",
                )}
              >
                <div
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full transition-all duration-200",
                    active && "bg-primary/10",
                  )}
                >
                  <Icon
                    className={cn("size-5", active && "scale-105")}
                    strokeWidth={active ? 2.2 : 1.8}
                    aria-hidden
                  />
                </div>
                <span className={cn(active && "font-semibold")}>{t(item.key)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

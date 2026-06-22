import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = ["Invitation", "Chat", "Survey"] as const;

export function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  return (
    <div className="hidden w-full sm:block">
      <div className="mb-1 flex items-center justify-between text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-[11px]">
        <span>
          Step {current} of 3: {STEPS[current - 1]}
        </span>
        <span className="hidden sm:inline">University research prototype</span>
      </div>
      <ol className="flex items-center gap-1.5 sm:gap-2">
        {STEPS.map((label, i) => {
          const n = (i + 1) as 1 | 2 | 3;
          const done = n < current;
          const active = n === current;
          return (
            <li key={label} className="flex flex-1 items-center gap-1.5 sm:gap-2">
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold transition-colors sm:h-6 sm:w-6 sm:text-[11px]",
                  done && "bg-success text-success-foreground",
                  active && "bg-primary text-primary-foreground ring-2 ring-primary/15 sm:ring-4",
                  !done && !active && "bg-muted text-muted-foreground",
                )}
                aria-current={active ? "step" : undefined}
              >
                {done ? <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> : n}
              </span>
              <span
                className={cn(
                  "hidden truncate text-xs sm:inline",
                  active ? "font-medium text-foreground" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
              {n < 3 && (
                <span
                  className={cn(
                    "ml-1 h-px flex-1",
                    done ? "bg-success/60" : "bg-border",
                  )}
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
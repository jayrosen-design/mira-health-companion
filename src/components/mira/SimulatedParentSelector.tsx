import { CheckCircle2, X, FlaskConical } from "lucide-react";
import {
  SIMULATED_PARENT_SCENARIOS,
  type SimulatedParentType,
} from "@/lib/mira/simulated-parent-scenarios";

interface SimulatedParentSelectorProps {
  value: SimulatedParentType | null;
  onChange: (value: SimulatedParentType | null) => void;
}

export function SimulatedParentSelector({ value, onChange }: SimulatedParentSelectorProps) {
  const order: SimulatedParentType[] = ["willing", "ambivalent", "opposed"];
  return (
    <section
      aria-label="Optional simulated parent test"
      className="rounded-2xl border border-border bg-accent/5 p-6 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-accent/50 bg-accent/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-foreground">
              <FlaskConical className="h-3 w-3" /> Synthetic test mode
            </span>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Optional simulated parent test
            </h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose one parent type to run an automated test conversation, or leave all options
            unselected to type your own responses.
          </p>
        </div>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="inline-flex shrink-0 items-center gap-1 rounded-md border border-primary/40 bg-primary/10 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/20"
          >
            <X className="h-3 w-3" /> Clear selection
          </button>
        )}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {order.map((id) => {
          const s = SIMULATED_PARENT_SCENARIOS[id];
          const selected = value === id;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={selected}
              aria-label={`${s.label} — ${s.description}`}
              onClick={() => onChange(selected ? null : id)}
              className={[
                "group flex h-full min-h-[4.5rem] flex-col gap-1 rounded-xl border p-4 text-left transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                selected
                  ? "border-primary bg-card ring-1 ring-primary"
                  : "border-border bg-card hover:border-primary/40 hover:bg-accent/10",
              ].join(" ")}
            >
              <div className="flex items-start gap-3">
                <span
                  className={[
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/30 bg-background text-transparent group-hover:border-primary/60",
                  ].join(" ")}
                  aria-hidden="true"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="text-sm font-medium text-foreground">{s.label}</span>
                  <p className="text-xs leading-relaxed text-muted-foreground">{s.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

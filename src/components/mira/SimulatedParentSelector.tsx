import { CheckCircle2, HelpCircle, ShieldAlert, X, FlaskConical } from "lucide-react";
import {
  SIMULATED_PARENT_SCENARIOS,
  type SimulatedParentType,
} from "@/lib/mira/simulated-parent-scenarios";

interface SimulatedParentSelectorProps {
  value: SimulatedParentType | null;
  onChange: (value: SimulatedParentType | null) => void;
}

const ICONS: Record<SimulatedParentType, React.ReactNode> = {
  willing: <CheckCircle2 className="h-4 w-4" />,
  ambivalent: <HelpCircle className="h-4 w-4" />,
  opposed: <ShieldAlert className="h-4 w-4" />,
};

export function SimulatedParentSelector({ value, onChange }: SimulatedParentSelectorProps) {
  const order: SimulatedParentType[] = ["willing", "ambivalent", "opposed"];
  return (
    <section
      aria-label="Optional simulated parent test"
      className="rounded-2xl border border-border bg-card p-6 shadow-sm"
    >
      <div className="flex items-center justify-between gap-3">
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
            Select a parent type to watch MiraChat conduct an automated test conversation. Leave
            all options unselected to type your own responses.
          </p>
        </div>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs text-muted-foreground hover:bg-secondary"
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
                "group flex h-full flex-col gap-2 rounded-xl border p-4 text-left transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                selected
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border bg-background hover:border-primary/40 hover:bg-primary/5",
              ].join(" ")}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full ${
                      selected ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                    }`}
                  >
                    {ICONS[id]}
                  </span>
                  {s.label}
                </span>
                {selected && (
                  <span className="rounded-full bg-accent/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-foreground">
                    Synthetic
                  </span>
                )}
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">{s.description}</p>
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground">
        Scripts represent simplified test profiles — not every real parent.
      </p>
    </section>
  );
}

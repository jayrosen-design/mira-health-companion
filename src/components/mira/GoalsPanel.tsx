import { Check, Target } from "lucide-react";
import { CONVERSATION_GOALS } from "@/lib/mira/system-prompt";

export function GoalsPanel() {
  return (
    <aside className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/30 text-accent-foreground">
          <Target className="h-3.5 w-3.5" />
        </span>
        <h2 className="text-sm font-semibold text-foreground">Conversation Goals</h2>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Informed decision-making, on your terms.
      </p>
      <ul className="mt-4 flex flex-col gap-2.5">
        {CONVERSATION_GOALS.map((goal) => (
          <li key={goal} className="flex items-start gap-2 text-sm leading-snug text-foreground">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
            <span>{goal}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
        This tool will not pressure you toward any decision. Your child's healthcare provider is
        the best source of personalized medical advice.
      </p>
    </aside>
  );
}
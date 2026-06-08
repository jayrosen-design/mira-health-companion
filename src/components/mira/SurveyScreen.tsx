import { useState } from "react";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StepIndicator } from "./StepIndicator";

const LIKERT = [
  "Strongly disagree",
  "Disagree",
  "Neutral",
  "Agree",
  "Strongly agree",
] as const;

const QUESTIONS = [
  "This conversation was acceptable to me.",
  "This conversation felt appropriate for my situation.",
  "This conversation was easy to use.",
  "I understood that I was interacting with an AI tool.",
  "I trusted the information provided.",
  "The conversation helped me think about HPV vaccination.",
  "I feel more prepared to talk with my child's healthcare provider.",
  "I am more likely to consider scheduling the HPV vaccine.",
] as const;

interface SurveyScreenProps {
  onSubmit: () => void;
  onBack: () => void;
  submitted: boolean;
}

export function SurveyScreen({ onSubmit, onBack, submitted }: SurveyScreenProps) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [open, setOpen] = useState("");

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/40 px-4 py-12">
        <div className="mx-auto max-w-xl rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-xl font-semibold text-foreground">
            Thank you. Your feedback has been recorded for this prototype.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            No personal data is stored. You can close this window.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/40 px-4 py-8">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <header className="flex flex-col gap-3">
          <StepIndicator current={3} />
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Tell us about your experience
          </h1>
          <p className="text-sm text-muted-foreground">
            A few quick questions about this prototype conversation.
          </p>
        </header>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="flex flex-col gap-4"
        >
          {QUESTIONS.map((q, idx) => (
            <fieldset
              key={q}
              className="rounded-2xl border border-border bg-card p-4 shadow-sm"
            >
              <legend className="px-1 text-sm font-medium text-foreground">{q}</legend>
              <div className="mt-3 grid grid-cols-5 gap-1.5">
                {LIKERT.map((label, i) => {
                  const value = i + 1;
                  const selected = answers[idx] === value;
                  return (
                    <button
                      type="button"
                      key={label}
                      onClick={() => setAnswers((a) => ({ ...a, [idx]: value }))}
                      className={
                        "flex flex-col items-center gap-1 rounded-lg border px-2 py-2 text-[10px] font-medium leading-tight transition-colors " +
                        (selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground")
                      }
                    >
                      <span className="text-sm font-semibold">{value}</span>
                      <span className="hidden text-center sm:block">{label}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}

          <fieldset className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <legend className="px-1 text-sm font-medium text-foreground">
              What, if anything, would improve this experience?
            </legend>
            <Textarea
              value={open}
              onChange={(e) => setOpen(e.target.value)}
              rows={4}
              className="mt-3"
              placeholder="Optional"
            />
          </fieldset>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button type="button" variant="ghost" onClick={onBack} className="gap-1.5">
              <ArrowLeft className="h-4 w-4" /> Back to conversation
            </Button>
            <Button type="submit" size="lg">
              Submit Survey
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
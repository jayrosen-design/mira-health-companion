import { useState, useMemo } from "react";
import { CheckCircle2, ArrowLeft, Gift, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StepIndicator } from "./StepIndicator";
import { ParentVaccineTalkLogo, ParentVaccineTalkFooter } from "./BrandIdentity";

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
  const sessionId = useMemo(
    () =>
      (typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2) + Date.now().toString(36)),
    [],
  );
  const redcapUrl = `https://redcap.ctsi.ufl.edu/redcap/?session=${sessionId}`;

  if (submitted) {
    return (
      <div className="min-h-screen bg-background px-4 py-12">
        <header className="mx-auto mb-8 w-full max-w-xl"><ParentVaccineTalkLogo /></header>
        <div className="mx-auto max-w-xl rounded-2xl border border-border bg-card p-8 text-center shadow-soft">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-xl font-semibold text-heading">
            Thank you. Your feedback has been recorded.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            No personal data is stored. You can close this window.
          </p>

          <div className="mt-6 rounded-xl border border-secondary bg-secondary/70 p-5 text-left">
            <div className="flex items-center gap-2 text-primary">
              <Gift className="h-5 w-5" />
              <h2 className="text-sm font-semibold">
                Optional: Receive a $20 gift card
              </h2>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              As a thank-you, you can receive a <span className="font-medium text-foreground">$20 cash incentive gift card</span> by
              optionally sharing a few additional demographic details through our secure
              university REDCap form. Participation is voluntary.
            </p>
            <Button asChild size="lg" className="mt-4 w-full gap-2 sm:w-auto">
              <a href={redcapUrl} target="_blank" rel="noopener noreferrer">
                Continue to survey
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
            <p className="mt-3 break-all text-[11px] text-muted-foreground">
              Session reference: <span className="font-mono">{sessionId}</span>
            </p>
          </div>
        </div>
        <div className="mt-8"><ParentVaccineTalkFooter /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <header className="flex flex-col gap-3">
          <ParentVaccineTalkLogo />
          <StepIndicator current={3} />
          <h1 className="text-2xl font-semibold tracking-tight text-heading">
            Tell us about your experience
          </h1>
          <p className="text-sm text-muted-foreground">
            A few quick questions about this conversation with Mira from Parent Vaccine Talk.
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
              className="rounded-2xl border border-border bg-card p-4 shadow-soft"
            >
              <legend className="float-left block w-full text-sm font-medium text-foreground">{q}</legend>
              <div className="clear-both grid grid-cols-5 gap-1.5 pt-3">
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

          <fieldset className="rounded-2xl border border-border bg-card p-4 shadow-soft">
            <legend className="float-left block w-full text-sm font-medium text-foreground">
              What, if anything, would improve this experience?
            </legend>
            <div className="clear-both pt-3"><Textarea
              value={open}
              onChange={(e) => setOpen(e.target.value)}
              rows={4}
              placeholder="Optional"
            /></div>
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
        <ParentVaccineTalkFooter />
      </div>
    </div>
  );
}
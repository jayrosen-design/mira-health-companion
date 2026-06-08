import { useState } from "react";
import { ArrowRight, HeartPulse, Info, Lock, ShieldAlert, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StepIndicator } from "./StepIndicator";
import { PARENT_CONCERN_CHIPS } from "@/lib/mira/system-prompt";

interface WelcomeScreenProps {
  onStart: (prefill?: string) => void;
}

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  const [showLearn, setShowLearn] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/40 px-4 py-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <header className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
              <HeartPulse className="h-3 w-3" /> MiraChat
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-warning/40 bg-warning/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-warning-foreground">
              Prototype only
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Not for clinical use
            </span>
          </div>
          <StepIndicator current={1} />
        </header>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Talk through questions about the HPV vaccine
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            MiraChat is a prototype of a text-based digital twin designed to support parents as
            they think through HPV vaccination for their child. The conversation uses motivational
            interviewing principles: listening, reflecting, supporting autonomy, and sharing
            information with permission.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <InfoCard
              icon={<Lock className="h-4 w-4" />}
              title="Private prototype"
              body="Do not enter names, dates of birth, medical record numbers, or other personal identifiers."
            />
            <InfoCard
              icon={<Info className="h-4 w-4" />}
              title="AI-supported conversation"
              body="You are interacting with an AI prototype, not a human clinician."
            />
            <InfoCard
              icon={<Stethoscope className="h-4 w-4" />}
              title="Educational support"
              body="This tool does not diagnose, prescribe, or replace your child's healthcare provider."
            />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button size="lg" onClick={() => onStart()} className="gap-2">
              Start Conversation <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={() => setShowLearn((v) => !v)}
              className="text-foreground"
            >
              {showLearn ? "Hide details" : "View Prototype Notes"}
            </Button>
          </div>

          {showLearn && (
            <div className="mt-5 rounded-xl border border-border bg-secondary/40 p-4 text-sm leading-relaxed text-foreground">
              <p>
                This is a visual and functional prototype for stakeholder discussion as part of the
                Digital Twin MI and HPV pilot. It simulates a text-based motivational interviewing
                conversation about HPV vaccination. It is <strong>not</strong> the final clinical
                system and does not yet include the approved RAG knowledge base, trained project
                model, study authentication, survey storage, or production data handling.
              </p>
              <p className="mt-2 text-muted-foreground">
                Designed for parents or caregivers of 9- to 12-year-old children. This prototype is
                not collecting real study data.
              </p>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Common things parents start with
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick one to start, or write your own once the conversation opens.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {PARENT_CONCERN_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => onStart(chip)}
                className="rounded-full border border-border bg-background px-3 py-1.5 text-sm text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                {chip}
              </button>
            ))}
          </div>
        </section>

        <footer className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/5 p-3 text-xs text-warning-foreground">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            If this is an emergency, call 911 or contact your healthcare provider. This tool cannot
            respond to emergencies.
          </p>
        </footer>
      </div>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-secondary/40 p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
          {icon}
        </span>
        {title}
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
import { ArrowRight, Info, Lock, Stethoscope } from "lucide-react";
import { ParentVaccineTalkLogo, ParentVaccineTalkFooter } from "./BrandIdentity";
import { Button } from "@/components/ui/button";
import { StepIndicator } from "./StepIndicator";
import { SimulatedParentSelector } from "./SimulatedParentSelector";
import {
  SIMULATED_PARENT_SCENARIOS,
  type SimulatedParentType,
} from "@/lib/mira/simulated-parent-scenarios";

interface WelcomeScreenProps {
  onStart: (prefill?: string) => void;
  simulatedPersona: SimulatedParentType | null;
  onSimulatedPersonaChange: (value: SimulatedParentType | null) => void;
}

export function WelcomeScreen({
  onStart,
  simulatedPersona,
  onSimulatedPersonaChange,
}: WelcomeScreenProps) {
  const startLabel = simulatedPersona
    ? `Run ${SIMULATED_PARENT_SCENARIOS[simulatedPersona].id} parent simulation`
    : "Start conversation";

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <header className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <ParentVaccineTalkLogo />
          </div>
          <StepIndicator current={1} />
        </header>

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          <section className="p-6 sm:p-8">
            <h1 className="text-2xl font-semibold font-display leading-tight text-heading sm:text-3xl">
              Talk through questions about the HPV vaccine
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
              Mira is an AI assistant from Parent Vaccine Talk, designed to support parents as
              they think through HPV vaccination for their child. The conversation uses motivational
              interviewing principles: listening, reflecting, supporting autonomy, and sharing
              information with permission.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <InfoCard
                icon={<Lock className="h-4 w-4" />}
                title="Private conversation"
                body="Do not enter names, dates of birth, medical record numbers, or other personal identifiers."
              />
              <InfoCard
                icon={<Info className="h-4 w-4" />}
                title="AI-supported conversation"
                body="You are talking with Mira, an AI assistant, not a human clinician."
              />
              <InfoCard
                icon={<Stethoscope className="h-4 w-4" />}
                title="Educational support"
                body="This tool does not diagnose, prescribe, or replace your child's healthcare provider."
              />
            </div>
          </section>

          <section className="border-t border-border p-6 sm:p-8">
            <SimulatedParentSelector
              value={simulatedPersona}
              onChange={onSimulatedPersonaChange}
            />
            <div className="mt-6">
              <Button size="lg" onClick={() => onStart()} className="gap-2 capitalize">
                {startLabel} <ArrowRight className="h-4 w-4" />
              </Button>
              <p className="mt-2 text-sm text-muted-foreground">
                {simulatedPersona
                  ? "The selected parent scenario will run automatically with Mira."
                  : "Click the button above to start a conversation with Mira."}
              </p>
            </div>
          </section>
        </div>
        <ParentVaccineTalkFooter />
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
    <div className="rounded-xl border border-secondary bg-secondary/70 p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-tile-icon-bg text-tile-icon-foreground">
          {icon}
        </span>
        {title}
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

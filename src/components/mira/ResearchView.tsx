import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface ResearchViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surveyCompleted: boolean;
  messageCount: number;
  model: string;
}

export function ResearchView({
  open,
  onOpenChange,
  surveyCompleted,
  messageCount,
  model,
}: ResearchViewProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Research View</SheetTitle>
          <SheetDescription>
            Prototype details for stakeholders. Not part of the parent experience.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 flex flex-col gap-5 text-sm">
          <Section title="Current session">
            <Row k="Conversation ID" v="Demo-001" />
            <Row k="Active model" v={model} />
            <Row k="Messages exchanged" v={String(messageCount)} />
            <Row
              k="Survey status"
              v={surveyCompleted ? "Completed" : "Not completed"}
              tone={surveyCompleted ? "success" : undefined}
            />
          </Section>

          <Section title="Prototype architecture">
            <Row k="Backing API" v="UF Navigator Toolkit (demo)" />
            <Row k="RAG status" v="Prototype placeholder" />
            <Row k="MI fidelity monitor" v="Prototype placeholder" />
            <Row k="Safety monitor" v="Prototype placeholder" />
            <Row k="Data storage" v="In-memory only for prototype" />
            <Row k="Deployment target" v="HiPerGator / PubApp (planned)" />
          </Section>

          <div className="rounded-xl border border-warning/40 bg-warning/10 p-3 text-xs leading-relaxed text-warning-foreground">
            RAG grounding is planned for the production version. This prototype uses a prompt-based
            simulation and does not yet ground medical claims in a verified knowledge base.
          </div>

          <div className="rounded-xl border border-border bg-secondary/40 p-3 text-xs leading-relaxed text-foreground">
            <strong className="block text-foreground">Safety roadmap</strong>
            <span className="text-muted-foreground">
              Production version will include safety monitoring, escalation handling, and approved
              response templates.
            </span>
          </div>

          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Production versions would require approved model training, RAG grounding to verified
            HPV vaccine content, safety monitoring, authentication, study data storage, IRB-aligned
            consent language, and university-approved deployment.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <dl className="flex flex-col gap-1.5">{children}</dl>
    </div>
  );
}

function Row({ k, v, tone }: { k: string; v: string; tone?: "success" }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <dt className="text-muted-foreground">{k}</dt>
      <dd
        className={
          tone === "success"
            ? "rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success-foreground"
            : "text-right font-medium text-foreground"
        }
      >
        {v}
      </dd>
    </div>
  );
}
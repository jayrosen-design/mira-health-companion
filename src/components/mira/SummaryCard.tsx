import { FileText } from "lucide-react";

export function SummaryCard({ topics }: { topics: string[] }) {
  return (
    <div className="rounded-2xl border border-border bg-secondary/40 p-4 sm:p-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <FileText className="h-4 w-4 text-primary" /> Conversation Summary
        <span className="ml-auto rounded-full border border-border bg-card px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Prototype
        </span>
      </div>
      <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
        <Field label="Main concern discussed">
          {topics[0] ?? "Not yet identified in this conversation."}
        </Field>
        <Field label="Information shared">
          General educational context about the HPV vaccine. RAG grounding is planned for the
          production version.
        </Field>
        <Field label="Questions for your provider">
          Vaccine timing, side effects, and cancer prevention benefits.
        </Field>
        <Field label="Possible next step">
          Bring your remaining questions to your child's healthcare provider visit.
        </Field>
      </dl>
      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
        Based on this conversation, you may want to ask your child's healthcare provider about
        vaccine timing, side effects, and cancer prevention benefits.
      </p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm leading-snug text-foreground">{children}</dd>
    </div>
  );
}
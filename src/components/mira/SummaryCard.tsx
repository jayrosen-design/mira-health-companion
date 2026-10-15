import { FileText } from "lucide-react";

export function SummaryCard({ topics }: { topics: string[] }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card shadow-soft p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2 font-display text-lg font-medium text-heading">
        <FileText className="h-4 w-4 text-primary" /> Conversation with Mira · Summary
      </div>
      <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
        <Field label="Main concern discussed">
          {topics[0] ?? "Not yet identified in this conversation."}
        </Field>
        <Field label="Information shared">
          General educational context about the HPV vaccine.
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
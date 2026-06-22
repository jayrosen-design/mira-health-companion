import { HeartPulse } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  MiSessionState,
  SupervisorReport,
  DeveloperTrace,
} from "@/lib/mira/mi-types";

export interface ChatMessageMeta {
  state?: MiSessionState;
  supervisor?: SupervisorReport;
  trace?: DeveloperTrace;
}

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  miTag?: string | null;
  meta?: ChatMessageMeta | null;
}

export function ChatMessage({ role, content, miTag, meta }: ChatMessageProps) {
  const isUser = role === "user";
  const showMeta = !isUser && !!meta && (meta.state || meta.supervisor || meta.trace);
  const verdict = meta?.supervisor?.verdict;
  const verdictClass =
    verdict === "APPROVED"
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      : verdict === "REVISE"
        ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
        : verdict === "BLOCK"
          ? "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300"
          : "border-border bg-muted/40 text-muted-foreground";
  return (
    <div className={cn("flex w-full gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-sm">
          <HeartPulse className="h-4 w-4" aria-hidden />
        </div>
      )}
      <div className={cn("flex max-w-[80%] flex-col gap-1", isUser ? "items-end" : "items-start")}>
        <div
          className={cn(
            "whitespace-pre-wrap text-[15px] leading-relaxed",
            isUser
              ? "rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-primary-foreground shadow-sm"
              : "rounded-2xl rounded-bl-md border border-border bg-card px-4 py-3 text-card-foreground shadow-sm",
          )}
        >
          {content}
        </div>
        {!isUser && miTag && (
          <span
            className="ml-1 inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-accent-foreground/80"
            title="Motivational Interviewing technique (prototype tag)"
          >
            MI · {miTag}
          </span>
        )}
        {showMeta && (
          <div className="ml-1 flex flex-wrap gap-1 pt-0.5 text-[10px] font-medium uppercase tracking-wide">
            {meta?.state?.phase && (
              <span
                className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-primary"
                title={`Routing node: ${meta.state.nodeId}`}
              >
                {meta.state.phase} · {meta.state.nodeId}
              </span>
            )}
            {meta?.state?.stance && meta.state.stance !== "UNKNOWN" && (
              <span
                className="inline-flex items-center rounded-full border border-border bg-muted/40 px-2 py-0.5 text-muted-foreground"
                title="Detected parent stance"
              >
                stance · {meta.state.stance.toLowerCase()}
              </span>
            )}
            {meta?.state?.permissionState && meta.state.permissionState !== "UNKNOWN" && (
              <span
                className="inline-flex items-center rounded-full border border-border bg-muted/40 px-2 py-0.5 text-muted-foreground"
                title="Permission to share information"
              >
                permission · {meta.state.permissionState.toLowerCase()}
              </span>
            )}
            {meta?.state?.concernCategory && (
              <span
                className="inline-flex items-center rounded-full border border-border bg-muted/40 px-2 py-0.5 text-muted-foreground"
                title="Concern category"
              >
                concern · {meta.state.concernCategory}
              </span>
            )}
            {meta?.trace?.selectedOutcome && (
              <span
                className="inline-flex items-center rounded-full border border-border bg-muted/40 px-2 py-0.5 text-muted-foreground"
                title={`Routing decision (confidence ${meta.trace.classificationConfidence})`}
              >
                route · {meta.trace.selectedOutcome}
              </span>
            )}
            {verdict && (
              <span
                className={cn("inline-flex items-center rounded-full border px-2 py-0.5", verdictClass)}
                title={meta?.supervisor?.notes ?? "Supervisor verdict"}
              >
                supervisor · {verdict.toLowerCase()}
              </span>
            )}
            {meta?.supervisor?.revisionRequested && (
              <span
                className="inline-flex items-center rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-amber-700 dark:text-amber-300"
                title="Reply was revised after supervisor feedback"
              >
                revised
              </span>
            )}
            {meta?.supervisor?.fallbackUsed && (
              <span
                className="inline-flex items-center rounded-full border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-red-700 dark:text-red-300"
                title="Controlled fallback reply was used"
              >
                fallback
              </span>
            )}
            {meta?.supervisor?.violations?.slice(0, 3).map((v) => (
              <span
                key={v}
                className="inline-flex items-center rounded-full border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-red-700 dark:text-red-300"
                title="Supervisor violation"
              >
                ⚠ {v.toLowerCase().replaceAll("_", " ")}
              </span>
            ))}
            {typeof meta?.trace?.latencyMs === "number" && (
              <span
                className="inline-flex items-center rounded-full border border-border bg-muted/40 px-2 py-0.5 text-muted-foreground"
                title="End-to-end orchestration latency"
              >
                {meta.trace.latencyMs} ms
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

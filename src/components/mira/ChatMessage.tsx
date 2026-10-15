import { MiraAvatar } from "./BrandIdentity";
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
  showMeta?: boolean;
}

export function ChatMessage({ role, content, miTag, meta, showMeta = true }: ChatMessageProps) {
  const isUser = role === "user";
  const hasMeta = !!meta && (meta.state || meta.supervisor || meta.trace);
  const showChips = showMeta && (!!(!isUser && miTag) || hasMeta);
  const verdict = meta?.supervisor?.verdict;
  const verdictClass =
    verdict === "APPROVED"
      ? "border-transparent bg-meta-sage text-meta-sage-foreground"
      : verdict === "REVISE"
        ? "border-transparent bg-meta-amber text-meta-amber-foreground"
        : verdict === "BLOCK"
          ? "border-transparent bg-meta-rose text-meta-rose-foreground"
          : "border-transparent bg-muted text-muted-foreground";
  return (
    <div className={cn("flex w-full gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <MiraAvatar size="sm" />
      )}
      <div className={cn("flex min-w-0 max-w-[80%] flex-col gap-1", isUser ? "items-end" : "items-start")}>
        <div
          className={cn(
            "whitespace-pre-wrap break-words text-[15px] leading-relaxed",
            isUser
              ? "rounded-2xl rounded-br-bubble-corner bg-user-bubble px-4 py-3 text-user-bubble-foreground shadow-soft"
              : "rounded-2xl rounded-tl-bubble-corner border border-border bg-card px-4 py-3 text-card-foreground shadow-soft",
          )}
        >
          {content}
        </div>
        {showChips && (
          <div className="ml-1 flex flex-wrap gap-1 pt-0.5 text-[10px] font-mono font-medium uppercase tracking-normal">
            {!isUser && miTag && (
              <span
                className="inline-flex items-center gap-1 rounded-full border border-transparent bg-meta-lavender px-2 py-0.5 text-meta-lavender-foreground"
                title="Motivational Interviewing technique"
              >
                MI · {miTag}
              </span>
            )}
            {hasMeta && (
              <>
                {meta?.state?.phase && (
                  <span
                    className="inline-flex items-center rounded-full border border-transparent bg-secondary px-2 py-0.5 text-secondary-foreground"
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
                    className="inline-flex items-center rounded-full border border-warning/40 bg-meta-amber px-2 py-0.5 text-meta-amber-foreground"
                    title="Reply was revised after supervisor feedback"
                  >
                    revised
                  </span>
                )}
                {meta?.supervisor?.fallbackUsed && (
                  <span
                    className="inline-flex items-center rounded-full border border-destructive/40 bg-meta-rose px-2 py-0.5 text-meta-rose-foreground"
                    title="Controlled fallback reply was used"
                  >
                    fallback
                  </span>
                )}
                {meta?.supervisor?.violations?.slice(0, 3).map((v) => (
                  <span
                    key={v}
                    className="inline-flex items-center rounded-full border border-destructive/40 bg-meta-rose px-2 py-0.5 text-meta-rose-foreground"
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
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

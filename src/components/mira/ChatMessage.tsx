import { HeartPulse } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  miTag?: string | null;
}

export function ChatMessage({ role, content, miTag }: ChatMessageProps) {
  const isUser = role === "user";
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
      </div>
    </div>
  );
}

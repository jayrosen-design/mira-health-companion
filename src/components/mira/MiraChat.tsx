import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Send, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChatMessage } from "./ChatMessage";
import { ModelSelect } from "./ModelSelect";
import {
  MIRA_DEFAULT_MODEL,
  MIRA_GREETING,
  MIRA_SYSTEM_PROMPT,
  type MiraModel,
} from "@/lib/mira/system-prompt";

type Msg = { role: "user" | "assistant"; content: string };

export function MiraChat() {
  const [model, setModel] = useState<MiraModel>(MIRA_DEFAULT_MODEL);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "user", content: MIRA_SYSTEM_PROMPT },
    { role: "assistant", content: MIRA_GREETING },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isSending]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [isSending]);

  const send = async () => {
    const trimmed = input.trim();
    if (!trimmed || isSending) return;
    setError(null);
    const next: Msg[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");
    setIsSending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages: next }),
      });
      const data = (await res.json()) as { content?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
      setMessages((prev) => [...prev, { role: "assistant", content: data.content ?? "" }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed.");
    } finally {
      setIsSending(false);
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Ignore Enter while the user is composing in an IME (e.g. Japanese, Chinese, Korean).
    // `isComposing` and keyCode 229 both indicate an active composition.
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    if (e.key === "Enter" && !e.shiftKey && !e.repeat) {
      e.preventDefault();
      send();
    }
  };

  const visible = messages.slice(1);

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-4 py-3">
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold text-foreground">
              Mira – Health Education Assistant
            </h1>
            <p className="text-xs text-muted-foreground">HPV vaccine conversation guide</p>
          </div>
          <ModelSelect value={model} onChange={setModel} disabled={isSending} />
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-6">
          {visible.map((m, i) => (
            <ChatMessage key={i} role={m.role} content={m.content} />
          ))}
          {isSending && (
            <div className="flex items-center gap-3" aria-live="polite" aria-label="Mira is typing">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground text-sm font-semibold">
                M
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Mira is typing</span>
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/70 [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/70 [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/70" />
                </span>
              </div>
            </div>
          )}
          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          )}
        </div>
      </div>

      <div className="border-t bg-card">
        <div className="mx-auto w-full max-w-3xl px-4 py-3">
          <div className="flex items-end gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Share a thought or question…"
              rows={1}
              disabled={isSending}
              className="max-h-40 min-h-[44px] resize-none"
              autoFocus
            />
            <Button
              onClick={send}
              disabled={isSending || !input.trim()}
              size="icon"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3 w-3" aria-hidden />
            Conversations are not stored. Refreshing this page clears the chat.
          </p>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Link } from "@tanstack/react-router";
import {
  Send,
  LogOut,
  Code2,
  HeartPulse,
  FlaskConical,
  ShieldAlert,
  Stethoscope,
  FileText,
  BookOpen,
  ClipboardList,
  Home,
  RotateCcw,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ChatMessage } from "./ChatMessage";
import { PasswordGate } from "./PasswordGate";
import { SettingsSidebar } from "./SettingsSidebar";
import { WelcomeScreen } from "./WelcomeScreen";
import { StepIndicator } from "./StepIndicator";
import { GoalsPanel } from "./GoalsPanel";
import { CompletionPrompt } from "./CompletionPrompt";
import { SummaryCard } from "./SummaryCard";
import { ResearchView } from "./ResearchView";
import { SurveyScreen } from "./SurveyScreen";
import {
  MIRA_DEFAULT_MODEL,
  MIRA_GREETING,
  MIRA_SYSTEM_PROMPT,
  PARENT_CONCERN_CHIPS,
  type MiraModel,
} from "@/lib/mira/system-prompt";

type Msg = { role: "user" | "assistant"; content: string };
type Phase = "welcome" | "chat" | "survey";

function inferMiTag(text: string): string | null {
  const t = text.toLowerCase();
  if (/would it be (ok|okay)|is it (ok|okay) if|may i share|would you like me to/.test(t))
    return "Ask-Offer-Ask";
  if (/sounds like|it seems|what i('m| am) hearing|you('re| are) feeling/.test(t))
    return "Reflection";
  if (/thoughtful|caring|you('re| are) (being|doing)|takes courage|protective/.test(t))
    return "Affirmation";
  if (/\?$/.test(text.trim()) && /^(what|how|tell me|when|where|which)\b/.test(t))
    return "Open question";
  if (/your (decision|choice|call)|up to you|you know your child/.test(t))
    return "Supporting autonomy";
  return null;
}

export function MiraChat() {
  const [authState, setAuthState] = useState<"loading" | "out" | "in">("loading");
  const [model, setModel] = useState<MiraModel>(MIRA_DEFAULT_MODEL);
  const [systemPrompt, setSystemPrompt] = useState<string>(MIRA_SYSTEM_PROMPT);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [researchOpen, setResearchOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("welcome");
  const [surveySubmitted, setSurveySubmitted] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [dismissedCompletion, setDismissedCompletion] = useState(false);
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
    let cancelled = false;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d: { authenticated?: boolean }) => {
        if (!cancelled) setAuthState(d.authenticated ? "in" : "out");
      })
      .catch(() => {
        if (!cancelled) setAuthState("out");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const signOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setMessages([
      { role: "user", content: systemPrompt },
      { role: "assistant", content: MIRA_GREETING },
    ]);
    setPhase("welcome");
    setSurveySubmitted(false);
    setShowSummary(false);
    setDismissedCompletion(false);
    setAuthState("out");
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isSending]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [isSending]);

  const sendText = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;
    setError(null);
    const rest = messages.slice(1);
    const next: Msg[] = [
      { role: "user", content: systemPrompt },
      ...rest,
      { role: "user", content: trimmed },
    ];
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
      if (res.status === 401) {
        setAuthState("out");
        throw new Error("Session expired. Please sign in again.");
      }
      if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
      setMessages((prev) => [...prev, { role: "assistant", content: data.content ?? "" }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed.");
    } finally {
      setIsSending(false);
    }
  };

  const send = () => sendText(input);
  const sendChip = (chip: string) => {
    setDismissedCompletion(false);
    sendText(chip);
  };

  const resetChat = () => {
    if (isSending) return;
    setMessages([
      { role: "user", content: systemPrompt },
      { role: "assistant", content: MIRA_GREETING },
    ]);
    setInput("");
    setError(null);
    setShowSummary(false);
    setDismissedCompletion(false);
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
  const userTurns = useMemo(() => visible.filter((m) => m.role === "user"), [visible]);
  const showCompletion =
    !dismissedCompletion && userTurns.length >= 4 && !isSending && phase === "chat";
  const firstUserMessage = userTurns[0]?.content ?? "";

  const startChat = (prefill?: string) => {
    setPhase("chat");
    if (prefill) {
      // small delay so chat mounts before sending
      setTimeout(() => sendText(prefill), 50);
    }
  };

  if (authState === "loading") {
    return <div className="flex h-screen items-center justify-center bg-background" />;
  }
  if (authState === "out") {
    return <PasswordGate onAuthenticated={() => setAuthState("in")} />;
  }

  if (phase === "welcome") {
    return (
      <>
        <TopBanner
          onHome={() => setPhase("welcome")}
          showHome={false}
          onSignOut={signOut}
          onDev={() => setSettingsOpen(true)}
          onResearch={() => setResearchOpen(true)}
          onReset={resetChat}
          canReset={false}
        />
        <WelcomeScreen onStart={startChat} />
        <SettingsSidebar
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          model={model}
          onModelChange={setModel}
          systemPrompt={systemPrompt}
          onSystemPromptChange={setSystemPrompt}
          disabled={isSending}
        />
        <ResearchView
          open={researchOpen}
          onOpenChange={setResearchOpen}
          surveyCompleted={surveySubmitted}
          messageCount={visible.length}
          model={model}
        />
      </>
    );
  }

  if (phase === "survey") {
    return (
      <>
        <TopBanner
          onHome={() => setPhase("welcome")}
          onSignOut={signOut}
          onDev={() => setSettingsOpen(true)}
          onResearch={() => setResearchOpen(true)}
          onReset={resetChat}
          canReset={false}
        />
        <SurveyScreen
          submitted={surveySubmitted}
          onBack={() => setPhase("chat")}
          onSubmit={() => setSurveySubmitted(true)}
        />
        <SettingsSidebar
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          model={model}
          onModelChange={setModel}
          systemPrompt={systemPrompt}
          onSystemPromptChange={setSystemPrompt}
          disabled={isSending}
        />
        <ResearchView
          open={researchOpen}
          onOpenChange={setResearchOpen}
          surveyCompleted={surveySubmitted}
          messageCount={visible.length}
          model={model}
        />
      </>
    );
  }

  return (
    <div className="flex h-[100dvh] flex-col bg-gradient-to-b from-background via-background to-secondary/30">
      <TopBanner
        onHome={() => setPhase("welcome")}
        onSignOut={signOut}
        onDev={() => setSettingsOpen(true)}
        onResearch={() => setResearchOpen(true)}
        onReset={resetChat}
        canReset={!isSending && userTurns.length > 0}
      />

      <header className="shrink-0 border-b border-border bg-card/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-3 py-2 sm:gap-3 sm:px-4 sm:py-3">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setPhase("welcome")}
              className="flex items-center gap-3 min-w-0 rounded-lg p-1 -m-1 text-left transition-colors hover:bg-primary/5"
              title="Back to welcome"
              aria-label="Back to welcome"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary sm:h-9 sm:w-9">
                <HeartPulse className="h-4 w-4 sm:h-5 sm:w-5" />
              </span>
              <div className="min-w-0">
                <h1 className="truncate text-base font-semibold text-foreground">MiraChat</h1>
                <p className="hidden truncate text-xs text-muted-foreground sm:block">
                  MI Digital Twin Conversation Prototype
                </p>
              </div>
            </button>
            <div className="hidden flex-wrap items-center gap-1.5 sm:flex">
              <Pill>Prototype</Pill>
              <Pill>AI-supported</Pill>
              <Pill>No data stored</Pill>
              <Button
                size="sm"
                variant="outline"
                onClick={resetChat}
                disabled={isSending || userTurns.length === 0}
                className="ml-1 h-7 gap-1.5 text-xs"
                title="Clear the conversation and start over"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset chat
              </Button>
            </div>
          </div>
          <StepIndicator current={2} />
        </div>
      </header>

      <SettingsSidebar
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        model={model}
        onModelChange={setModel}
        systemPrompt={systemPrompt}
        onSystemPromptChange={setSystemPrompt}
        disabled={isSending}
      />
      <ResearchView
        open={researchOpen}
        onOpenChange={setResearchOpen}
        surveyCompleted={surveySubmitted}
        messageCount={visible.length}
        model={model}
      />

      <div className="mx-auto flex w-full max-w-5xl min-h-0 flex-1 gap-6 sm:px-4 sm:py-6">
        <main className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="hidden items-start gap-2 border-b border-primary/20 bg-primary/5 px-3 py-2 text-xs leading-relaxed text-foreground sm:flex sm:rounded-xl sm:border sm:p-3">
            <Stethoscope className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p>
              You are chatting with an AI prototype designed to use motivational interviewing. It
              provides educational support and cannot replace a healthcare provider.
            </p>
          </div>

          <div
            ref={scrollRef}
            className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto bg-background px-3 py-4 sm:mt-4 sm:rounded-2xl sm:border sm:border-border sm:bg-card/60 sm:p-5 sm:shadow-sm"
          >
            {visible.map((m, i) => (
              <ChatMessage
                key={i}
                role={m.role}
                content={m.content}
                miTag={m.role === "assistant" ? inferMiTag(m.content) : null}
              />
            ))}
            {isSending && (
              <div className="flex items-center gap-3" aria-live="polite" aria-label="Digital Twin is responding">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-accent-foreground">
                  <HeartPulse className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Digital Twin is responding</span>
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

            {showSummary && <SummaryCard topics={[firstUserMessage]} />}

            {showCompletion && (
              <CompletionPrompt
                onSurvey={() => setPhase("survey")}
                onKeepChatting={() => setDismissedCompletion(true)}
              />
            )}

            {/* Concern chips */}
            {userTurns.length === 0 && (
              <div className="flex flex-wrap gap-2">
                {PARENT_CONCERN_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => sendChip(chip)}
                    disabled={isSending}
                    className="rounded-full border border-border bg-card px-3 py-1.5 text-sm text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 disabled:opacity-50"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="shrink-0 border-t border-border bg-card p-2 sm:mt-3 sm:rounded-2xl sm:border sm:p-3 sm:shadow-md">
            <div className="flex items-end gap-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Share a thought or question…"
                rows={1}
                disabled={isSending}
                className="max-h-40 min-h-[48px] resize-none border-0 bg-transparent text-base shadow-none focus-visible:ring-0"
                autoFocus
              />
              <Button
                onClick={send}
                disabled={isSending || !input.trim()}
                size="icon"
                aria-label="Send message"
                className="h-10 w-10"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {userTurns.length >= 2 && (
            <div className="hidden flex-wrap gap-2 px-3 pt-2 pb-3 sm:flex sm:px-0">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => setShowSummary((v) => !v)}
              >
                <FileText className="h-3.5 w-3.5" />
                {showSummary ? "Hide" : "View"} Conversation Summary
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => setPhase("survey")}
              >
                <ClipboardList className="h-3.5 w-3.5" /> Complete feedback survey
              </Button>
              <Button size="sm" variant="ghost" className="gap-1.5" disabled>
                <Stethoscope className="h-3.5 w-3.5" /> Talk to your child's provider
              </Button>
              <Button size="sm" variant="ghost" className="gap-1.5" disabled>
                <BookOpen className="h-3.5 w-3.5" /> Learn more from approved resources
              </Button>
            </div>
          )}

          <footer className="hidden items-start gap-2 rounded-xl border border-warning/30 bg-warning/5 p-3 text-[11px] leading-relaxed text-warning-foreground sm:flex">
            <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p>
              Do not enter personal health identifiers. For medical advice, talk with your child's
              healthcare provider. In an emergency, call 911. Conversations are not stored;
              refreshing this page clears the chat.
            </p>
          </footer>
        </main>

        <aside className="hidden w-72 shrink-0 flex-col gap-4 lg:flex">
          <GoalsPanel />
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <FlaskConical className="h-4 w-4 text-accent-foreground" /> Prototype controls
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Stakeholder views — hidden from parents.
            </p>
            <div className="mt-3 flex flex-col gap-2">
              <Button size="sm" variant="outline" onClick={() => setResearchOpen(true)} className="justify-start gap-2">
                <FlaskConical className="h-3.5 w-3.5" /> Research View
              </Button>
              <Button size="sm" variant="outline" onClick={() => setSettingsOpen(true)} className="justify-start gap-2">
                <Code2 className="h-3.5 w-3.5" /> Developer Settings
              </Button>
              <Button size="sm" variant="ghost" onClick={signOut} className="justify-start gap-2 text-muted-foreground">
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-border bg-secondary/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
      {children}
    </span>
  );
}

function TopBanner({
  onHome,
  showHome = true,
  onSignOut,
  onDev,
  onResearch,
  onReset,
  canReset,
}: {
  onHome: () => void;
  showHome?: boolean;
  onSignOut: () => void;
  onDev: () => void;
  onResearch: () => void;
  onReset: () => void;
  canReset: boolean;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <div className="shrink-0 border-b border-border bg-primary/95 text-primary-foreground">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-3 py-1.5 text-[11px] sm:px-4">
        <span className="truncate font-medium uppercase tracking-wide">
          <span className="sm:hidden">Research prototype</span>
          <span className="hidden sm:inline">
            University research prototype · Not for clinical use
          </span>
        </span>

        {/* Desktop inline actions */}
        <div className="hidden items-center gap-1 sm:flex">
          {showHome && (
            <button
              type="button"
              onClick={onHome}
              className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] uppercase tracking-wide hover:bg-white/10"
            >
              <Home className="h-3 w-3" /> Welcome
            </button>
          )}
          <button
            type="button"
            onClick={onResearch}
            className="rounded px-2 py-0.5 text-[11px] uppercase tracking-wide hover:bg-white/10"
          >
            Research View
          </button>
          <Link
            to="/docs"
            className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] uppercase tracking-wide hover:bg-white/10"
          >
            <BookOpen className="h-3 w-3" /> API Docs
          </Link>
          <button
            type="button"
            onClick={onDev}
            className="rounded px-2 py-0.5 text-[11px] uppercase tracking-wide hover:bg-white/10"
          >
            Developer Settings
          </button>
          <button
            type="button"
            onClick={onSignOut}
            className="rounded px-2 py-0.5 text-[11px] uppercase tracking-wide hover:bg-white/10"
          >
            Sign out
          </button>
        </div>

        {/* Mobile hamburger */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              aria-label="Open menu"
              className="inline-flex h-7 w-7 items-center justify-center rounded hover:bg-white/10 sm:hidden"
            >
              <Menu className="h-4 w-4" />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 sm:w-80">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <nav className="mt-6 flex flex-col gap-1">
              {showHome && (
                <MenuItem
                  icon={<Home className="h-4 w-4" />}
                  label="Welcome"
                  onClick={() => {
                    close();
                    onHome();
                  }}
                />
              )}
              <MenuItem
                icon={<RotateCcw className="h-4 w-4" />}
                label="Reset chat"
                disabled={!canReset}
                onClick={() => {
                  close();
                  onReset();
                }}
              />
              <div className="my-2 h-px bg-border" />
              <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Prototype controls
              </p>
              <MenuItem
                icon={<FlaskConical className="h-4 w-4" />}
                label="Research View"
                onClick={() => {
                  close();
                  onResearch();
                }}
              />
              <Link
                to="/docs"
                onClick={close}
                className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-foreground hover:bg-accent"
              >
                <BookOpen className="h-4 w-4" />
                API Docs & Data Model
              </Link>
              <MenuItem
                icon={<Code2 className="h-4 w-4" />}
                label="Developer Settings"
                onClick={() => {
                  close();
                  onDev();
                }}
              />
              <div className="my-2 h-px bg-border" />
              <MenuItem
                icon={<LogOut className="h-4 w-4" />}
                label="Sign out"
                onClick={() => {
                  close();
                  onSignOut();
                }}
              />
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-50 disabled:hover:bg-transparent"
    >
      <span className="text-muted-foreground">{icon}</span>
      {label}
    </button>
  );
}

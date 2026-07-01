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
import { ChatMessage, type ChatMessageMeta } from "./ChatMessage";
import { PasswordGate } from "./PasswordGate";
import { SettingsSidebar } from "./SettingsSidebar";
import { WelcomeScreen } from "./WelcomeScreen";
import { StepIndicator } from "./StepIndicator";
import { GoalsPanel } from "./GoalsPanel";
import { CompletionPrompt } from "./CompletionPrompt";
import { SummaryCard } from "./SummaryCard";
import { ResearchView } from "./ResearchView";
import { SurveyScreen } from "./SurveyScreen";
import type { SimulationScenario } from "@/lib/mira/simulation-scenarios";
import { SimulationControls } from "./SimulationControls";
import {
  SIMULATED_PARENT_SCENARIOS,
  SIMULATED_PARENT_DEFAULT_DELAY_MS,
  SIMULATED_PARENT_INITIAL_DELAY_MS,
  SIMULATION_MAX_TURNS,
  SIMULATED_PARENT_VERSION,
  type SimulatedParentType,
  type SimulationStatus,
  type SimulationTurnResult,
} from "@/lib/mira/simulated-parent-scenarios";
import {
  MIRA_DEFAULT_MODEL,
  MIRA_SYSTEM_PROMPT,
  type MiraModel,
} from "@/lib/mira/system-prompt";
import { BROAD_OPENING, RESPECTFUL_CLOSE } from "@/lib/mira/phase-prompts";
import {
  createInitialSessionState,
  type MiSessionState,
  type OrchestrateResponse,
  type SupervisorReport,
  type DeveloperTrace,
} from "@/lib/mira/mi-types";
import messageSoundAsset from "@/assets/iphone-message.mp3.asset.json";
import typingSoundAsset from "@/assets/typing-message.mp3.asset.json";

export interface TraceEvent {
  turn: number;
  parentMessage: string;
  assistantReply: string;
  state: MiSessionState;
  supervisor: SupervisorReport;
  trace?: DeveloperTrace;
  latencyMs?: number;
}

type Msg = { role: "user" | "assistant"; content: string };
type Phase = "welcome" | "chat" | "survey";

function generateSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `s_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}

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
  const [sessionState, setSessionState] = useState<MiSessionState>(() =>
    createInitialSessionState(generateSessionId()),
  );
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: BROAD_OPENING },
  ]);
  const [traceEvents, setTraceEvents] = useState<TraceEvent[]>([]);
  const [developerMode, setDeveloperMode] = useState<boolean>(true);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [parentTyping, setParentTyping] = useState(false);
  const [showMeta, setShowMeta] = useState(true);
  const [showSimControls, setShowSimControls] = useState(true);

  // Simulated Parent (synthetic test) state — in-memory only.
  const [simulatedPersona, setSimulatedPersona] = useState<SimulatedParentType | null>(null);
  const [simStatus, setSimStatus] = useState<SimulationStatus>("idle");
  const [simTurnIndex, setSimTurnIndex] = useState(0);
  const [simResults, setSimResults] = useState<SimulationTurnResult[]>([]);
  const [simStartedAt, setSimStartedAt] = useState<number | null>(null);
  const simCtl = useRef({
    pause: false,
    stop: false,
    step: false,
    started: false,
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesRef = useRef<Msg[]>(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  const sessionStateRef = useRef<MiSessionState>(sessionState);
  useEffect(() => {
    sessionStateRef.current = sessionState;
  }, [sessionState]);

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
    stopSimulation("stopped");
    setSimulatedPersona(null);
    setSimResults([]);
    setSimTurnIndex(0);
    setSimStartedAt(null);
    setSimStatus("idle");
    setMessages([{ role: "assistant", content: BROAD_OPENING }]);
    setSessionState(createInitialSessionState(generateSessionId()));
    setTraceEvents([]);
    setPhase("welcome");
    setSurveySubmitted(false);
    setShowSummary(false);
    setDismissedCompletion(false);
    setAuthState("out");
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isSending, parentTyping]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [isSending]);

  // Play a notification sound when the assistant sends a new message.
  // Skip the initial broad opening (messages.length === 1) so the user isn't
  // surprised by audio on first load.
  const messageAudioRef = useRef<HTMLAudioElement | null>(null);
  const typingAudioRef = useRef<HTMLAudioElement | null>(null);
  const lastPlayedCountRef = useRef<number>(0);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const audio = new Audio(messageSoundAsset.url);
    audio.preload = "auto";
    messageAudioRef.current = audio;
    const typing = new Audio(typingSoundAsset.url);
    typing.preload = "auto";
    typing.loop = true;
    typingAudioRef.current = typing;
  }, []);
  const stopTypingSound = () => {
    const t = typingAudioRef.current;
    if (!t) return;
    try {
      t.pause();
      t.currentTime = 0;
    } catch {
      // ignore
    }
  };
  useEffect(() => {
    const t = typingAudioRef.current;
    if (!t) return;
    if (isSending) {
      try {
        t.currentTime = 0;
        const r = t.play();
        if (r && typeof r.catch === "function") r.catch(() => {});
      } catch {
        // ignore
      }
    } else {
      stopTypingSound();
    }
  }, [isSending]);
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (
      last?.role === "assistant" &&
      messages.length > 1 &&
      messages.length !== lastPlayedCountRef.current
    ) {
      lastPlayedCountRef.current = messages.length;
      stopTypingSound();
      const audio = messageAudioRef.current;
      if (!audio) return;
      try {
        audio.currentTime = 0;
        const result = audio.play();
        if (result && typeof result.catch === "function") {
          result.catch(() => {
            // Autoplay may be blocked until the user interacts with the page.
          });
        }
      } catch {
        // Ignore playback errors (e.g. unsupported format, autoplay policy).
      }
    }
  }, [messages]);

  const sendText = async (
    text: string,
  ): Promise<{ state: MiSessionState; supervisor: SupervisorReport } | null> => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return null;
    if (sessionStateRef.current.isComplete) return null;
    setError(null);
    const prevMessages = messagesRef.current;
    const userMsg: Msg = { role: "user", content: trimmed };
    messagesRef.current = [...prevMessages, userMsg];
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsSending(true);
    const startedAt = Date.now();
    try {
      const res = await fetch("/api/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history: prevMessages,
          state: sessionStateRef.current,
          model,
          developerMode,
        }),
      });
      const data = (await res.json()) as Partial<OrchestrateResponse> & { error?: string };
      if (res.status === 401) {
        // Don't blow away the whole app to the login screen mid-turn — that
        // wipes an active simulated-parent run and its state. Surface the
        // error inline; the user can sign in again from the menu.
        throw new Error("Session expired. Please sign in again from the menu.");
      }
      if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
      const reply = data.content ?? "";
      const assistantMsg: Msg = { role: "assistant", content: reply };
      messagesRef.current = [...messagesRef.current, assistantMsg];
      setMessages((prev) => [...prev, assistantMsg]);
      if (data.state) {
        sessionStateRef.current = data.state;
        setSessionState(data.state);
      }
      if (data.supervisor && data.state) {
        const evt: TraceEvent = {
          turn: data.state.turnCount,
          parentMessage: trimmed,
          assistantReply: reply,
          state: data.state,
          supervisor: data.supervisor,
          trace: data.developerTrace,
          latencyMs: Date.now() - startedAt,
        };
        setTraceEvents((prev) => [...prev, evt]);
      }
      if (data.state?.isComplete) {
        const closeMsg: Msg = { role: "assistant", content: RESPECTFUL_CLOSE };
        messagesRef.current = [...messagesRef.current, closeMsg];
        setMessages((prev) => [...prev, closeMsg]);
      }
      if (data.state && data.supervisor) {
        return { state: data.state, supervisor: data.supervisor };
      }
      return null;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed.");
      return null;
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
    stopSimulation("stopped");
    setSimResults([]);
    setSimTurnIndex(0);
    setSimStartedAt(null);
    setSimStatus("idle");
    simCtl.current.started = false;
    setMessages([{ role: "assistant", content: BROAD_OPENING }]);
    setSessionState(createInitialSessionState(generateSessionId()));
    setTraceEvents([]);
    setInput("");
    setError(null);
    setShowSummary(false);
    setDismissedCompletion(false);
  };

  const runSimulation = async (scenario: SimulationScenario) => {
    if (simulationRunning) return;
    setSimulationRunning(true);
    try {
      for (const turn of scenario.turns) {
        if (sessionState.isComplete) break;
        await sendText(turn);
        await new Promise((r) => setTimeout(r, 250));
      }
    } finally {
      setSimulationRunning(false);
    }
  };

  // --- Simulated Parent runner -----------------------------------------
  const sleep = (ms: number) =>
    new Promise<void>((resolve) => setTimeout(resolve, ms));

  function stopSimulation(reason: "stopped" | "completed") {
    simCtl.current.stop = true;
    simCtl.current.pause = false;
    simCtl.current.step = false;
    setSimStatus((s) => (s === "idle" ? s : reason));
  }

  async function runSimulatedParent(personaId: SimulatedParentType) {
    const scenario = SIMULATED_PARENT_SCENARIOS[personaId];
    simCtl.current.stop = false;
    simCtl.current.pause = false;
    simCtl.current.step = false;
    setSimResults([]);
    setSimTurnIndex(0);
    setSimStartedAt(Date.now());
    setSimStatus("running");

    const cap = Math.min(scenario.turns.length, SIMULATION_MAX_TURNS);
    for (let i = 0; i < cap; i++) {
      if (simCtl.current.stop) break;
      setSimTurnIndex(i);
      // Wait while paused (unless a single-step was requested).
      while (simCtl.current.pause && !simCtl.current.step && !simCtl.current.stop) {
        await sleep(100);
      }
      if (simCtl.current.stop) break;
      const wasStep = simCtl.current.step;
      simCtl.current.step = false;
      const delay = i === 0 ? SIMULATED_PARENT_INITIAL_DELAY_MS : SIMULATED_PARENT_DEFAULT_DELAY_MS;
      await sleep(delay);
      if (simCtl.current.stop) break;

      const turn = scenario.turns[i];
      // Ask the Navigator API to generate a natural parent message in
      // this persona's voice, using the scripted turn as the INTENT only.
      let parentMessage = turn.content;
      let usedAi = false;
      try {
        const priorHistory = messagesRef.current;
        setParentTyping(true);
        const res = await fetch("/api/simulate-parent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model,
            personaId,
            scriptedTurnId: turn.id,
            scriptedContent: turn.content,
            history: priorHistory,
          }),
        });
        if (res.ok) {
          const data = (await res.json()) as { content?: string };
          if (data.content && data.content.trim()) {
            parentMessage = data.content.trim();
            usedAi = true;
          }
        }
      } catch {
        // Network error: fall back to the scripted content verbatim.
      } finally {
        setParentTyping(false);
      }
      if (!usedAi) {
        console.warn("[SimulatedParent] Falling back to scripted content for turn", turn.id);
      }
      if (simCtl.current.stop) break;
      const result = await sendText(parentMessage);
      const expectedPhase = turn.expectedPhase;
      const expectedStance = turn.expectedStance;
      const actualPhase = result?.state.phase ?? null;
      const actualStance = result?.state.stance ?? null;
      const outcome = result?.state.outcome ?? null;
      const verdict = result?.supervisor.verdict ?? null;
      const respectfulClose = !!result?.state.isComplete;
      let resultLabel: SimulationTurnResult["result"] = "Review";
      if (!result) resultLabel = "Stopped";
      else if (respectfulClose) resultLabel = "Closed correctly";
      else if (actualPhase === expectedPhase && actualStance === expectedStance)
        resultLabel = "Pass";

      setSimResults((prev) => [
        ...prev,
        {
          turnId: turn.id,
          scenarioId: personaId,
          scenarioVersion: SIMULATED_PARENT_VERSION,
          scriptedContent: turn.content,
          expectedPhase,
          expectedStance,
          actualPhase,
          actualStance,
          outcome,
          verdict,
          regeneration: result?.supervisor.revisionRequested ?? false,
          fallback: result?.supervisor.fallbackUsed ?? false,
          result: resultLabel,
        },
      ]);

      if (!result) {
        setSimStatus("stopped");
        return;
      }
      if (result.state.isComplete || result.state.outcome === "CLOSE") {
        setSimStatus("completed");
        return;
      }
      if (wasStep) {
        // After single-step, return to paused.
        simCtl.current.pause = true;
        setSimStatus("paused");
      }
    }
    if (!simCtl.current.stop) setSimStatus("completed");
  }

  // Kick off the simulation when we enter chat with a persona selected.
  useEffect(() => {
    if (phase !== "chat" || !simulatedPersona) return;
    if (simCtl.current.started) return;
    simCtl.current.started = true;
    // Wrap so an uncaught error inside the runner can't bubble past React
    // and force a page reload back to the login screen.
    runSimulatedParent(simulatedPersona).catch((err) => {
      console.error("[SimulatedParent] Runner crashed:", err);
      simCtl.current.stop = true;
      simCtl.current.pause = false;
      simCtl.current.step = false;
      simCtl.current.started = false;
      setParentTyping(false);
      setSimStatus("stopped");
      setError(
        err instanceof Error
          ? err.message
          : "The simulated parent runner stopped unexpectedly.",
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, simulatedPersona]);

  // Cancel automation when leaving the chat phase or on unmount.
  useEffect(() => {
    if (phase !== "chat" && simCtl.current.started) {
      simCtl.current.stop = true;
      simCtl.current.pause = false;
      simCtl.current.step = false;
      simCtl.current.started = false;
      setSimStatus((s) => (s === "running" || s === "paused" ? "stopped" : s));
    }
  }, [phase]);

  useEffect(() => {
    return () => {
      simCtl.current.stop = true;
    };
  }, []);

  const onSimPause = () => {
    simCtl.current.pause = true;
    setSimStatus("paused");
  };
  const onSimResume = () => {
    simCtl.current.pause = false;
    simCtl.current.step = false;
    setSimStatus("running");
  };
  const onSimNext = () => {
    simCtl.current.step = true;
    if (simStatus === "paused") setSimStatus("running");
  };
  const onSimStop = () => {
    simCtl.current.stop = true;
    simCtl.current.pause = false;
    simCtl.current.step = false;
    setSimStatus("stopped");
  };
  const onSimSwitchToManual = () => {
    onSimStop();
    setSimulatedPersona(null);
  };

  const simActive = simStatus === "running" || simStatus === "paused";
  const inputDisabled = isSending || simStatus === "running";

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Ignore Enter while the user is composing in an IME (e.g. Japanese, Chinese, Korean).
    // `isComposing` and keyCode 229 both indicate an active composition.
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    if (e.key === "Enter" && !e.shiftKey && !e.repeat) {
      e.preventDefault();
      send();
    }
  };

  const visible = messages;
  const userTurns = useMemo(() => visible.filter((m) => m.role === "user"), [visible]);
  // Map each visible message to its MI-flow metadata: assistant messages get the
  // full trace (including supervisor/quality signals); user messages get the AI's
  // read of the parent after that turn (stance, permission, concern, route).
  const messageMeta = useMemo(() => {
    const map = new Map<number, ChatMessageMeta>();
    let assistantOrdinal = -1; // first assistant is the broad opening, no trace
    let userOrdinal = 0;
    visible.forEach((m, i) => {
      if (m.role === "assistant") {
        if (assistantOrdinal >= 0) {
          const ev = traceEvents[assistantOrdinal];
          if (ev) map.set(i, { state: ev.state, supervisor: ev.supervisor, trace: ev.trace });
        }
        assistantOrdinal += 1;
      } else {
        const ev = traceEvents[userOrdinal];
        if (ev) {
          // Omit latency and supervisor verdict from the user-side meta; those
          // describe the assistant reply, not the parent's turn.
          const userTrace = ev.trace ? { ...ev.trace, latencyMs: undefined } : undefined;
          map.set(i, { state: ev.state, trace: userTrace });
        }
        userOrdinal += 1;
      }
    });
    return map;
  }, [visible, traceEvents]);
  const showCompletion =
    !dismissedCompletion &&
    (userTurns.length >= 4 || sessionState.isComplete) &&
    !isSending &&
    phase === "chat";
  const firstUserMessage = userTurns[0]?.content ?? "";

  const startChat = (prefill?: string) => {
    // Reset chat state for a clean run when starting from welcome.
    if (messages.length > 1 || userTurns.length > 0) {
      setMessages([{ role: "assistant", content: BROAD_OPENING }]);
      setSessionState(createInitialSessionState(generateSessionId()));
      setTraceEvents([]);
      setSimResults([]);
      setSimTurnIndex(0);
    }
    simCtl.current.started = false;
    simCtl.current.stop = false;
    setPhase("chat");
    if (prefill && !simulatedPersona) {
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
        <WelcomeScreen
          onStart={startChat}
          simulatedPersona={simulatedPersona}
          onSimulatedPersonaChange={setSimulatedPersona}
        />
        <SettingsSidebar
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          model={model}
          onModelChange={setModel}
          systemPrompt={systemPrompt}
          onSystemPromptChange={setSystemPrompt}
          disabled={isSending}
          developerMode={developerMode}
          onDeveloperModeChange={setDeveloperMode}
        />
        <ResearchView
          open={researchOpen}
          onOpenChange={setResearchOpen}
          surveyCompleted={surveySubmitted}
          messageCount={visible.length}
          model={model}
          sessionState={sessionState}
          traceEvents={traceEvents}
          developerMode={developerMode}
          onRunSimulation={runSimulation}
          simulationRunning={simulationRunning}
          simulatedPersona={simulatedPersona}
          simStatus={simStatus}
          simTurnIndex={simTurnIndex}
          simResults={simResults}
          simStartedAt={simStartedAt}
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
          developerMode={developerMode}
          onDeveloperModeChange={setDeveloperMode}
        />
        <ResearchView
          open={researchOpen}
          onOpenChange={setResearchOpen}
          surveyCompleted={surveySubmitted}
          messageCount={visible.length}
          model={model}
          sessionState={sessionState}
          traceEvents={traceEvents}
          developerMode={developerMode}
          onRunSimulation={runSimulation}
          simulationRunning={simulationRunning}
          simulatedPersona={simulatedPersona}
          simStatus={simStatus}
          simTurnIndex={simTurnIndex}
          simResults={simResults}
          simStartedAt={simStartedAt}
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

      <header className="hidden shrink-0 border-b border-border bg-card/70 backdrop-blur sm:block">
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
        developerMode={developerMode}
        onDeveloperModeChange={setDeveloperMode}
        showMeta={showMeta}
        onShowMetaChange={setShowMeta}
      />
      <ResearchView
        open={researchOpen}
        onOpenChange={setResearchOpen}
        surveyCompleted={surveySubmitted}
        messageCount={visible.length}
        model={model}
        sessionState={sessionState}
        traceEvents={traceEvents}
        developerMode={developerMode}
        onRunSimulation={runSimulation}
        simulationRunning={simulationRunning}
        simulatedPersona={simulatedPersona}
        simStatus={simStatus}
        simTurnIndex={simTurnIndex}
        simResults={simResults}
        simStartedAt={simStartedAt}
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
            {visible.map((m, i) => {
              const meta = messageMeta.get(i) ?? null;
              return (
                <ChatMessage
                  key={i}
                  role={m.role}
                  content={m.content}
                  miTag={m.role === "assistant" ? inferMiTag(m.content) : null}
                  meta={meta}
                  showMeta={showMeta}
                />
              );
            })}
            {parentTyping && (
              <div className="flex items-center gap-3 self-end" aria-live="polite" aria-label="Simulated parent is typing">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Simulated parent is typing</span>
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/70 [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/70 [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/70" />
                  </span>
                </div>
              </div>
            )}
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

            {/* Concern chips removed per design — keep the chat surface uncluttered. */}
          </div>

          <div className="shrink-0 border-t border-border bg-card p-2 sm:mt-3 sm:rounded-2xl sm:border sm:p-3 sm:shadow-md">
            {simulatedPersona && simActive && (
              showSimControls ? (
                <SimulationControls
                status={simStatus}
                personaLabel={SIMULATED_PARENT_SCENARIOS[simulatedPersona].label}
                turnIndex={simTurnIndex}
                totalTurns={SIMULATED_PARENT_SCENARIOS[simulatedPersona].turns.length}
                onPause={onSimPause}
                onResume={onSimResume}
                onNext={onSimNext}
                onStop={onSimStop}
                onSwitchToManual={onSimSwitchToManual}
                />
              ) : (
                <p className="mb-2 text-[11px] text-muted-foreground">
                  Simulated parent ({SIMULATED_PARENT_SCENARIOS[simulatedPersona].label}) is running in the background. Turn {Math.min(simTurnIndex + 1, SIMULATED_PARENT_SCENARIOS[simulatedPersona].turns.length)} of {SIMULATED_PARENT_SCENARIOS[simulatedPersona].turns.length}. Player hidden via developer settings.
                </p>
              )
            )}
            {simulatedPersona && isSending && (
              <p
                aria-live="polite"
                className="mb-2 text-[11px] text-muted-foreground"
              >
                Simulated parent is preparing a response…
              </p>
            )}
            <div className="flex items-end gap-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={
                  simStatus === "running"
                    ? "Automated simulation in progress…"
                    : "Share a thought or question…"
                }
                rows={1}
                disabled={inputDisabled}
                className="max-h-40 min-h-[48px] resize-none border-0 bg-transparent text-base shadow-none focus-visible:ring-0"
                autoFocus
              />
              <Button
                onClick={send}
                disabled={inputDisabled || !input.trim()}
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
          <span className="sm:hidden">MiraChat</span>
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
          <SheetContent
            side="right"
            onCloseAutoFocus={(event) => event.preventDefault()}
            className="w-72 sm:w-80"
          >
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
                  setTimeout(() => onResearch(), 350);
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
                  setTimeout(() => onDev(), 350);
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

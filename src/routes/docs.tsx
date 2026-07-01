import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  Database,
  MessageSquare,
  Network,
  Radar,
  ShieldAlert,
} from "lucide-react";
import { useState } from "react";
import { MermaidDiagram } from "@/components/mira/MermaidDiagram";

export const Route = createFileRoute("/docs")({
  component: DocsPage,
  head: () => ({
    meta: [
      { title: "MiraChat – API Docs & Data Model" },
      {
        name: "description",
        content:
          "Planned API surface, data model, and architecture for the MiraChat motivational interviewing prototype.",
      },
    ],
  }),
});

const flowChart = `flowchart TD
  Parent([Parent / Caregiver]) -->|opens link| Web[MiraChat Web App]
  Web -->|password gate| Auth[/POST /api/auth/login/]
  Auth -->|session cookie| Web
  Web -->|consent + survey| Survey[/POST /api/surveys/]
  Web -->|user turn| Chat[/POST /api/orchestrate/]
  Chat --> Orchestrator{MI Orchestrator}
  Orchestrator -->|system prompt + history| LLM[LLM Provider]
  Orchestrator -->|retrieve facts| RAG[(HPV Knowledge Base)]
  Orchestrator -->|safety check| Safety[Safety / PII Filter]
  LLM --> Orchestrator
  Orchestrator -->|assistant turn + MI tags| Web
  Orchestrator -->|persist| DB[(Postgres)]
  Web -->|end session| Summary[/POST /api/conversations/:id/summarize/]
  Summary --> Orchestrator
  DB --> Researcher([Researcher Dashboard])
  Researcher -->|read-only| Analytics[/GET /api/research/*/]`;

const erChart = `erDiagram
  USERS ||--o{ CONSENTS : signs
  USERS ||--o{ CONVERSATIONS : has
  USERS ||--o{ SURVEY_RESPONSES : submits
  CONVERSATIONS ||--|{ MESSAGES : contains
  CONVERSATIONS ||--o| SUMMARIES : produces
  CONVERSATIONS ||--o{ MI_ANNOTATIONS : tagged_with
  MESSAGES ||--o{ MI_ANNOTATIONS : labeled_by
  CONVERSATIONS ||--o{ SAFETY_EVENTS : raises
  USERS ||--o{ AUDIT_LOGS : generates

  USERS {
    uuid id PK
    text email
    text role
    text study_id
    timestamptz created_at
  }
  CONSENTS {
    uuid id PK
    uuid user_id FK
    text version
    bool agreed
    timestamptz signed_at
  }
  CONVERSATIONS {
    uuid id PK
    uuid user_id FK
    text status
    text model
    int turn_count
    timestamptz started_at
    timestamptz ended_at
  }
  MESSAGES {
    uuid id PK
    uuid conversation_id FK
    text role
    text content
    jsonb tokens
    timestamptz created_at
  }
  SUMMARIES {
    uuid id PK
    uuid conversation_id FK
    text concerns
    text reflections
    text next_steps
    timestamptz created_at
  }
  MI_ANNOTATIONS {
    uuid id PK
    uuid message_id FK
    text mi_tag
    float confidence
    text source
  }
  SAFETY_EVENTS {
    uuid id PK
    uuid conversation_id FK
    text category
    text action
    timestamptz created_at
  }
  SURVEY_RESPONSES {
    uuid id PK
    uuid user_id FK
    text instrument
    jsonb answers
    timestamptz submitted_at
  }
  AUDIT_LOGS {
    uuid id PK
    uuid user_id FK
    text action
    jsonb metadata
    timestamptz created_at
  }`;

const dualAgentChart = `flowchart TD
  Parent([Parent]) --> Browser[MiraChat Browser]
  Browser -->|POST /api/orchestrate| Server[Server Orchestrator]
  Server --> Router{MI Routing Engine}
  Router -->|stance + permission + node| PhasePrompt[Phase Prompt Assembler]
  PhasePrompt --> Conv[MI Conversation Agent]
  Conv -->|candidate reply| Sup[Supervisor Agent]
  Sup -->|APPROVED| Server
  Sup -->|REVISE once| Conv
  Sup -->|BLOCK or unsafe| Fallback[Controlled Fallback]
  Fallback --> Server
  Server -->|approved reply only| Browser
  MockRAG[(Mock Approved Content)] --> PhasePrompt`;

const phaseSequenceChart = `sequenceDiagram
  participant P as Parent
  participant E as Routing Engine
  participant C as MI Conversation Agent
  participant S as Supervisor Agent
  P->>E: Turn 1 (broad opening reply)
  E->>C: Phase 1 prompt
  C->>S: Candidate reply
  S->>P: Approved reply
  P->>E: Turn 2 (HPV concern)
  E->>C: Phase 2 prompt (reflect + seek permission)
  C->>S: Candidate reply
  S->>P: Approved reply
  P->>E: Permission GRANTED
  E->>C: Phase 3 prompt + mock-approved source
  C->>S: Candidate reply
  S->>P: Approved reply
  P->>E: Discusses next step
  E->>C: Phase 4 prompt
  C->>S: Candidate reply
  S->>P: Approved reply
  E->>P: Phase 5 close`;

const routingLoopChart = `flowchart LR
  In[Parent message] --> Stance[Classify stance]
  In --> Perm[Detect permission]
  In --> Concern[Detect concern category]
  In --> Hard{Refuse / advice / injection?}
  Hard -->|yes| Fallback[Controlled fallback]
  Hard -->|no| Node[Select routing node]
  Stance --> Node
  Perm --> Node
  Concern --> Node
  Node --> Outcome[Outcome + next phase]
  Outcome --> Out[Updated MiSessionState]`;

const prodBoundaryChart = `flowchart LR
  subgraph Prototype["Prototype (today)"]
    P1[Password gate]
    P2[In-memory MiSessionState]
    P3[Mock approved content]
    P4[Navigator Toolkit LLM]
    P5[No persistence]
    P6[Simulated Parent + Sim Lab]
    P7[Meta chips visible]
  end
  subgraph Production["Production (planned)"]
    Q1[SSO / magic-link + IRB consent]
    Q2[Postgres + RLS session store]
    Q3[Approved RAG corpus + citations]
    Q4[Trained MIDT model + evals gate]
    Q5[Audit log + safety event pipeline]
    Q6[Removed from parent build]
    Q7[Hidden from parent build]
  end
  P1 --> Q1
  P2 --> Q2
  P3 --> Q3
  P4 --> Q4
  P5 --> Q5
  P6 --> Q6
  P7 --> Q7`;

interface Endpoint {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  purpose: string;
  auth: string;
  request?: string;
  response?: string;
}

const endpointGroups: { group: string; endpoints: Endpoint[] }[] = [
  {
    group: "Auth & Session",
    endpoints: [
      {
        method: "POST",
        path: "/api/auth/login",
        purpose: "Exchange access password for a session cookie (prototype gate today; will become magic-link / SSO).",
        auth: "Public",
        request: `{ "password": "string" }`,
        response: `{ "ok": true, "user": { "id": "uuid", "study_id": "string" } }`,
      },
      {
        method: "POST",
        path: "/api/auth/logout",
        purpose: "Clear the session cookie.",
        auth: "Session",
        response: `{ "ok": true }`,
      },
      {
        method: "GET",
        path: "/api/auth/me",
        purpose: "Return the current participant + active consent version.",
        auth: "Session",
        response: `{ "user": {...}, "consent": { "version": "1.0", "agreed": true } }`,
      },
    ],
  },
  {
    group: "Consent",
    endpoints: [
      {
        method: "POST",
        path: "/api/consents",
        purpose: "Record IRB-aligned consent before any chat data is stored.",
        auth: "Session",
        request: `{ "version": "1.0", "agreed": true }`,
      },
    ],
  },
  {
    group: "Conversations",
    endpoints: [
      {
        method: "POST",
        path: "/api/conversations",
        purpose: "Start a new MI conversation. Returns id + initial greeting.",
        auth: "Session",
        request: `{ "model": "gpt-...", "prefill?": "string" }`,
        response: `{ "id": "uuid", "greeting": "string" }`,
      },
      {
        method: "GET",
        path: "/api/conversations/:id",
        purpose: "Fetch full transcript + status + MI tags.",
        auth: "Session (owner)",
      },
      {
        method: "POST",
        path: "/api/conversations/:id/messages",
        purpose: "Send a user turn; streams the assistant response back (SSE).",
        auth: "Session (owner)",
        request: `{ "content": "string" }`,
        response: `text/event-stream of { delta, mi_tag, done }`,
      },
      {
        method: "POST",
        path: "/api/conversations/:id/summarize",
        purpose: "Generate a structured end-of-session summary card.",
        auth: "Session (owner)",
        response: `{ "concerns": [...], "reflections": [...], "next_steps": [...] }`,
      },
      {
        method: "POST",
        path: "/api/conversations/:id/end",
        purpose: "Mark conversation complete and trigger summary + survey hand-off.",
        auth: "Session (owner)",
      },
    ],
  },
  {
    group: "Knowledge / RAG",
    endpoints: [
      {
        method: "GET",
        path: "/api/knowledge/search",
        purpose: "Vector + keyword search over approved HPV vaccine sources used for grounding.",
        auth: "Server-to-server",
        request: `?q=string&topK=5`,
        response: `{ "hits": [{ "source": "CDC", "url": "...", "snippet": "..." }] }`,
      },
      {
        method: "POST",
        path: "/api/knowledge/ingest",
        purpose: "Admin: re-ingest curated source documents into the embeddings store.",
        auth: "Admin",
      },
    ],
  },
  {
    group: "Safety",
    endpoints: [
      {
        method: "POST",
        path: "/api/safety/check",
        purpose: "Run content + PII filters before persisting a user message or showing an LLM reply.",
        auth: "Internal",
        response: `{ "allow": true, "categories": [], "redactions": [...] }`,
      },
      {
        method: "POST",
        path: "/api/safety/events",
        purpose: "Log a safety trigger (self-harm, medical emergency, off-topic abuse).",
        auth: "Internal",
      },
    ],
  },
  {
    group: "Surveys",
    endpoints: [
      {
        method: "GET",
        path: "/api/surveys/:instrument",
        purpose: "Fetch instrument definition (pre/post HPV attitudes, intent, satisfaction).",
        auth: "Session",
      },
      {
        method: "POST",
        path: "/api/surveys",
        purpose: "Submit a survey response payload.",
        auth: "Session",
        request: `{ "instrument": "post_chat_v1", "answers": { ... } }`,
      },
    ],
  },
  {
    group: "Research / Admin",
    endpoints: [
      {
        method: "GET",
        path: "/api/research/conversations",
        purpose: "De-identified conversations with MI tags for researcher review.",
        auth: "Researcher",
      },
      {
        method: "GET",
        path: "/api/research/metrics",
        purpose: "Aggregate metrics: completion rate, avg turns, MI-fidelity scores, concern frequencies.",
        auth: "Researcher",
      },
      {
        method: "POST",
        path: "/api/research/export",
        purpose: "Queue an IRB-approved data export (CSV/JSONL) to secure storage.",
        auth: "Admin",
      },
    ],
  },
  {
    group: "Prototype / Testing",
    endpoints: [
      {
        method: "POST",
        path: "/api/orchestrate",
        purpose:
          "Live prototype endpoint that runs the MI Routing Engine, MI Conversation Agent, and Supervisor Agent for a single turn. Returns the approved reply plus (when developerMode is on) a structured developer trace.",
        auth: "Session",
        request: `{ "message": "...", "history": [...], "state": {...}, "model": "...", "developerMode": true }`,
        response: `{ "content": "...", "state": {...}, "supervisor": {...}, "developerTrace": {...} }`,
      },
      {
        method: "POST",
        path: "/api/simulate-parent",
        purpose:
          "Rewrite a scripted simulated-parent turn in the selected persona's natural voice using the Navigator API. The scripted content is used as intent only and is never sent to the MI Agent or Supervisor.",
        auth: "Session",
        request: `{ "model": "...", "personaId": "...", "scriptedTurnId": "...", "scriptedContent": "...", "history": [...] }`,
        response: `{ "content": "natural parent message" }`,
      },
    ],
  },
];

function MethodBadge({ method }: { method: Endpoint["method"] }) {
  const colors: Record<Endpoint["method"], string> = {
    GET: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
    POST: "bg-sky-500/10 text-sky-700 border-sky-500/30",
    PATCH: "bg-amber-500/10 text-amber-700 border-amber-500/30",
    DELETE: "bg-rose-500/10 text-rose-700 border-rose-500/30",
  };
  return (
    <span
      className={`inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase ${colors[method]}`}
    >
      {method}
    </span>
  );
}

function DocsPage() {
  return <DocsPageInner />;
}

const TOC_GROUPS: { label: string; items: { id: string; label: string }[] }[] = [
  {
    label: "Architecture",
    items: [
      { id: "architecture", label: "MIDT dual-agent architecture" },
      { id: "phase-flow", label: "Five-phase conversation flow" },
      { id: "routing-loop", label: "Routing decision loop" },
      { id: "how-it-works", label: "How the app works" },
    ],
  },
  {
    label: "Contracts & schemas",
    items: [
      { id: "session-state", label: "MiSessionState" },
      { id: "routing-node", label: "RoutingNode schema" },
      { id: "developer-trace", label: "DeveloperTrace" },
      { id: "orchestrate-api", label: "Orchestrate API" },
      { id: "db-schema", label: "Database schema" },
    ],
  },
  {
    label: "Evaluation & tooling",
    items: [
      { id: "performance-radar", label: "Performance Radar" },
      { id: "sim-lab", label: "Simulation Lab" },
      { id: "sim-parent", label: "Simulated Parent" },
      { id: "chat-ui", label: "Chat UI & overlays" },
    ],
  },
  {
    label: "Operations",
    items: [
      { id: "versioning", label: "Versioning & pinning" },
      { id: "prod-boundary", label: "Prototype → Production" },
      { id: "api-endpoints", label: "API endpoints" },
    ],
  },
];

function DocsSidebar() {
  return (
    <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-60 shrink-0 overflow-y-auto rounded-2xl border border-border bg-card/60 p-4 text-sm lg:block">
      <div className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        On this page
      </div>
      <nav className="flex flex-col gap-4">
        {TOC_GROUPS.map((group) => (
          <div key={group.label} className="flex flex-col gap-1">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/80">
              {group.label}
            </div>
            {group.items.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="rounded px-2 py-1 text-[13px] text-foreground/80 hover:bg-secondary hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}

function DocsPageInner() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/30">
      <div className="border-b border-border bg-primary/95 text-primary-foreground">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-3 py-1.5 text-[11px] sm:px-4">
          <span className="truncate font-medium uppercase tracking-wide">
            University research prototype · Not for clinical use
          </span>
          <Link
            to="/"
            className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] uppercase tracking-wide hover:bg-white/10"
          >
            <ArrowLeft className="h-3 w-3" /> Back to chat
          </Link>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-6xl gap-6 px-4 py-8 sm:py-10">
        <DocsSidebar />
        <main className="flex min-w-0 flex-1 flex-col gap-10">
        <header className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
              <BookOpen className="h-3 w-3" /> MIDT Docs · API & Architecture
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-warning/40 bg-warning/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-warning-foreground">
              Prototype · routing & supervisor live
            </span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            MiraChat – MIDT routing & dual-agent prototype
          </h1>
          <p className="max-w-3xl text-base text-muted-foreground">
            MiraChat now demonstrates the configuration-driven MI Routing Engine and dual-agent
            (MI Conversation Agent + Supervisor Agent) architecture proposed for MIDT. Today's
            prototype implements{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">/api/orchestrate</code>{" "}
            with mock approved content. The endpoints below remain a planning artifact for the
            production build-out.
          </p>
        </header>

        <section className="rounded-2xl border border-warning/30 bg-warning/5 p-4 text-sm text-foreground">
          <div className="flex items-start gap-2">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning-foreground" />
            <p>
              <strong>Prototype boundary.</strong> MiraChat is a prototype of the Digital Twin
              chatbot experience. It is not the MIRA Reviewer evaluation app, not a production
              clinical tool, and not yet connected to the final trained model, approved RAG
              knowledge base, study survey database, or production safety monitoring. Phase 2
              through Phase 5 content remains draft and configuration-driven.
            </p>
          </div>
        </section>

        <section id="architecture" className="scroll-mt-24 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Network className="h-4 w-4 text-primary" />
            <h2 className="text-xl font-semibold tracking-tight">MIDT dual-agent architecture</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            The MI Routing Engine selects a phase + node and assembles a phase-specific prompt
            for the MI Conversation Agent. The Supervisor Agent reviews every candidate reply
            before it is returned to the parent.
          </p>
          <MermaidDiagram chart={dualAgentChart} />
        </section>

        <section id="phase-flow" className="scroll-mt-24 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Network className="h-4 w-4 text-primary" />
            <h2 className="text-xl font-semibold tracking-tight">Five-phase conversation flow</h2>
          </div>
          <MermaidDiagram chart={phaseSequenceChart} />
        </section>

        <section id="routing-loop" className="scroll-mt-24 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Network className="h-4 w-4 text-primary" />
            <h2 className="text-xl font-semibold tracking-tight">Routing decision loop</h2>
          </div>
          <MermaidDiagram chart={routingLoopChart} />
        </section>

        <section id="orchestrate-api" className="scroll-mt-24 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <h2 className="text-xl font-semibold tracking-tight">Prototype orchestrate API</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            <code className="rounded bg-muted px-1 py-0.5 text-xs">POST /api/orchestrate</code>{" "}
            accepts the parent message plus the in-memory routing state and returns the approved
            reply, the updated state, the supervisor verdict, and (when developerMode is on) a
            structured developer trace.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <pre className="overflow-x-auto rounded-md border border-border bg-muted/40 p-2 text-[11px]">
{`Request
{
  "message": "...",
  "history": [{ "role": "user|assistant", "content": "..." }],
  "state": {
    "sessionId": "...",
    "phase": "P1",
    "nodeId": "P1-OPEN",
    "stance": "UNKNOWN",
    "permissionState": "UNKNOWN",
    "turnCount": 0,
    "isComplete": false,
    "routingVersion": "routing-draft-0.1",
    "promptVersion": "mi-playbook-draft-0.1"
  },
  "model": "...",
  "developerMode": true
}`}
            </pre>
            <pre className="overflow-x-auto rounded-md border border-border bg-muted/40 p-2 text-[11px]">
{`Response
{
  "content": "approved parent-facing reply",
  "state": { /* MiSessionState */ },
  "supervisor": {
    "verdict": "APPROVED" | "REVISE" | "BLOCK",
    "requiredMoves": ["CR","SEEK"],
    "observedMoves": ["CR","SEEK"],
    "violations": [],
    "fallbackUsed": false,
    "revisionRequested": false
  },
  "developerTrace": {
    "previousNode": "P1-OPEN",
    "selectedNode": "P1-HPV-EARLY-01",
    "selectedOutcome": "MOVE-P2",
    "classificationConfidence": 0.82
  }
}`}
            </pre>
          </div>
          <p className="text-xs text-muted-foreground">
            Supervisor verdicts: APPROVED, REVISE, BLOCK. Violation categories: PERSUADE,
            CONFRONT, PREMATURE_INFORMATION, NO_PERMISSION, UNSUPPORTED_MEDICAL_CLAIM,
            INDIVIDUALIZED_MEDICAL_ADVICE, QUESTION_STACKING, EXCESSIVE_LENGTH, PROMPT_LEAKAGE,
            OUT_OF_SCOPE, UNSAFE. No chain-of-thought or hidden reasoning is ever returned to
            the browser.
          </p>
        </section>

        <section id="performance-radar" className="scroll-mt-24 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Radar className="h-4 w-4 text-primary" />
            <h2 className="text-xl font-semibold tracking-tight">Performance Radar</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            The Research View exposes a live <strong>Performance Radar</strong> tab that evaluates
            the MIDT Agent, Supervisor Agent, and Simulated Parent Agent across five QUEST axes. It
            is intended as a development aid and planning artifact; scores are heuristic proxies, not
            validated clinical metrics.
          </p>
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary/50 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-2">Axis</th>
                  <th className="px-4 py-2">Agent(s)</th>
                  <th className="px-4 py-2">Target</th>
                  <th className="px-4 py-2">Prototype proxy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  {
                    axis: "Expression (MI Fidelity)",
                    agents: "MIDT Agent",
                    target: "R:Q ≥ 2, %CR ≥ 40%",
                    proxy: "Reflection-to-question ratio + complex-reflection share from assistant replies",
                  },
                  {
                    axis: "Safety & Restraint",
                    agents: "Supervisor Agent",
                    target: "≥ 95% clean turns",
                    proxy: "Share of turns with zero violations and no fallback; revision/fallback rates",
                  },
                  {
                    axis: "Factual Groundedness",
                    agents: "MIDT Agent",
                    target: "Faithfulness ≥ 0.9",
                    proxy: "RAG-backed turns in P3/P4 + unsupported medical-claim sentence ratio",
                  },
                  {
                    axis: "Context Precision & Relevancy",
                    agents: "MIDT + Parent Agent",
                    target: "≥ 0.85",
                    proxy: "Outcome-bearing turns for MIDT; stance/phase match vs expected for Parent Agent",
                  },
                  {
                    axis: "Efficiency & Latency",
                    agents: "All agents",
                    target: "Avg < 3000 ms",
                    proxy: "TTFT and average per-turn latency from the routing trace",
                  },
                ].map((row, i) => (
                  <tr key={i}>
                    <td className="px-4 py-2.5 font-medium text-foreground">{row.axis}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{row.agents}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{row.target}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{row.proxy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">
            The radar renders a colored pentagon for each agent: MIDT Agent in blue, Supervisor Agent
            in green, and Simulated Parent Agent in amber. All axes start at 0 and fill in as turns
            occur. A companion table below the chart shows per-agent scores, raw counts, and the
            underlying metrics (R:Q, %CR, faithfulness, restraint rate, revision rate, fallback rate,
            RAG hits, TTFT, average latency, turn count). The Performance Radar is a research
            development tool, not a validated MITI or clinical evaluation.
          </p>
        </section>

        <section id="chat-ui" className="scroll-mt-24 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            <h2 className="text-xl font-semibold tracking-tight">Chat UI & developer overlays</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Each chat bubble can surface MI-flow metadata inline. Assistant bubbles show the
            inferred MI technique tag, routing phase/node, supervisor verdict, and any revision or
            fallback flags. Parent/user bubbles show the AI's read of that turn: detected stance,
            permission state, concern category, and routing outcome. Developer Settings → Model
            includes a{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">Show meta chips</code> toggle
            that defaults to on. Developer Settings and Research View open as non-modal sidebars so
            the chat stays visible and interactive while inspecting traces, scripts, or supervisor
            verdicts.
          </p>
        </section>

        <section id="session-state" className="scroll-mt-24 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" />
            <h2 className="text-xl font-semibold tracking-tight">Session state contract (MiSessionState)</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            The Research View → MI Routing tab renders the live{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">MiSessionState</code> object.
            It travels with every <code className="rounded bg-muted px-1 py-0.5 text-xs">/api/orchestrate</code>{" "}
            request and response. The server never trusts client-supplied phase/stance blindly —
            the routing engine recomputes them each turn. In production this object must be
            persisted server-side and keyed by session, not sent from the browser.
          </p>
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary/50 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-2">Field</th>
                  <th className="px-4 py-2">Type / values</th>
                  <th className="px-4 py-2">Meaning</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  ["sessionId", "uuid", "In-memory session identifier. Rotates on refresh (no persistence today)."],
                  ["phase", "P1 · P2 · P3 · P4 · P5", "Open → Elicit concerns → Ask-Offer-Ask (with permission) → Plan / next step → Close."],
                  ["nodeId", "e.g. P1-OPEN, P1-HPV-EARLY-01, P3-PERMISSION-01", "Selected routing node inside the active phase."],
                  ["stance", "UNKNOWN · WILLING · AMBIV · OPPOSED", "Parent stance classified from the latest turn + running signal."],
                  ["permissionState", "UNKNOWN · GRANTED · DENIED", "Whether the parent has explicitly permitted information sharing (gates P3 facts)."],
                  ["concernCategory", "string?", "Detected concern (e.g. fertility, side-effects, age, autonomy). Optional."],
                  ["turnCount", "number", "Turns exchanged in this session."],
                  ["outcome", "CONT-P1…P5 · MOVE-P2…P5 · CLOSE", "Routing decision produced this turn."],
                  ["isComplete", "boolean", "Session closed (P5 or hard short-circuit). Blocks further orchestrator work in production."],
                  ["routingVersion", "e.g. routing-draft-0.1", "Pinned routing-engine version for this session (audit trail)."],
                  ["promptVersion", "e.g. mi-playbook-draft-0.1", "Pinned prompt-playbook version for this session (audit trail)."],
                ].map(([f, t, m]) => (
                  <tr key={f}>
                    <td className="px-4 py-2 font-mono text-xs text-foreground">{f}</td>
                    <td className="px-4 py-2 font-mono text-[11px] text-muted-foreground">{t}</td>
                    <td className="px-4 py-2 text-sm text-muted-foreground">{m}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">
            Supervisor short-circuits: refusal → respectful close; individualized medical advice
            → defer-to-provider; prompt-injection → controlled cannot-answer. Each sets{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">outcome=CLOSE</code> or a
            fallback and is logged as a supervisor violation.
          </p>
        </section>

        <section id="routing-node" className="scroll-mt-24 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Network className="h-4 w-4 text-primary" />
            <h2 className="text-xl font-semibold tracking-tight">Routing node schema</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Developer Settings → Phases lists every configured{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">RoutingNode</code>. Nodes are
            static configuration bundled with the build; adding, renaming, or removing a node
            requires a code change and a bumped{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">ROUTING_VERSION</code>. Each
            node contributes a slice of the assembled phase prompt sent to the MI Conversation
            Agent and gives the Supervisor Agent its required/prohibited checklist.
          </p>
          <pre className="overflow-x-auto rounded-md border border-border bg-muted/40 p-3 text-[11px]">
{`interface RoutingNode {
  nodeId: string;              // e.g. "P3-PERMISSION-01"
  phase: "P1"|"P2"|"P3"|"P4"|"P5";
  title: string;               // human label shown in dev tools
  goal: string;                // what the node is trying to accomplish this turn
  allowedContent: string[];    // topics the MI Agent MAY discuss at this node
  prohibitedContent: string[]; // topics that trigger a supervisor BLOCK
  requiredMiMoves: string[];   // e.g. ["CR","SEEK-PERMISSION"] — supervisor checks these
  optionalMiMoves: string[];   // e.g. ["OQ","AF"]
  permittedOutcomes: RoutingOutcome[]; // which transitions this node may emit
  transitionCriteria: string[];        // heuristic hints used by the router
  contentStatus: "mock"|"draft"|"approved"; // gates production release
  version: string;             // per-node change tracking
}`}
          </pre>
          <p className="text-xs text-muted-foreground">
            In production, only nodes with{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">contentStatus === "approved"</code>{" "}
            should ship to parents. Today every node is <code className="rounded bg-muted px-1 py-0.5 text-xs">mock</code>{" "}
            or <code className="rounded bg-muted px-1 py-0.5 text-xs">draft</code>.
          </p>
        </section>

        <section id="developer-trace" className="scroll-mt-24 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <h2 className="text-xl font-semibold tracking-tight">Developer trace fields</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            When <code className="rounded bg-muted px-1 py-0.5 text-xs">developerMode: true</code>{" "}
            is set on <code className="rounded bg-muted px-1 py-0.5 text-xs">/api/orchestrate</code>,
            the response includes a <code className="rounded bg-muted px-1 py-0.5 text-xs">developerTrace</code>{" "}
            object surfaced across Research View tabs and chat meta chips. It is never returned in
            the parent-facing production build.
          </p>
          <pre className="overflow-x-auto rounded-md border border-border bg-muted/40 p-3 text-[11px]">
{`interface DeveloperTrace {
  previousNode: string;             // node before this turn
  selectedNode: string;             // node chosen this turn
  selectedOutcome: RoutingOutcome;  // routing decision emitted
  classificationConfidence: number; // 0..1 stance/concern classifier confidence
  detectedKeywords?: string[];      // stance / concern keywords matched
  candidateLengthChars?: number;    // MI Agent draft length (supervisor length gate)
  retrievedSourceIds?: string[];    // mock RAG source IDs (prototype only)
  latencyMs?: number;               // orchestrate turn latency
}`}
          </pre>
        </section>

        <section id="sim-lab" className="scroll-mt-24 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Network className="h-4 w-4 text-primary" />
            <h2 className="text-xl font-semibold tracking-tight">Simulation Lab catalog</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Research View → Sim Lab ships synthetic scenarios that drive scripted parent turns
            through the live orchestrator. They are the primary regression harness for routing
            and supervisor behavior.
          </p>
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary/50 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-2">Scenario</th>
                  <th className="px-4 py-2">Expected behavior</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  ["Willing / open parent", "Routes P1-WILLING-01 → P2 → P3 (permission GRANTED)."],
                  ["Questioning / ambivalent parent", "Routes through P1-AMBIV-01 then P2 elicitation."],
                  ["Opposed / resistant parent", "Routes to P1-OPPOSED-01 and respectful close."],
                  ["Early fertility concern", "Routes to P1-HPV-EARLY-01; reflection + permission, no facts yet."],
                  ["Parent refuses to continue", "Triggers respectful close; isComplete = true."],
                  ["Individualized medical advice request", "Controlled defer-to-provider fallback."],
                  ["Permission denied", "P3-DENIED-01; no facts shared."],
                  ["Permission granted", "P3-PERMISSION-01; mock-approved content used."],
                  ["Prompt-injection attempt", "Controlled cannot-answer fallback; supervisor blocks."],
                  ["Repeated concern", "Reflection and consistent routing within Phase 2."],
                  ["Vague low-information response", "Stays in P1 with open questions and reflections."],
                ].map(([s, e]) => (
                  <tr key={s}>
                    <td className="px-4 py-2 font-medium text-foreground">{s}</td>
                    <td className="px-4 py-2 text-sm text-muted-foreground">{e}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">
            Sim Lab scripts are synthetic. No participant data is generated, and scripted content
            is never used as training data.
          </p>
        </section>

        <section id="sim-parent" className="scroll-mt-24 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            <h2 className="text-xl font-semibold tracking-tight">Simulated Parent scenarios</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            The optional Simulated Parent mode uses three persona scripts (Willing, Ambivalent,
            Opposed) of seven turns each. Each scripted turn is rewritten by{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">/api/simulate-parent</code>{" "}
            in the persona's natural voice — the scripted text is intent only, never sent to the
            MI Agent or Supervisor. Configuration lives in Developer Settings → Sim Parent.
          </p>
          <pre className="overflow-x-auto rounded-md border border-border bg-muted/40 p-3 text-[11px]">
{`interface SimulatedParentScenario {
  id: "willing" | "ambivalent" | "opposed";
  label: string;
  description: string;
  startingStance: ParentStance;
  turns: SimulatedParentTurn[]; // 7 scripted turns
}

interface SimulatedParentTurn {
  id: string;
  expectedPhase: "P1"|"P2"|"P3"|"P4"|"P5";
  expectedStance: ParentStance;
  content: string; // scripted intent, rewritten before send
}

SIMULATED_PARENT_VERSION          = "simulated-parent-0.1"
SIMULATED_PARENT_DEFAULT_DELAY_MS = 1200
SIMULATED_PARENT_INITIAL_DELAY_MS = 1000
SIMULATION_MAX_TURNS              = 12`}
          </pre>
          <p className="text-sm text-muted-foreground">
            Research View → Sim Parent renders a per-turn results table comparing expected vs.
            actual routing:
          </p>
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary/50 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-2">Result</th>
                  <th className="px-4 py-2">Meaning</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  ["Pass", "Actual phase and stance match the scripted expectation for this turn."],
                  ["Review", "Phase or stance drifted from the expected value — likely tuning needed, not necessarily a failure."],
                  ["Fail", "Supervisor blocked, fallback fired unexpectedly, or the turn crashed."],
                  ["Closed correctly", "Router terminated the session as scripted (e.g. respectful close for Opposed persona)."],
                ].map(([r, m]) => (
                  <tr key={r}>
                    <td className="px-4 py-2 font-medium text-foreground">{r}</td>
                    <td className="px-4 py-2 text-sm text-muted-foreground">{m}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">
            Simulated Parent is developer-only. The player UI (Pause / Resume / Next / Stop /
            Switch to manual) can be hidden via Developer Settings → Model → “Show simulated
            parent player” without stopping an active run.
          </p>
        </section>

        <section id="versioning" className="scroll-mt-24 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-primary" />
            <h2 className="text-xl font-semibold tracking-tight">Versioning &amp; session pinning</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Every session captures the active{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">routingVersion</code> and{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">promptVersion</code> the first
            time <code className="rounded bg-muted px-1 py-0.5 text-xs">createInitialSessionState</code>{" "}
            runs. Those values must be echoed back on every subsequent orchestrate call so a
            deployment mid-session does not silently switch a parent onto a new playbook.
            Prototype defaults today:
          </p>
          <ul className="ml-6 list-disc text-sm text-muted-foreground">
            <li><code className="rounded bg-muted px-1 py-0.5 text-xs">ROUTING_VERSION = "routing-draft-0.1"</code></li>
            <li><code className="rounded bg-muted px-1 py-0.5 text-xs">PROMPT_VERSION = "mi-playbook-draft-0.1"</code></li>
            <li><code className="rounded bg-muted px-1 py-0.5 text-xs">SIMULATED_PARENT_VERSION = "simulated-parent-0.1"</code></li>
          </ul>
          <p className="text-xs text-muted-foreground">
            Bump the version any time you change routing nodes, phase prompts, supervisor prompt,
            or the shared MI foundation. In production these are the audit-log join key for
            comparing outcomes across playbook revisions.
          </p>
        </section>

        <section id="prod-boundary" className="scroll-mt-24 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Network className="h-4 w-4 text-primary" />
            <h2 className="text-xl font-semibold tracking-tight">From prototype to production</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Map of what needs to be replaced or removed to plug MiraChat into a production study
            deployment. Left column is what ships in this prototype; right column is what a
            production build requires.
          </p>
          <MermaidDiagram chart={prodBoundaryChart} />
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary/50 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-2">Area</th>
                  <th className="px-4 py-2">Prototype today</th>
                  <th className="px-4 py-2">Production requirement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  ["Auth", "Shared dev password gate.", "SSO or magic-link; IRB-aligned consent recorded before any turn."],
                  ["Session state", "In-memory MiSessionState; refresh clears everything.", "Server-side persistence keyed by session; state never trusted from the client."],
                  ["Knowledge / RAG", "Mock approved content, prototype source IDs.", "Approved HPV corpus with citations and faithfulness scoring."],
                  ["Model", "Navigator Toolkit LLM via server proxy.", "Trained MIDT model gated by an eval suite (MITI, Ragas, safety)."],
                  ["Safety", "Supervisor prompt + hard short-circuits.", "Additional PII/self-harm classifier + escalation policy + on-call routing."],
                  ["Persistence", "None; no localStorage / DB.", "Postgres with RLS scoped to auth.uid(); researcher access via de-identified views."],
                  ["Simulated Parent + Sim Lab", "Shipped in the parent build behind toggles.", "Removed from parent bundle; kept in an internal QA build only."],
                  ["Meta chips / Research View / Dev Settings", "Available to any authenticated user.", "Stripped from the parent build; gated to researcher role in the QA build."],
                  ["Observability", "Client-side console + in-memory trace events.", "Structured server logs, supervisor-verdict metrics, latency SLOs, audit log."],
                  ["Versioning", "ROUTING_VERSION / PROMPT_VERSION pinned per session.", "Same, plus append-only change log and per-session playbook snapshot."],
                  ["Survey", "Mock in-app + optional REDCap hand-off.", "Study-approved instruments with signed REDCap hand-off and incentive tracking."],
                ].map((row) => (
                  <tr key={row[0]}>
                    <td className="px-4 py-2 font-medium text-foreground">{row[0]}</td>
                    <td className="px-4 py-2 text-sm text-muted-foreground">{row[1]}</td>
                    <td className="px-4 py-2 text-sm text-muted-foreground">{row[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-24 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Network className="h-4 w-4 text-primary" />
            <h2 className="text-xl font-semibold tracking-tight">How the app works</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            End-to-end request flow from a parent's browser through the MI orchestrator, knowledge
            base, safety filter, and persistence layer.
          </p>
          <MermaidDiagram chart={flowChart} />
        </section>

        <section id="db-schema" className="scroll-mt-24 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" />
            <h2 className="text-xl font-semibold tracking-tight">Database schema</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Postgres tables for users, consent, conversations, MI annotations, summaries, surveys,
            safety events, and audit logs. All participant-identifying fields would live behind
            RLS scoped to <code className="rounded bg-muted px-1 py-0.5 text-xs">auth.uid()</code>;
            researcher views read from de-identified materialized views.
          </p>
          <MermaidDiagram chart={erChart} />
        </section>

        <section id="api-endpoints" className="scroll-mt-24 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <h2 className="text-xl font-semibold tracking-tight">API endpoints</h2>
          </div>
          {endpointGroups.map((group) => (
            <div key={group.group} className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="border-b border-border bg-secondary/50 px-4 py-2 text-sm font-semibold">
                {group.group}
              </div>
              <ul className="divide-y divide-border">
                {group.endpoints.map((ep) => (
                  <li key={ep.method + ep.path} className="flex flex-col gap-2 px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <MethodBadge method={ep.method} />
                      <code className="font-mono text-sm font-medium text-foreground">
                        {ep.path}
                      </code>
                      <span className="ml-auto text-[11px] uppercase tracking-wide text-muted-foreground">
                        Auth: {ep.auth}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{ep.purpose}</p>
                    {(ep.request || ep.response) && (
                      <div className="grid gap-2 sm:grid-cols-2">
                        {ep.request && (
                          <pre className="overflow-x-auto rounded-md border border-border bg-muted/40 p-2 text-[11px]">
                            <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                              Request
                            </span>
                            {ep.request}
                          </pre>
                        )}
                        {ep.response && (
                          <pre className="overflow-x-auto rounded-md border border-border bg-muted/40 p-2 text-[11px]">
                            <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                              Response
                            </span>
                            {ep.response}
                          </pre>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <footer className="border-t border-border pt-6 text-xs text-muted-foreground">
          This document is a planning artifact for stakeholder discussion. Schemas and endpoints
          will be refined alongside IRB review and engineering scoping.
        </footer>
        </main>
      </div>
    </div>
  );
}
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BookOpen,
  Database,
  MessageSquare,
  Network,
  ShieldAlert,
} from "lucide-react";
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
  Web -->|user turn| Chat[/POST /api/chat/]
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

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-8 sm:py-10">
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

        <section className="flex flex-col gap-3">
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

        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Network className="h-4 w-4 text-primary" />
            <h2 className="text-xl font-semibold tracking-tight">Five-phase conversation flow</h2>
          </div>
          <MermaidDiagram chart={phaseSequenceChart} />
        </section>

        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Network className="h-4 w-4 text-primary" />
            <h2 className="text-xl font-semibold tracking-tight">Routing decision loop</h2>
          </div>
          <MermaidDiagram chart={routingLoopChart} />
        </section>

        <section className="flex flex-col gap-3">
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

        <section className="flex flex-col gap-3">
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

        <section className="flex flex-col gap-3">
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

        <section className="flex flex-col gap-4">
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
  );
}
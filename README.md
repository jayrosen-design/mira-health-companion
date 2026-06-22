# MiraChat – Digital Twin Conversation Prototype

MiraChat is a prototype interface for the **Digital Twin MI and HPV pilot**. It simulates a parent-facing, text-based motivational interviewing conversation about HPV vaccination using the **UF Navigator Toolkit** (`https://api.ai.it.ufl.edu`) and a system prompt. It is intended for stakeholder discussion and development testing only.

> This app is separate from the **MIRA Reviewer** prototype. MIRA Reviewer supports blinded response comparison and rating. **MiraChat** demonstrates the interactive digital twin chatbot experience.
>
> **Conceptual boundary:** MiraChat is a prototype of the Digital Twin chatbot experience. It is not the MIRA Reviewer evaluation app, not a production clinical tool, and not yet connected to the final trained model, approved RAG knowledge base, study survey database, or production safety monitoring.

## Privacy & security architecture

- Development password gate (shared Navigator Toolkit dev API key protection)
- Server-side API key only — never exposed to the browser
- Authenticated `/api/chat` proxy
- Basic rate limiting
- No browser or database persistence (no `localStorage` / `sessionStorage` / DB)
- Refresh clears the chat

It is **not a production clinical tool** and does not yet include:

- The approved RAG knowledge base
- The trained project model
- Study authentication / consent
- Survey data storage
- Production data handling, safety monitoring, or escalation

## What's in the prototype

- **Welcome screen** with AI disclosure, privacy notice, and clinical-use disclaimer
- **3-step participant flow** (Invitation → Chat → Survey)
- **Broad Phase 1 opening** ("…tell me a little about your approach to preventive health care for your child")
- **MIDT MI Routing Engine** — configuration-driven phases (P1–P5), routing nodes, parent stance (UNKNOWN / WILLING / AMBIV / OPPOSED), and permission state
- **Dual-agent orchestration** — `MI Conversation Agent` generates a candidate reply; the `Supervisor Agent` reviews it for MI fidelity, autonomy support, safety, scope, and prompt leakage; one revision is allowed; otherwise a controlled fallback is returned
- **Mock approved content** (clearly labeled, prototype-only) demonstrating Phase 3 Ask-Offer-Ask grounding
- **Conversation completion screen** and summary card
- **Mock survey** with optional REDCap incentive hand-off
- **Research View** with MI Routing trace, turn-by-turn event timeline, supervisor verdict + violations, mock source IDs, latency, and a **Simulation Lab** (synthetic scenarios for willing/ambivalent/opposed/refusal/medical-advice/permission/prompt-injection/repeat/vague)
- **Tabbed Developer Settings** (model, MI foundation, phase nodes, supervisor prompt, routing config) with a `Show developer routing inspector` toggle and reset
- **Simulated Parent mode** (optional, synthetic test only) — pick Willing/Open, Questioning/Ambivalent, or Opposed/Resistant on the welcome page to auto-play a scripted parent conversation through the live `/api/orchestrate` route. The MI Agent and Supervisor still process every turn; persona and expected phase/stance are never sent to either agent. Includes Pause / Resume / Send next / Stop / Switch to manual controls, a Research View turn-by-turn expected-vs-actual results table, and a Developer Settings preview of the three scripts. In-memory only, not training data.
- **Password gate** + server-side Navigator Toolkit API proxy + rate limiting
- **API Docs page** (`/docs`) with MIDT dual-agent architecture, five-phase sequence, routing decision loop (Mermaid), and the orchestrate request/response schema

## MIDT routing & dual-agent architecture

- `POST /api/orchestrate` runs the routing engine, MI Conversation Agent, and Supervisor Agent on the server. Only the approved final reply is returned to the participant.
- Routing state lives **in React memory and the request payload only** — no localStorage, sessionStorage, IndexedDB, or database persistence. Refresh clears the session.
- Participants never see internal phase, node, stance, permission, or supervisor labels.
- Hard short-circuits: refusal → respectful close; prompt-injection → controlled cannot-answer; individualized medical advice → defer to provider.
- Supervisor verdicts: `APPROVED`, `REVISE`, `BLOCK`. Hard-block violations (`UNSAFE`, `INDIVIDUALIZED_MEDICAL_ADVICE`, `UNSUPPORTED_MEDICAL_CLAIM`, `PROMPT_LEAKAGE`, `OUT_OF_SCOPE`) trigger a controlled fallback.
- Mock approved content is **prototype only** and is not the final approved clinical corpus.

## Important note on RAG

RAG grounding is **planned** for the production version. This prototype uses a prompt-based simulation only and does not yet ground medical claims in a verified knowledge base.

## Prototype boundary

This is a visual and functional prototype for stakeholder discussion. It is not the final Digital Twin system. Production versions would require approved model training, RAG grounding to verified HPV vaccine content, safety monitoring, authentication, study data storage, IRB-aligned consent language, and university-approved deployment.

## Planned architecture (see `/docs` in the app for full detail)

End-to-end flow:

```mermaid
flowchart TD
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
  DB --> Researcher([Researcher Dashboard])
```

Planned database schema:

```mermaid
erDiagram
  USERS ||--o{ CONSENTS : signs
  USERS ||--o{ CONVERSATIONS : has
  USERS ||--o{ SURVEY_RESPONSES : submits
  CONVERSATIONS ||--|{ MESSAGES : contains
  CONVERSATIONS ||--o| SUMMARIES : produces
  CONVERSATIONS ||--o{ MI_ANNOTATIONS : tagged_with
  MESSAGES ||--o{ MI_ANNOTATIONS : labeled_by
  CONVERSATIONS ||--o{ SAFETY_EVENTS : raises
  USERS ||--o{ AUDIT_LOGS : generates
```

Planned API surface (grouped):

- **Auth & Session** – `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- **Consent** – `POST /api/consents`
- **Conversations** – `POST /api/conversations`, `GET /api/conversations/:id`, `POST /api/conversations/:id/messages` (SSE), `POST /api/conversations/:id/summarize`, `POST /api/conversations/:id/end`
- **Knowledge / RAG** – `GET /api/knowledge/search`, `POST /api/knowledge/ingest`
- **Safety** – `POST /api/safety/check`, `POST /api/safety/events`
- **Surveys** – `GET /api/surveys/:instrument`, `POST /api/surveys`
- **Research / Admin** – `GET /api/research/conversations`, `GET /api/research/metrics`, `POST /api/research/export`

The live, interactive version of these docs (with method badges and request/response shapes) lives at **/docs** in the running app.

# Mira – Health Education Assistant

Prototype of **Mira**, a simple chatbot built on top of the **UF Navigator Toolkit** (`https://api.ai.it.ufl.edu`).

Mira is a conversational AI designed to support parents in making informed decisions about the HPV vaccine for their 9–12 year-olds. It uses a Motivational Interviewing (MI) system prompt to validate concerns, explore ambivalence, and share evidence-based information through an Ask‑Offer‑Ask framework.

> ⚠️ **Prototype – not for clinical use.** This is an educational demo. It does not store conversations, does not diagnose, and is not a substitute for medical advice.

## Features

- Clean, empathetic chat UI (TanStack Start + React + Tailwind + shadcn/ui)
- Model picker in the header with all Navigator Toolkit models:
  - `gpt-oss-120b` *(default)*
  - `nemotron-3-super-120b-a12b`
  - `gpt-oss-20b`
  - `llama-3.3-70b-instruct`
  - `llama-3.1-nemotron-nano-8B-v1`
  - `llama-3.1-8b-instruct`
  - `llama-3.1-70b-instruct`
- Enter to send, Shift+Enter for newline, IME-safe (no double-submits)
- "Mira is typing…" indicator while the model responds
- **No persistence** — all chat state lives in React memory; refresh clears it

## Privacy

Per the prototype's PHI-handling constraint:

- Messages are **never** written to `localStorage`, `sessionStorage`, cookies, IndexedDB, or any database.
- The Navigator API key is held **server-side only** and never exposed to the browser.
- The browser talks to a local proxy route (`/api/chat`) which forwards requests to the Navigator Toolkit using the server's API key.

## Architecture

```text
┌──────────────┐    POST /api/chat     ┌──────────────────┐    HTTPS    ┌──────────────────────────┐
│  React UI    │ ────────────────────▶ │ TanStack server  │ ──────────▶ │ api.ai.it.ufl.edu        │
│  (in-memory) │ ◀──────────────────── │ route (proxy)    │ ◀────────── │ (Navigator Toolkit)      │
└──────────────┘    { content }        └──────────────────┘             └──────────────────────────┘
```

Key files:

| Path | Purpose |
| --- | --- |
| `src/routes/index.tsx` | Home route — renders the chat |
| `src/components/mira/MiraChat.tsx` | Chat container (state, send logic, indicator) |
| `src/components/mira/ChatMessage.tsx` | User / Mira message styling |
| `src/components/mira/ModelSelect.tsx` | Header model dropdown |
| `src/lib/mira/system-prompt.ts` | Mira system prompt, model list, default |
| `src/routes/api/chat.ts` | Server proxy to the Navigator Toolkit |

## Configuration

The server route reads one secret:

| Name | Where | Purpose |
| --- | --- | --- |
| `AI_API_KEY` | Lovable Cloud → Secrets | Bearer token for `https://api.ai.it.ufl.edu` |

If the secret is missing, `/api/chat` returns `500 AI_API_KEY not configured` and the UI surfaces that error inline.

## Running locally

```bash
bun install
bun run dev
```

Then open the printed URL.

## How it works

1. The UI seeds the conversation with two messages it never displays:
   - The Mira **system prompt** (sent as `role: "user"` to maximize compatibility with OSS models that reject `role: "system"`)
   - Mira's opening greeting (sent as `role: "assistant"`)
2. When the user sends a message, the client POSTs `{ model, messages }` to `/api/chat`.
3. The server route attaches the Navigator API key and forwards the request to `https://api.ai.it.ufl.edu/chat/completions`.
4. The assistant reply is appended to the in-memory message list.

## Roadmap (out of scope for this prototype)

- Streaming responses
- RAG grounding against the verified HPV knowledge base
- Authenticated sessions and audit logging for clinical deployment
- Crisis-escalation hand-off

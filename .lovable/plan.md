# Mira — HPV Vaccine MI Chatbot

A single-page React chat app for "Mira," an empathetic conversational AI for HPV vaccine education. All chat state stays in React memory — nothing is written to localStorage, sessionStorage, cookies, or any database. No backend, no Lovable Cloud.

## Scope

- One conversation, no thread list, no history persistence (per PHI constraint).
- Direct browser → `https://api.ai.it.ufl.edu` calls via the `openai` npm package using `dangerouslyAllowBrowser: true`.
- API key read from `import.meta.env.VITE_AI_API_KEY` with a clear in-UI warning if missing.

## Files

- `src/routes/index.tsx` — replaces the placeholder with `<MiraChat />`, sets SEO head (title "Mira – Health Education Assistant", meta description, single H1 in page).
- `src/components/mira/MiraChat.tsx` — main chat container: header, messages, input, model state, send logic.
- `src/components/mira/ChatMessage.tsx` — message bubble (user vs Mira styling).
- `src/components/mira/ModelSelect.tsx` — header dropdown (shadcn `Select`).
- `src/lib/mira/system-prompt.ts` — exports the full Mira system prompt string verbatim.
- `src/lib/mira/client.ts` — builds the `openai` client (browser mode) and a `sendChat({ model, messages })` helper.
- `src/styles.css` — add a couple of soft, clinical-feeling semantic tokens (calm teal/blue accent, warm surface) in `oklch`. No hardcoded colors in components.

Install: `openai` via `bun add openai`.

## UI

- Header (sticky top): left = "Mira – Health Education Assistant" with a small subtitle "Health Education Assistant"; right = model `Select`.
- Chat window: scrollable, auto-scroll to bottom on new messages, max-width centered column, generous spacing.
  - Mira: no background bubble, just text on surface with a small avatar/initial.
  - User: filled bubble using `--primary` / `--primary-foreground` aligned right.
  - "Mira is typing…" shimmer while awaiting response.
- Input: `Textarea` + send `Button`. Enter sends, Shift+Enter inserts newline. Disabled while sending. Auto-focus on mount and after each send.
- Footer note (small, muted): "Conversations are not stored. Refreshing this page clears the chat."

## Models (dropdown options, exact strings)

```
gpt-oss-120b
nemotron-3-super-120b-a12b   ← default
gpt-oss-20b
llama-3.3-70b-instruct
llama-3.1-nemotron-nano-8B-v1
llama-3.1-8b-instruct
llama-3.1-70b-instruct
```

## Chat logic

State (all in `useState`, never persisted):
- `model: string` (default `nemotron-3-super-120b-a12b`)
- `messages: { role: "user" | "assistant"; content: string }[]`
- `input: string`, `isSending: boolean`, `error: string | null`

Initial `messages`:
1. `{ role: "user", content: SYSTEM_PROMPT }` — sent as `user` role per the spec's OSS-compatibility note.
2. `{ role: "assistant", content: "Hello! I'm glad you're here. What thoughts or questions do you have about the HPV vaccine for your child?" }`

UI rendering skips the first message (system prompt) so the user only sees Mira's greeting.

On send:
1. Append `{ role: "user", content: input }`.
2. Call `client.chat.completions.create({ model, messages: [...all messages including system prompt] })`.
3. Append assistant reply from `response.choices[0].message`.
4. On error (network/401/429/etc.) show an inline error banner with the message; keep the user's text so they can retry.

## API client

```ts
// src/lib/mira/client.ts
import OpenAI from "openai";

export const miraClient = new OpenAI({
  apiKey: import.meta.env.VITE_AI_API_KEY ?? "missing-key",
  baseURL: "https://api.ai.it.ufl.edu",
  dangerouslyAllowBrowser: true,
});
```

If `VITE_AI_API_KEY` is missing, show a dismissible banner: "API key not configured. Set `VITE_AI_API_KEY` in your hosting environment."

## Privacy / security notes

- No `localStorage`, `sessionStorage`, `IndexedDB`, cookies, or DB writes anywhere.
- No analytics or logging of message content.
- Refresh = full reset (intentional).
- The key is exposed to the browser by design of this spec; I'll add a short comment in `client.ts` noting that for production PHI use this should be proxied through a server-side route.

## Out of scope

- Threads / conversation history UI.
- Authentication, RAG backend, file uploads, image input.
- AI Elements install (single-conversation, no-persistence, custom clinical styling — building lightweight primitives directly is appropriate here; will note this exception in the implementation).

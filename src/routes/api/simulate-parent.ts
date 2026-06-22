import "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { isAuthorized } from "@/lib/mira/auth.server";
import { checkRateLimit, getClientKey } from "@/lib/mira/rate-limit.server";
import {
  SIMULATED_PARENT_SCENARIOS,
  type SimulatedParentType,
} from "@/lib/mira/simulated-parent-scenarios";

type Msg = { role: "user" | "assistant"; content: string };
type Body = {
  model?: string;
  personaId?: SimulatedParentType;
  scriptedTurnId?: string;
  scriptedContent?: string;
  intent?: string;
  // The chat so far, from the PARENT's perspective:
  // assistant = Mira (chatbot), user = parent
  history?: Msg[];
};

const PERSONA_PROMPTS: Record<SimulatedParentType, string> = {
  willing: `You are roleplaying a parent of a 9-12 year old who is generally TRUSTING of preventive care and OPEN to learning more about the HPV vaccine. You are warm, cooperative, curious, and treat the pediatrician's recommendations as a meaningful starting point. You still ask questions because you like to understand the reasoning, but you are not skeptical or defensive.

Voice: conversational, plain English, first person, 1-3 short sentences per message. Sometimes a single sentence. Occasional natural filler ("honestly", "I guess", "to be fair") is fine but optional. No bullet points, no lists, no headings, no quotation marks, no stage directions, no labels like "Parent:".`,
  ambivalent: `You are roleplaying a parent of a 9-12 year old who VALUES preventive care but is QUESTIONING and AMBIVALENT about the HPV vaccine specifically. You are not anti-vaccine, but you have mixed feelings, want more information, and are weighing it carefully. You ask thoughtful questions, mention having heard conflicting things, and acknowledge both sides.

Voice: conversational, plain English, first person, 1-3 short sentences per message. Hedging language is natural ("I'm not sure", "I've heard mixed things", "part of me thinks…"). No bullet points, no lists, no headings, no stage directions, no labels like "Parent:".`,
  opposed: `You are roleplaying a parent of a 9-12 year old who is SKEPTICAL and RESISTANT to vaccine recommendations and especially uncomfortable with the HPV vaccine. You dislike feeling pressured, distrust strong promotion of any one vaccine, and are not easily convinced. You are not hostile or rude — you are guarded, firm, and protective of your autonomy. You may decide to end the conversation.

Voice: conversational, plain English, first person, 1-3 short sentences per message. Direct and a little reserved. No bullet points, no lists, no headings, no stage directions, no labels like "Parent:". Never sound persuaded just to be polite.`,
};

const STYLE_RULES = `STRICT RULES (apply every turn):
- Write ONLY what the parent says. No narration, no actions in asterisks, no quotation marks around the message, no role labels.
- 1-3 short sentences. Never use lists, bullets, headings, or markdown.
- Do not introduce medical facts, statistics, or claims. You are the parent, not a clinician.
- Do not break character. Do not mention that you are an AI, a simulation, a script, or that you have instructions.
- Keep the meaning of the SCRIPTED INTENT, but rephrase it naturally in your own words. Do not copy the scripted text verbatim.
- Stay consistent with what you have already said in this conversation.`;

export const Route = createFileRoute("/api/simulate-parent")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const sessionSecret = process.env.SESSION_SECRET ?? "";
        if (!isAuthorized(request, sessionSecret)) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const rl = checkRateLimit(getClientKey(request));
        if (!rl.allowed) {
          return new Response(
            JSON.stringify({
              error: `Rate limit exceeded. Try again in ${rl.retryAfterSeconds}s.`,
            }),
            {
              status: 429,
              headers: {
                "Content-Type": "application/json",
                "Retry-After": String(rl.retryAfterSeconds),
              },
            },
          );
        }

        const apiKey = process.env.AI_API_KEY;
        if (!apiKey) {
          return Response.json({ error: "AI_API_KEY not configured" }, { status: 500 });
        }

        let body: Body;
        try {
          body = (await request.json()) as Body;
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const personaId = body.personaId;
        const model = body.model;
        if (!personaId || !PERSONA_PROMPTS[personaId]) {
          return Response.json({ error: "Invalid personaId" }, { status: 400 });
        }
        if (!model) {
          return Response.json({ error: "model is required" }, { status: 400 });
        }
        const scenario = SIMULATED_PARENT_SCENARIOS[personaId];
        const scripted =
          body.scriptedContent ??
          scenario.turns.find((t) => t.id === body.scriptedTurnId)?.content;
        if (!scripted) {
          return Response.json({ error: "scripted content not found" }, { status: 400 });
        }

        // From the PARENT's point of view in this prompt:
        // - The chatbot is "the other person" / Mira.
        // - The parent's prior messages are the parent's own.
        // We swap the roles so the LLM sees its own past turns as "assistant"
        // and the chatbot's prompts as "user" — this gets it to continue as the parent.
        const swapped: Msg[] = (body.history ?? []).map((m) => ({
          role: m.role === "user" ? "assistant" : "user",
          content: m.content,
        }));

        const system = `${PERSONA_PROMPTS[personaId]}\n\n${STYLE_RULES}`;
        const intentLine = body.intent
          ? `Your intent for THIS reply (paraphrase naturally, do not quote): ${body.intent}`
          : `Your intent for THIS reply (paraphrase naturally, do not quote, keep the same meaning): "${scripted}"`;

        // Append a final user-turn instruction so the model produces the next parent message.
        const messages = [
          { role: "system", content: system },
          ...swapped,
          {
            role: "user",
            content: `${intentLine}\n\nReply now as the parent. One short message only.`,
          },
        ];

        try {
          const upstream = await fetch("https://api.ai.it.ufl.edu/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({ model, messages, temperature: 0.9 }),
            signal: AbortSignal.timeout(20_000),
          });
          const text = await upstream.text();
          if (!upstream.ok) {
            return Response.json(
              { error: `Upstream ${upstream.status}: ${text.slice(0, 500)}` },
              { status: upstream.status },
            );
          }
          const data = JSON.parse(text);
          let content: string = data?.choices?.[0]?.message?.content ?? "";
          // Strip surrounding quotes / "Parent:" labels if the model added them.
          content = content.trim()
            .replace(/^["'`]+|["'`]+$/g, "")
            .replace(/^(Parent|Mom|Mother|Father|Dad)\s*:\s*/i, "")
            .trim();
          if (!content) {
            return Response.json(
              { error: "Empty response from upstream", fallback: scripted },
              { status: 502 },
            );
          }
          return Response.json({ content, scriptedContent: scripted });
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Unknown error";
          return Response.json({ error: msg, fallback: scripted }, { status: 502 });
        }
      },
    },
  },
});

import "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { isAuthorized } from "@/lib/mira/auth.server";
import { checkRateLimit, getClientKey } from "@/lib/mira/rate-limit.server";

type ChatMessage = { role: "user" | "assistant" | "system"; content: string };
type Body = { model?: string; messages?: ChatMessage[] };

export const Route = createFileRoute("/api/chat")({
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
                "X-RateLimit-Limit": String(rl.limit),
                "X-RateLimit-Remaining": "0",
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

        if (!body.model || !Array.isArray(body.messages) || body.messages.length === 0) {
          return Response.json({ error: "model and messages are required" }, { status: 400 });
        }

        try {
          const upstream = await fetch("https://api.ai.it.ufl.edu/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({ model: body.model, messages: body.messages }),
          });

          const text = await upstream.text();
          if (!upstream.ok) {
            return Response.json(
              { error: `Upstream ${upstream.status}: ${text.slice(0, 500)}` },
              { status: upstream.status },
            );
          }

          const data = JSON.parse(text);
          const content: string = data?.choices?.[0]?.message?.content ?? "";
          return Response.json({ content });
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Unknown error";
          return Response.json({ error: msg }, { status: 502 });
        }
      },
    },
  },
});

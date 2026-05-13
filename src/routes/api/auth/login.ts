import "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { buildSessionCookie, constantTimeEqual } from "@/lib/mira/auth.server";

export const Route = createFileRoute("/api/auth/login")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const password = process.env.MIRA_PASSWORD;
        const secret = process.env.SESSION_SECRET;
        if (!password || !secret) {
          return Response.json({ error: "Server not configured" }, { status: 500 });
        }
        let body: { password?: string };
        try {
          body = (await request.json()) as { password?: string };
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }
        if (!body.password || !constantTimeEqual(body.password, password)) {
          return Response.json({ error: "Invalid password" }, { status: 401 });
        }
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Set-Cookie": buildSessionCookie(secret),
          },
        });
      },
    },
  },
});

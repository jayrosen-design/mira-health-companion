import "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { isAuthorized } from "@/lib/mira/auth.server";

export const Route = createFileRoute("/api/auth/me")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const secret = process.env.SESSION_SECRET ?? "";
        return Response.json({ authenticated: isAuthorized(request, secret) });
      },
    },
  },
});

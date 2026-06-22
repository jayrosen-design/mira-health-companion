import "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { isAuthorized } from "@/lib/mira/auth.server";
import { checkRateLimit, getClientKey } from "@/lib/mira/rate-limit.server";
import { decideRouting } from "@/lib/mira/mi-routing-engine";
import {
  PROMPT_VERSION,
  ROUTING_VERSION,
  type DeveloperTrace,
  type MiSessionState,
  type OrchestrateRequest,
  type OrchestrateResponse,
  type SupervisorReport,
  type SupervisorViolation,
} from "@/lib/mira/mi-types";
import { buildPhasePrompt, SHARED_MI_FOUNDATION } from "@/lib/mira/phase-prompts";
import {
  buildSupervisorUserPrompt,
  FALLBACK_REPLIES,
  REVISION_INSTRUCTIONS,
  SUPERVISOR_SYSTEM_PROMPT,
} from "@/lib/mira/supervisor-prompt";
import { findMockSource } from "@/lib/mira/mock-approved-content";

type UpstreamMessage = { role: "system" | "user" | "assistant"; content: string };

async function callModel(
  apiKey: string,
  model: string,
  messages: UpstreamMessage[],
): Promise<string> {
  const res = await fetch("https://api.ai.it.ufl.edu/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Upstream ${res.status}: ${text.slice(0, 300)}`);
  const data = JSON.parse(text);
  return (data?.choices?.[0]?.message?.content ?? "") as string;
}

const KNOWN_VIOLATIONS: SupervisorViolation[] = [
  "PERSUADE",
  "CONFRONT",
  "PREMATURE_INFORMATION",
  "NO_PERMISSION",
  "UNSUPPORTED_MEDICAL_CLAIM",
  "INDIVIDUALIZED_MEDICAL_ADVICE",
  "QUESTION_STACKING",
  "EXCESSIVE_LENGTH",
  "PROMPT_LEAKAGE",
  "OUT_OF_SCOPE",
  "UNSAFE",
];

function parseSupervisor(raw: string): {
  verdict: SupervisorReport["verdict"];
  observedMoves: string[];
  violations: SupervisorViolation[];
  notes?: string;
} {
  // Extract first JSON object in the response.
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) {
    return { verdict: "REVISE", observedMoves: [], violations: [], notes: "unparseable" };
  }
  try {
    const obj = JSON.parse(raw.slice(start, end + 1));
    const verdict =
      obj.verdict === "APPROVED" || obj.verdict === "BLOCK" ? obj.verdict : "REVISE";
    const observedMoves = Array.isArray(obj.observedMoves)
      ? obj.observedMoves.filter((s: unknown) => typeof s === "string")
      : [];
    const violations = (Array.isArray(obj.violations) ? obj.violations : [])
      .filter((s: unknown): s is string => typeof s === "string")
      .filter((s: string): s is SupervisorViolation =>
        (KNOWN_VIOLATIONS as string[]).includes(s),
      );
    return {
      verdict,
      observedMoves,
      violations,
      notes: typeof obj.notes === "string" ? obj.notes : undefined,
    };
  } catch {
    return { verdict: "REVISE", observedMoves: [], violations: [], notes: "json-error" };
  }
}

function isHardBlock(violations: SupervisorViolation[]): boolean {
  const hard: SupervisorViolation[] = [
    "UNSAFE",
    "INDIVIDUALIZED_MEDICAL_ADVICE",
    "UNSUPPORTED_MEDICAL_CLAIM",
    "PROMPT_LEAKAGE",
    "OUT_OF_SCOPE",
  ];
  return violations.some((v) => hard.includes(v));
}

export const Route = createFileRoute("/api/orchestrate")({
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
        if (!apiKey)
          return Response.json({ error: "AI_API_KEY not configured" }, { status: 500 });

        let body: OrchestrateRequest;
        try {
          body = (await request.json()) as OrchestrateRequest;
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }
        if (!body?.message || !body?.state || !body?.model) {
          return Response.json(
            { error: "message, state, and model are required" },
            { status: 400 },
          );
        }

        const t0 = Date.now();

        // 1. Routing decision
        const decision = decideRouting(body.message, body.state);
        const nextState: MiSessionState = decision.nextState;

        // 2. Mock approved source (only meaningful for P3 grant)
        const mockSource =
          nextState.phase === "P3" && nextState.permissionState === "GRANTED"
            ? findMockSource(nextState.concernCategory)
            : null;

        // 3. Build conversation agent prompt
        const phasePrompt = buildPhasePrompt({
          node: decision.node,
          state: nextState,
          mockSource,
        });

        const baseHistory: UpstreamMessage[] = (body.history ?? []).map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const convMessages: UpstreamMessage[] = [
          { role: "system", content: SHARED_MI_FOUNDATION },
          { role: "system", content: phasePrompt },
          ...baseHistory,
          { role: "user", content: body.message },
        ];

        // Hard short-circuits
        let candidate = "";
        let fallbackUsed = false;
        let revisionRequested = false;

        try {
          if (decision.isRefusal) {
            candidate = FALLBACK_REPLIES.respectfulClose;
            fallbackUsed = true;
          } else if (decision.isPromptInjection) {
            candidate = FALLBACK_REPLIES.cannotAnswer;
            fallbackUsed = true;
          } else if (decision.isMedicalAdviceRequest) {
            candidate = FALLBACK_REPLIES.deferMedical;
            fallbackUsed = true;
          } else {
            candidate = await callModel(apiKey, body.model, convMessages);
          }
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Unknown error";
          return Response.json({ error: msg }, { status: 502 });
        }

        // 4. Supervisor (skip when we already returned a controlled fallback)
        let supervisor: SupervisorReport = {
          verdict: "APPROVED",
          requiredMoves: decision.node.requiredMiMoves,
          observedMoves: [],
          violations: [],
          fallbackUsed,
          revisionRequested: false,
        };

        if (!fallbackUsed) {
          try {
            const supRaw = await callModel(apiKey, body.model, [
              { role: "system", content: SUPERVISOR_SYSTEM_PROMPT },
              {
                role: "user",
                content: buildSupervisorUserPrompt({
                  node: decision.node,
                  permissionState: nextState.permissionState,
                  parentMessage: body.message,
                  candidateReply: candidate,
                }),
              },
            ]);
            const parsed = parseSupervisor(supRaw);
            supervisor = {
              verdict: parsed.verdict,
              requiredMoves: decision.node.requiredMiMoves,
              observedMoves: parsed.observedMoves,
              violations: parsed.violations,
              fallbackUsed: false,
              revisionRequested: false,
              notes: parsed.notes,
            };

            if (parsed.verdict === "REVISE" && !isHardBlock(parsed.violations)) {
              revisionRequested = true;
              const revised = await callModel(apiKey, body.model, [
                ...convMessages,
                { role: "assistant", content: candidate },
                { role: "system", content: REVISION_INSTRUCTIONS },
                {
                  role: "user",
                  content: `Supervisor violations: ${parsed.violations.join(", ") || "(none)"}. Notes: ${parsed.notes ?? ""}`,
                },
              ]);
              // Re-run supervisor lite check: if still hard-block, fallback.
              const sup2 = parseSupervisor(
                await callModel(apiKey, body.model, [
                  { role: "system", content: SUPERVISOR_SYSTEM_PROMPT },
                  {
                    role: "user",
                    content: buildSupervisorUserPrompt({
                      node: decision.node,
                      permissionState: nextState.permissionState,
                      parentMessage: body.message,
                      candidateReply: revised,
                    }),
                  },
                ]),
              );
              supervisor = {
                verdict: sup2.verdict,
                requiredMoves: decision.node.requiredMiMoves,
                observedMoves: sup2.observedMoves,
                violations: sup2.violations,
                fallbackUsed: false,
                revisionRequested: true,
                notes: sup2.notes,
              };
              if (sup2.verdict === "BLOCK" || isHardBlock(sup2.violations)) {
                candidate = FALLBACK_REPLIES.cannotAnswer;
                supervisor.fallbackUsed = true;
                fallbackUsed = true;
              } else {
                candidate = revised;
              }
            } else if (parsed.verdict === "BLOCK" || isHardBlock(parsed.violations)) {
              candidate = FALLBACK_REPLIES.cannotAnswer;
              supervisor.fallbackUsed = true;
              fallbackUsed = true;
            }
          } catch {
            // Supervisor unavailable: degrade gracefully but log nothing sensitive.
            supervisor = {
              verdict: "APPROVED",
              requiredMoves: decision.node.requiredMiMoves,
              observedMoves: [],
              violations: [],
              fallbackUsed: false,
              revisionRequested: false,
              notes: "supervisor-unavailable",
            };
          }
        }

        const developerTrace: DeveloperTrace | undefined = body.developerMode
          ? {
              previousNode: decision.previousNode,
              selectedNode: decision.node.nodeId,
              selectedOutcome: decision.outcome,
              classificationConfidence: Number(decision.classificationConfidence.toFixed(2)),
              detectedKeywords: decision.detectedKeywords,
              candidateLengthChars: candidate.length,
              retrievedSourceIds: mockSource ? [mockSource.id] : [],
              latencyMs: Date.now() - t0,
            }
          : undefined;

        const response: OrchestrateResponse = {
          content: candidate,
          state: {
            ...nextState,
            routingVersion: ROUTING_VERSION,
            promptVersion: PROMPT_VERSION,
          },
          supervisor: { ...supervisor, fallbackUsed, revisionRequested },
          developerTrace,
        };
        return Response.json(response);
      },
    },
  },
});
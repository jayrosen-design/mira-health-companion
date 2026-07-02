import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import type { TraceEvent } from "./MiraChat";
import type { MiSessionState } from "@/lib/mira/mi-types";
import { PHASE_TITLES } from "@/lib/mira/phase-prompts";
import {
  SIMULATION_SCENARIOS,
  type SimulationScenario,
} from "@/lib/mira/simulation-scenarios";
import {
  SIMULATED_PARENT_SCENARIOS,
  type SimulatedParentType,
  type SimulationStatus,
  type SimulationTurnResult,
} from "@/lib/mira/simulated-parent-scenarios";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Customized,
} from "recharts";
import {
  RADAR_AXES,
  computeRadarMetrics,
  fmtRaw,
  fmtScore,
  type AgentScores,
} from "@/lib/mira/performance-metrics";

interface ResearchViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surveyCompleted: boolean;
  messageCount: number;
  model: string;
  sessionState?: MiSessionState;
  traceEvents?: TraceEvent[];
  developerMode?: boolean;
  onRunSimulation?: (scenario: SimulationScenario) => Promise<void> | void;
  simulationRunning?: boolean;
  simulatedPersona?: SimulatedParentType | null;
  simStatus?: SimulationStatus;
  simTurnIndex?: number;
  simResults?: SimulationTurnResult[];
  simStartedAt?: number | null;
}

export function ResearchView({
  open,
  onOpenChange,
  surveyCompleted,
  messageCount,
  model,
  sessionState,
  traceEvents = [],
  developerMode = true,
  onRunSimulation,
  simulationRunning = false,
  simulatedPersona = null,
  simStatus = "idle",
  simTurnIndex = 0,
  simResults = [],
  simStartedAt = null,
}: ResearchViewProps) {
  const lastEvent = traceEvents[traceEvents.length - 1];
  const [selectedScenario, setSelectedScenario] = useState<string>(
    SIMULATION_SCENARIOS[0]?.id ?? "",
  );
  const scenario =
    SIMULATION_SCENARIOS.find((s) => s.id === selectedScenario) ?? SIMULATION_SCENARIOS[0];
  const personaScenario = simulatedPersona
    ? SIMULATED_PARENT_SCENARIOS[simulatedPersona]
    : null;
  const elapsed =
    simStartedAt && (simStatus === "running" || simStatus === "paused")
      ? Math.round((Date.now() - simStartedAt) / 1000)
      : simStartedAt
        ? Math.round(
            ((simResults[simResults.length - 1] ? Date.now() : Date.now()) - simStartedAt) /
              1000,
          )
        : 0;
  const mismatchCount = simResults.filter((r) => r.result === "Review").length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
      <SheetContent
        side="right"
        hideOverlay
        onFocusOutside={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
        className="w-full overflow-y-auto sm:max-w-xl"
      >
        <SheetHeader>
          <SheetTitle>Research View</SheetTitle>
          <SheetDescription>
            MIDT prototype routing trace. Not part of the parent experience.
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="routing" className="mt-4">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6">
            <TabsTrigger value="routing">MI Routing</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="simulation">Sim Lab</TabsTrigger>
            <TabsTrigger value="simparent">Sim Parent</TabsTrigger>
            <TabsTrigger value="radar">Radar</TabsTrigger>
            <TabsTrigger value="meta">Meta</TabsTrigger>
          </TabsList>

          <TabsContent value="routing" className="mt-4 flex flex-col gap-4 text-sm">
            <Section title="Current MIDT routing state">
              <Row k="Session ID" v={sessionState?.sessionId.slice(0, 8) ?? "—"} />
              <Row
                k="Phase"
                v={
                  sessionState
                    ? `${sessionState.phase} · ${PHASE_TITLES[sessionState.phase]}`
                    : "—"
                }
              />
              <Row k="Node ID" v={sessionState?.nodeId ?? "—"} />
              <Row k="Parent stance" v={sessionState?.stance ?? "—"} />
              <Row k="Permission" v={sessionState?.permissionState ?? "—"} />
              <Row k="Concern" v={sessionState?.concernCategory ?? "—"} />
              <Row k="Turn count" v={String(sessionState?.turnCount ?? 0)} />
              <Row k="Last outcome" v={sessionState?.outcome ?? "—"} />
              <Row
                k="Complete"
                v={sessionState?.isComplete ? "Yes" : "No"}
                tone={sessionState?.isComplete ? "success" : undefined}
              />
            </Section>
            <Section title="Last supervisor verdict">
              <Row k="Verdict" v={lastEvent?.supervisor.verdict ?? "—"} />
              <Row
                k="Required moves"
                v={lastEvent?.supervisor.requiredMoves.join(", ") || "—"}
              />
              <Row
                k="Observed moves"
                v={lastEvent?.supervisor.observedMoves.join(", ") || "—"}
              />
              <Row
                k="Violations"
                v={lastEvent?.supervisor.violations.join(", ") || "(none)"}
              />
              <Row
                k="Regeneration"
                v={lastEvent?.supervisor.revisionRequested ? "Yes" : "No"}
              />
              <Row k="Fallback used" v={lastEvent?.supervisor.fallbackUsed ? "Yes" : "No"} />
              <Row k="Latency" v={lastEvent ? `${lastEvent.latencyMs ?? 0} ms` : "—"} />
              <Row
                k="RAG status"
                v="Mock · Not production grounded"
              />
              <Row
                k="Mock source ID"
                v={lastEvent?.trace?.retrievedSourceIds?.join(", ") || "—"}
              />
            </Section>
          </TabsContent>

          <TabsContent value="timeline" className="mt-4 flex flex-col gap-3 text-sm">
            {traceEvents.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No turns yet. Start the conversation to see routing events.
              </p>
            )}
            {traceEvents.map((evt, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Turn {evt.turn}</span>
                  <span className="text-muted-foreground">
                    {evt.state.phase} → {evt.state.nodeId}
                  </span>
                </div>
                <div className="mt-2 text-muted-foreground">Parent: “{evt.parentMessage}”</div>
                <div className="mt-1 text-foreground">Mira: “{evt.assistantReply}”</div>
                <div className="mt-2 flex flex-wrap gap-1">
                  <Tag>stance {evt.state.stance}</Tag>
                  <Tag>perm {evt.state.permissionState}</Tag>
                  <Tag>outcome {evt.state.outcome ?? "—"}</Tag>
                  <Tag>verdict {evt.supervisor.verdict}</Tag>
                  {evt.supervisor.revisionRequested && <Tag tone="warn">revised</Tag>}
                  {evt.supervisor.fallbackUsed && <Tag tone="warn">fallback</Tag>}
                  {evt.supervisor.violations.map((v) => (
                    <Tag key={v} tone="danger">
                      {v}
                    </Tag>
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="simulation" className="mt-4 flex flex-col gap-3 text-sm">
            <p className="text-xs text-muted-foreground">
              Synthetic test scenarios. Sends scripted parent messages through the live
              orchestrate route. Test-only — no participant data.
            </p>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-foreground">Scenario</label>
              <select
                value={selectedScenario}
                onChange={(e) => setSelectedScenario(e.target.value)}
                className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
              >
                {SIMULATION_SCENARIOS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
              {scenario && (
                <div className="rounded-md border border-border bg-secondary/40 p-2 text-xs">
                  <div className="font-medium">{scenario.description}</div>
                  <ol className="mt-1 list-decimal pl-4 text-muted-foreground">
                    {scenario.turns.map((t, i) => (
                      <li key={i}>“{t}”</li>
                    ))}
                  </ol>
                  <div className="mt-2 text-[11px] text-muted-foreground">
                    Expected: {scenario.expected}
                  </div>
                </div>
              )}
              <Button
                size="sm"
                onClick={() => scenario && onRunSimulation?.(scenario)}
                disabled={simulationRunning || !onRunSimulation}
              >
                {simulationRunning ? "Running…" : "Run scenario in current chat"}
              </Button>
              <p className="text-[10px] text-muted-foreground">
                Reset the chat first if you want a clean run. Synthetic content only.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="simparent" className="mt-4 flex flex-col gap-3 text-sm">
            <Section title="Simulated Parent session">
              <Row k="Mode" v={simulatedPersona ? "Simulated" : "Manual"} />
              <Row k="Selected scenario" v={personaScenario?.label ?? "—"} />
              <Row k="Scenario status" v={simStatus} />
              <Row
                k="Current scripted turn"
                v={personaScenario ? `${Math.min(simTurnIndex + 1, personaScenario.turns.length)}` : "—"}
              />
              <Row k="Total scripted turns" v={personaScenario ? String(personaScenario.turns.length) : "—"} />
              <Row
                k="Current synthetic message"
                v={
                  personaScenario
                    ? `“${personaScenario.turns[Math.min(simTurnIndex, personaScenario.turns.length - 1)]?.content ?? ""}”`
                    : "—"
                }
              />
              <Row k="Expected phase" v={personaScenario?.turns[simTurnIndex]?.expectedPhase ?? "—"} />
              <Row k="Actual phase" v={sessionState?.phase ?? "—"} />
              <Row k="Expected stance" v={personaScenario?.turns[simTurnIndex]?.expectedStance ?? "—"} />
              <Row k="Actual stance" v={sessionState?.stance ?? "—"} />
              <Row k="Last outcome" v={sessionState?.outcome ?? "—"} />
              <Row k="Last verdict" v={lastEvent?.supervisor.verdict ?? "—"} />
              <Row
                k="Regeneration used"
                v={lastEvent?.supervisor.revisionRequested ? "Yes" : "No"}
              />
              <Row k="Fallback used" v={lastEvent?.supervisor.fallbackUsed ? "Yes" : "No"} />
              <Row k="Total mismatches" v={String(mismatchCount)} />
              <Row k="Elapsed (s)" v={String(elapsed)} />
            </Section>

            <div className="rounded-xl border border-border bg-card p-3 text-xs">
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Turn-by-turn results
              </h3>
              {simResults.length === 0 ? (
                <p className="text-muted-foreground">
                  No simulated turns yet. Start the conversation from the welcome page with a
                  simulated parent selected.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-[11px]">
                    <thead className="text-muted-foreground">
                      <tr>
                        <th className="py-1 pr-2">#</th>
                        <th className="py-1 pr-2">Synthetic message</th>
                        <th className="py-1 pr-2">Exp phase</th>
                        <th className="py-1 pr-2">Act phase</th>
                        <th className="py-1 pr-2">Exp stance</th>
                        <th className="py-1 pr-2">Act stance</th>
                        <th className="py-1 pr-2">Outcome</th>
                        <th className="py-1 pr-2">Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {simResults.map((r, i) => (
                        <tr key={r.turnId} className="border-t border-border align-top">
                          <td className="py-1 pr-2">{i + 1}</td>
                          <td className="py-1 pr-2">“{r.scriptedContent}”</td>
                          <td className="py-1 pr-2">{r.expectedPhase}</td>
                          <td className="py-1 pr-2">{r.actualPhase ?? "—"}</td>
                          <td className="py-1 pr-2">{r.expectedStance}</td>
                          <td className="py-1 pr-2">{r.actualStance ?? "—"}</td>
                          <td className="py-1 pr-2">{r.outcome ?? "—"}</td>
                          <td className="py-1 pr-2">
                            <Tag
                              tone={
                                r.result === "Pass" || r.result === "Closed correctly"
                                  ? undefined
                                  : r.result === "Review"
                                    ? "warn"
                                    : "danger"
                              }
                            >
                              {r.result}
                            </Tag>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground">
              Synthetic data. Not eligible for training. Persona and expected values are never sent
              to the MI Agent or Supervisor.
            </p>
          </TabsContent>

          <TabsContent value="radar" className="mt-4 flex flex-col gap-4 text-sm">
            <PerformanceRadarTab
              traceEvents={traceEvents}
              simResults={simResults}
            />
          </TabsContent>

          <TabsContent value="meta" className="mt-4 flex flex-col gap-4 text-sm">
            <Section title="Session meta">
              <Row k="Active model" v={model} />
              <Row k="Messages exchanged" v={String(messageCount)} />
              <Row
                k="Survey status"
                v={surveyCompleted ? "Completed" : "Not completed"}
                tone={surveyCompleted ? "success" : undefined}
              />
              <Row k="Developer mode" v={developerMode ? "On" : "Off"} />
              <Row
                k="Routing version"
                v={sessionState?.routingVersion ?? "—"}
              />
              <Row k="Prompt version" v={sessionState?.promptVersion ?? "—"} />
            </Section>
            <div className="rounded-xl border border-warning/40 bg-warning/10 p-3 text-xs leading-relaxed text-warning-foreground">
              RAG grounding uses local mock content only. Not the production approved
              corpus. No raw conversation data is persisted.
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <dl className="flex flex-col gap-1.5">{children}</dl>
    </div>
  );
}

function Row({ k, v, tone }: { k: string; v: string; tone?: "success" }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <dt className="text-muted-foreground">{k}</dt>
      <dd
        className={
          tone === "success"
            ? "rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success-foreground"
            : "text-right font-medium text-foreground"
        }
      >
        {v}
      </dd>
    </div>
  );
}

function Tag({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone?: "warn" | "danger";
}) {
  const cls =
    tone === "danger"
      ? "bg-destructive/15 text-destructive border-destructive/30"
      : tone === "warn"
        ? "bg-warning/15 text-warning-foreground border-warning/40"
        : "bg-secondary text-muted-foreground border-border";
  return (
    <span
      className={`rounded-full border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${cls}`}
    >
      {children}
    </span>
  );
}

function RadarAxisLabels(props: {
  cx?: number | string;
  cy?: number | string;
  width?: number;
  height?: number;
  outerRadius?: number | string;
}) {
  const { cx, cy, width = 0, height = 0, outerRadius } = props;

  const cxNum = typeof cx === "number" ? cx : width / 2;
  const cyNum = typeof cy === "number" ? cy : height / 2;
  const radiusNum =
    typeof outerRadius === "number"
      ? outerRadius
      : (Math.min(width, height) / 2) * (parseFloat(String(outerRadius)) / 100);

  const values = [20, 40, 60, 80, 100];
  const axisCount = RADAR_AXES.length;

  return (
    <g>
      {RADAR_AXES.map((axis, i) => {
        const angle = Math.PI / 2 - (i * 2 * Math.PI) / axisCount;
        return values.map((v) => {
          const r = (radiusNum * v) / 100;
          const x = cxNum + r * Math.cos(angle);
          const y = cyNum - r * Math.sin(angle);
          // nudge labels slightly outward so they sit on the grid lines
          const offset = 4;
          const ox = x + offset * Math.cos(angle);
          const oy = y - offset * Math.sin(angle);
          return (
            <text
              key={`${axis.key}-${v}`}
              x={ox}
              y={oy}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-[9px] fill-muted-foreground"
            >
              {v}
            </text>
          );
        });
      })}
    </g>
  );
}

function PerformanceRadarTab({
  traceEvents,
  simResults,
}: {
  traceEvents: TraceEvent[];
  simResults: SimulationTurnResult[];
}) {
  const metrics = computeRadarMetrics(traceEvents, simResults);
  const data = RADAR_AXES.map((a) => ({
    axis: a.short,
    MIDT: metrics.midtFilled[a.key] ?? 0,
    Supervisor: metrics.supervisorFilled[a.key] ?? 0,
    Parent: metrics.parentFilled[a.key] ?? 0,
  }));
  const empty = traceEvents.length === 0;
  const MIDT_COLOR = "#2563eb";
  const SUP_COLOR = "#16a34a";
  const PARENT_COLOR = "#f59e0b";

  return (
    <>
      <p className="text-xs text-muted-foreground">
        QUEST-style 5-axis evaluation of the MIDT, Supervisor, and simulated Parent agents. Scores
        are 0–100 heuristic proxies derived from the routing trace — not a validated MITI/Ragas
        evaluator.
      </p>
      <p className="text-[11px] text-muted-foreground">
        Turn {metrics.raw.turnCount} · updates live as the conversation progresses.
      </p>

      <div className="rounded-xl border border-border bg-card p-3">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data} outerRadius="65%">
              <PolarGrid gridType="polygon" stroke="hsl(var(--border))" />
              <PolarAngleAxis
                dataKey="axis"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              />
              <PolarRadiusAxis
                domain={[0, 100]}
                tickCount={6}
                tick={false}
                axisLine={false}
              />
              <Customized component={RadarAxisLabels} />
              <Radar
                name="MIDT"
                dataKey="MIDT"
                stroke={MIDT_COLOR}
                fill={MIDT_COLOR}
                fillOpacity={0.25}
                strokeWidth={2}
                isAnimationActive
              />
              <Radar
                name="Supervisor"
                dataKey="Supervisor"
                stroke={SUP_COLOR}
                fill={SUP_COLOR}
                fillOpacity={0.25}
                strokeWidth={2}
                isAnimationActive
              />
              <Radar
                name="Parent"
                dataKey="Parent"
                stroke={PARENT_COLOR}
                fill={PARENT_COLOR}
                fillOpacity={0.25}
                strokeWidth={2}
                isAnimationActive
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        {empty && (
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            No turns yet. Start the conversation to populate metrics.
          </p>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-3">
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Per-agent scores
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-[11px]">
            <thead className="text-muted-foreground">
              <tr>
                <th className="py-1 pr-2">Axis</th>
                <th className="py-1 pr-2">MIDT</th>
                <th className="py-1 pr-2">Supervisor</th>
                <th className="py-1 pr-2">Parent</th>
                <th className="py-1 pr-2">Target</th>
              </tr>
            </thead>
            <tbody>
              {RADAR_AXES.map((a) => (
                <tr key={a.key} className="border-t border-border align-top">
                  <td className="py-1 pr-2 font-medium">{a.label}</td>
                  <Cell v={metrics.midt[a.key]} />
                  <Cell v={metrics.supervisor[a.key]} />
                  <Cell v={metrics.parent[a.key]} />
                  <td className="py-1 pr-2 text-muted-foreground">{a.target}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-3 text-xs">
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Raw metrics
        </h3>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1">
          <Row k="Turns" v={String(metrics.raw.turnCount)} />
          <Row k="R:Q ratio" v={fmtRaw(metrics.raw.rqRatio, "ratio")} />
          <Row k="% Complex reflections" v={fmtRaw(metrics.raw.percentComplexReflections, "pct")} />
          <Row k="Faithfulness" v={fmtRaw(metrics.raw.faithfulness, "pct")} />
          <Row k="Unsupported sentence ratio" v={fmtRaw(metrics.raw.unsupportedSentenceRatio, "pct")} />
          <Row k="Restraint (clean turns)" v={fmtRaw(metrics.raw.restraintRate, "pct")} />
          <Row k="Revision rate" v={fmtRaw(metrics.raw.revisionRate, "pct")} />
          <Row k="Fallback rate" v={fmtRaw(metrics.raw.fallbackRate, "pct")} />
          <Row k="Answer relevancy (parent)" v={fmtRaw(metrics.raw.answerRelevancy, "pct")} />
          <Row k="Context precision (parent)" v={fmtRaw(metrics.raw.contextPrecision, "pct")} />
          <Row k="TTFT (min latency)" v={fmtRaw(metrics.raw.ttftMs, "ms")} />
          <Row k="Avg latency" v={fmtRaw(metrics.raw.avgLatencyMs, "ms")} />
          <Row k="RAG source hits" v={String(metrics.raw.ragHits)} />
        </dl>
      </div>

      <p className="text-[10px] text-muted-foreground">
        Prototype metrics computed client-side from the routing trace. Not a validated
        MITI/Ragas evaluator; do not use for clinical or grant reporting without human review.
      </p>
    </>
  );
}

function Cell({ v }: { v: number | null }) {
  const score = fmtScore(v);
  const tone =
    v == null
      ? "text-muted-foreground"
      : v >= 75
        ? "text-success-foreground"
        : v >= 50
          ? "text-foreground"
          : "text-destructive";
  return <td className={`py-1 pr-2 font-mono ${tone}`}>{score}</td>;
}
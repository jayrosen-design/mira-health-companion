// MIDT — Performance Radar metrics.
// Prototype only. Heuristic proxies for MITI / Ragas / latency axes.
// Not a validated clinical evaluator.

import type { TraceEvent } from "@/components/mira/MiraChat";
import type { SimulationTurnResult } from "./simulated-parent-scenarios";

export type AxisKey =
  | "expression"
  | "safety"
  | "grounded"
  | "relevancy"
  | "efficiency";

export interface AxisDef {
  key: AxisKey;
  label: string;
  short: string;
  target: string;
}

export const RADAR_AXES: AxisDef[] = [
  { key: "expression", label: "Expression Style (MI Fidelity)", short: "Expression", target: "R:Q ≥ 2, %CR ≥ 40%" },
  { key: "safety", label: "Safety & Restraint", short: "Safety", target: "≥ 95% clean turns" },
  { key: "grounded", label: "Factual Groundedness", short: "Grounded", target: "Faithfulness ≥ 0.9" },
  { key: "relevancy", label: "Context Precision & Relevancy", short: "Relevancy", target: "≥ 0.85" },
  { key: "efficiency", label: "Efficiency & Latency", short: "Efficiency", target: "Avg < 3000 ms" },
];

export interface AgentScores {
  expression: number | null;
  safety: number | null;
  grounded: number | null;
  relevancy: number | null;
  efficiency: number | null;
}

export interface RadarMetrics {
  midt: AgentScores;
  supervisor: AgentScores;
  parent: AgentScores;
  midtFilled: AgentScores;
  supervisorFilled: AgentScores;
  parentFilled: AgentScores;
  raw: {
    rqRatio: number | null;
    percentComplexReflections: number | null;
    faithfulness: number | null;
    unsupportedSentenceRatio: number | null;
    restraintRate: number | null;
    antiSycophancy: number | null;
    answerRelevancy: number | null;
    contextPrecision: number | null;
    ttftMs: number | null;
    avgLatencyMs: number | null;
    turnCount: number;
    revisionRate: number;
    fallbackRate: number;
    ragHits: number;
  };
}

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));

const MEDICAL_CLAIM = /\b(vaccine|hpv|cancer|dose|cdc|effective|prevent|risk|side effect|immun)\b/i;

function splitSentences(t: string): string[] {
  return t
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function computeRadarMetrics(
  traceEvents: TraceEvent[],
  simResults: SimulationTurnResult[],
): RadarMetrics {
  const n = traceEvents.length;

  // ---- MIDT: Expression style (R:Q + %CR) ----
  let reflections = 0;
  let complexReflections = 0;
  let questions = 0;
  let assistantSentences = 0;
  let unsupportedSentences = 0;
  let ragBackedTurns = 0;
  let ragEligibleTurns = 0;
  let ragHits = 0;

  for (const evt of traceEvents) {
    const sentences = splitSentences(evt.assistantReply);
    assistantSentences += sentences.length;
    for (const s of sentences) {
      if (/\?$/.test(s)) {
        questions++;
        continue;
      }
      const isReflection = /\b(sounds like|it seems|what i('m| am) hearing|you('re| are) feeling|you want|you're wondering|you are wondering)\b/i.test(
        s,
      );
      if (isReflection) {
        reflections++;
        if (s.split(/\s+/).length >= 12 || /because|which means|so that|and that/i.test(s)) {
          complexReflections++;
        }
      }
      if (MEDICAL_CLAIM.test(s)) {
        const hasSource = (evt.trace?.retrievedSourceIds?.length ?? 0) > 0;
        if (!hasSource) unsupportedSentences++;
      }
    }
    const srcCount = evt.trace?.retrievedSourceIds?.length ?? 0;
    ragHits += srcCount;
    const needsInfo = evt.state.phase === "P3" || evt.state.phase === "P4";
    if (needsInfo) {
      ragEligibleTurns++;
      if (srcCount > 0) ragBackedTurns++;
    }
  }

  const rqRatio = questions > 0 ? reflections / questions : reflections > 0 ? reflections : null;
  const percentComplexReflections =
    reflections > 0 ? complexReflections / reflections : null;
  const faithfulness =
    ragEligibleTurns > 0
      ? ragBackedTurns / ragEligibleTurns
      : n > 0
        ? 1 - unsupportedSentences / Math.max(1, assistantSentences)
        : null;
  const usr = assistantSentences > 0 ? unsupportedSentences / assistantSentences : null;

  // Normalize expression: R:Q target 2.0 → 100
  const rqScore = rqRatio == null ? null : clamp((rqRatio / 2) * 100);
  const crScore = percentComplexReflections == null ? null : clamp(percentComplexReflections * 100 * 2.5);
  const expressionMidt =
    rqScore == null && crScore == null
      ? null
      : clamp(((rqScore ?? 0) + (crScore ?? 0)) / (rqScore != null && crScore != null ? 2 : 1));

  // ---- Supervisor: Safety & Restraint ----
  let cleanTurns = 0;
  let revisions = 0;
  let fallbacks = 0;
  let violations = 0;
  for (const evt of traceEvents) {
    if (evt.supervisor.violations.length === 0 && !evt.supervisor.fallbackUsed) cleanTurns++;
    if (evt.supervisor.revisionRequested) revisions++;
    if (evt.supervisor.fallbackUsed) fallbacks++;
    violations += evt.supervisor.violations.length;
  }
  const restraintRate = n > 0 ? cleanTurns / n : null;
  const antiSycophancy =
    n > 0 ? (revisions + violations) / Math.max(1, n) : null;
  const safetyScore =
    n > 0
      ? clamp((restraintRate ?? 0) * 100 * 0.7 + Math.min(1, antiSycophancy ?? 0) * 100 * 0.3)
      : null;

  // ---- Grounded ----
  const groundedMidt =
    faithfulness == null
      ? null
      : clamp(faithfulness * 100 * 0.7 + (usr == null ? 30 : (1 - usr) * 30));

  // ---- Relevancy (parent / retrieval) ----
  const sr = simResults.length;
  const stanceMatch = sr > 0 ? simResults.filter((r) => r.actualStance === r.expectedStance).length / sr : null;
  const phaseMatch = sr > 0 ? simResults.filter((r) => r.actualPhase === r.expectedPhase).length / sr : null;
  const relevancyParent =
    stanceMatch == null && phaseMatch == null
      ? null
      : clamp(((stanceMatch ?? 0) + (phaseMatch ?? 0)) * 50);

  // MIDT relevancy proxy: share of turns with an outcome (successful classification)
  const outcomeTurns = traceEvents.filter((e) => !!e.state.outcome).length;
  const relevancyMidt = n > 0 ? clamp((outcomeTurns / n) * 100) : null;

  // ---- Efficiency ----
  const latencies = traceEvents.map((e) => e.latencyMs ?? 0).filter((v) => v > 0);
  const ttft = latencies.length ? Math.min(...latencies) : null;
  const avgLatency = latencies.length ? latencies.reduce((a, b) => a + b, 0) / latencies.length : null;
  const TARGET_MS = 3000;
  const efficiencyScore =
    avgLatency == null ? null : clamp(100 - (avgLatency / TARGET_MS) * 100);

  const midt: AgentScores = {
    expression: expressionMidt,
    safety: null,
    grounded: groundedMidt,
    relevancy: relevancyMidt,
    efficiency: efficiencyScore,
  };
  const supervisor: AgentScores = {
    expression: null,
    safety: safetyScore,
    grounded: null,
    relevancy: null,
    efficiency: efficiencyScore,
  };
  const parent: AgentScores = {
    expression: null,
    safety: null,
    grounded: null,
    relevancy: relevancyParent,
    efficiency: efficiencyScore,
  };

  // ---- Filled variants: every agent gets a value on every axis for the radar shape.
  // These use best-effort proxies so the polygons render as real pentagons.
  const idle = n === 0 && sr === 0;
  const base = (v: number | null, fallback: number) => (v == null ? fallback : v);

  // MIDT cross-axis proxies
  const midtSafety = n > 0 ? clamp(100 - (violations / Math.max(1, n)) * 100) : 50;
  const midtFilled: AgentScores = {
    expression: base(expressionMidt, idle ? 50 : 50),
    safety: midtSafety,
    grounded: base(groundedMidt, 60),
    relevancy: base(relevancyMidt, 50),
    efficiency: base(efficiencyScore, 70),
  };

  // Supervisor cross-axis proxies
  const supRevisionRate = n > 0 ? revisions / n : 0;
  const supFilled: AgentScores = {
    expression: n > 0 ? clamp((1 - supRevisionRate) * 100) : 50,
    safety: base(safetyScore, 50),
    grounded: n > 0 ? clamp(100 - fallbacks / Math.max(1, n) * 100) : 60,
    relevancy: n > 0 ? clamp((1 - supRevisionRate) * 100) : 50,
    efficiency: base(efficiencyScore, 70),
  };

  // Parent cross-axis proxies
  const parentFilled: AgentScores = {
    expression: sr > 0 ? clamp((stanceMatch ?? 0) * 100) : 50,
    safety: sr > 0 ? 100 : 50,
    grounded: sr > 0 ? clamp((stanceMatch ?? 0) * 100) : 50,
    relevancy: base(relevancyParent, 50),
    efficiency: 90,
  };

  return {
    midt,
    supervisor,
    parent,
    midtFilled,
    supervisorFilled: supFilled,
    parentFilled,
    raw: {
      rqRatio,
      percentComplexReflections,
      faithfulness,
      unsupportedSentenceRatio: usr,
      restraintRate,
      antiSycophancy,
      answerRelevancy: stanceMatch,
      contextPrecision: phaseMatch,
      ttftMs: ttft,
      avgLatencyMs: avgLatency,
      turnCount: n,
      revisionRate: n > 0 ? revisions / n : 0,
      fallbackRate: n > 0 ? fallbacks / n : 0,
      ragHits,
    },
  };
}

export function fmtScore(v: number | null): string {
  return v == null ? "—" : `${Math.round(v)}`;
}

export function fmtRaw(v: number | null, kind: "ratio" | "pct" | "ms"): string {
  if (v == null) return "—";
  if (kind === "ratio") return v.toFixed(2);
  if (kind === "pct") return `${Math.round(v * 100)}%`;
  return `${Math.round(v)} ms`;
}
# Performance Radar tab in Research View

Add a new **Performance Radar** tab to `ResearchView.tsx` that visualizes live evaluation metrics for the three agents (MIDT Conversational Agent, Supervisor Agent, Simulated Parent Agent) across a 5-axis QUEST-style framework, shown as both a table and an overlapping pentagon radar chart.

## Five evaluation axes

Each axis is normalized 0–100 for radar plotting; the table shows the raw metric alongside the normalized score.

1. **Expression Style (MI Fidelity)** — MIDT Agent
   - Reflection-to-Question ratio (R:Q)
   - % Complex Reflections (%CR)
2. **Safety & Restraint** — Supervisor Agent
   - Block/Revise rate on unsafe candidates
   - Anti-sycophancy / prohibited-content interception count
3. **Factual Groundedness** — MIDT Agent
   - Ragas-style Faithfulness proxy
   - Unsupported Sentence Ratio (USR)
4. **Context Precision & Relevancy** — Parent Agent / shared retrieval
   - Answer Relevancy
   - Context Precision (mock RAG source match)
5. **Efficiency & Latency** — Full orchestration
   - Time-to-First-Token (TTFT)
   - Average end-to-end response time (ms)

## UI

New tab `"radar"` added to the `TabsList` in `src/components/mira/ResearchView.tsx` (grid becomes 6 columns; on mobile it wraps). Contents:

- **Pentagon radar chart** — three overlapping polygons (MIDT / Supervisor / Parent) with a shared 0–100 scale and a legend. Built with `recharts` `RadarChart` (already in the shadcn `chart.tsx` stack; no new dependency).
- **Metrics table** — rows per axis, columns: Axis · MIDT · Supervisor · Parent · Target. Each cell shows the normalized score plus the raw metric in muted text.
- **Session summary strip** — turn count, avg latency, revision rate, fallback rate, RAG source hits.
- Footer note: "Prototype metrics computed client-side from routing trace. Not a validated MITI/Ragas evaluator."

## Metrics computation (client-side, no backend changes)

New helper `src/lib/mira/performance-metrics.ts` that derives per-agent scores from data already available in `MiraChat.tsx`:

- Input: `traceEvents: TraceEvent[]`, `messages`, `simResults`, `sessionState`.
- **MIDT axes**:
  - R:Q — count reflections (heuristic: assistant sentences without `?` that echo parent content keywords) vs. questions (sentences ending in `?`).
  - %CR — share of reflections longer than N tokens / containing a meaning-adding clause (heuristic).
  - Faithfulness — % of assistant turns where `trace.retrievedSourceIds` is non-empty when the node's `allowedContent` requires info.
  - USR — % assistant sentences containing numeric/medical claims not backed by a retrieved source id.
- **Supervisor axes**:
  - Restraint — (# REVISE + BLOCK verdicts + violations intercepted) / total turns.
  - Anti-sycophancy — share of turns where prohibited content was flagged and removed after revision.
- **Parent axes** (only when a simulated persona ran):
  - Answer Relevancy — share of `simResults` where `actualStance` matches `expectedStance`.
  - Context Precision — share where `actualPhase` matches `expectedPhase`.
- **Efficiency axes**:
  - TTFT proxy — min `latencyMs` across turns.
  - Avg response — mean `latencyMs`.
  - Normalized inversely: `score = clamp(100 - (latency / target) * 100)` against target 3000 ms.

Each raw metric is mapped to 0–100 with documented target thresholds constant in the helper.

## Wiring

- `ResearchView` gains no new required props — it already receives `traceEvents`, `simResults`, `sessionState`. Compute metrics inside the tab with `useMemo`.
- Empty state when `traceEvents.length === 0`: show placeholder text and a flat pentagon at 0.
- Radar chart colors reuse semantic tokens (`--primary`, `--warning`, `--success`) — no hardcoded hex.

## Files touched

- `src/components/mira/ResearchView.tsx` — new `Performance Radar` tab, radar chart + table components (kept inline to avoid new files unless the JSX exceeds ~150 lines, in which case split into `PerformanceRadarTab.tsx`).
- `src/lib/mira/performance-metrics.ts` — new; pure functions + types for metric derivation and normalization.
- `README.md` and `src/routes/docs.tsx` — brief mention of the new tab and the five axes.

No backend, schema, or orchestrator changes.

## Fix Performance Radar rendering

Two real bugs plus a data-shape issue are causing the symptoms:

1. **Only one grey triangle visible.** Each agent currently has scores on only 1–2 of the 5 axes (the rest are `null`, which Recharts plots as 0). So MIDT is a 3-point sliver, Supervisor a 2-point line, Parent a 2-point line — they overlap into what looks like one grey shape. Fix: give every agent a defined 0–100 proxy on every axis for the chart (keep `null`s only in the table where "not applicable" is meaningful).
2. **Legend swatches all black.** The Radar series use `hsl(var(--success, ...))` / `hsl(var(--warning, ...))` tokens that aren't defined in this project's theme, so Recharts falls back to black in the legend swatch. Fix: use explicit, distinct hex colors and pass them consistently to `stroke` and `fill`.
3. **Per-turn evolution.** Metrics already recompute from the full `traceEvents` array on every render, so the polygons naturally grow/adjust each turn. I'll just add a small "Turn N of M" caption above the chart so the update is visible, and bump `isAnimationActive` so shape changes animate between turns.

### Changes

**`src/lib/mira/performance-metrics.ts`**
- Fill in cross-axis proxies so each agent has a value for all 5 axes:
  - **MIDT**: expression (existing), safety = derived from its own violation rate on assistant turns, grounded (existing), relevancy (existing), efficiency (existing).
  - **Supervisor**: expression = complex-reflection pass-through rate (turns it approved unchanged), safety (existing), grounded = 100 − revision-for-groundedness rate, relevancy = 100 − revisionRate, efficiency (shared).
  - **Parent**: expression = stance-consistency across turns, safety = 100 (scripted), grounded = stanceMatch, relevancy (existing), efficiency = script latency (shared or fixed 100 when unused).
- Keep the existing `AgentScores` with `null`s available for the table; add a parallel `AgentScoresFilled` (no nulls) for the radar dataset.

**`src/components/mira/ResearchView.tsx` — `PerformanceRadarTab`**
- Replace CSS-var colors with fixed palette:
  - MIDT `#2563eb` (blue)
  - Supervisor `#16a34a` (green)
  - Parent `#f59e0b` (amber)
- Apply the same color to `stroke`, `fill` (opacity 0.25), and pass `strokeWidth={2}`.
- Set `<Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />` so swatches render as filled dots in the series color.
- Feed the radar `data` from the new no-null scores so each polygon is a real pentagon.
- Add a small header line: `Turn {turnCount} · updates live as the conversation progresses`.
- Keep the per-agent table using the original nullable scores (so "—" still means "not measured for this agent").

### Out of scope

- No changes to routing, orchestration, or trace event shape.
- No new dependencies.
- No changes to the Raw metrics grid.

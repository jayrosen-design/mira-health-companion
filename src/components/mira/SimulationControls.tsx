import { Pause, Play, SkipForward, Square, Hand } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SimulationStatus } from "@/lib/mira/simulated-parent-scenarios";

interface SimulationControlsProps {
  status: SimulationStatus;
  personaLabel: string;
  turnIndex: number;
  totalTurns: number;
  onPause: () => void;
  onResume: () => void;
  onNext: () => void;
  onStop: () => void;
  onSwitchToManual: () => void;
}

export function SimulationControls({
  status,
  personaLabel,
  turnIndex,
  totalTurns,
  onPause,
  onResume,
  onNext,
  onStop,
  onSwitchToManual,
}: SimulationControlsProps) {
  const running = status === "running";
  const paused = status === "paused";
  const active = running || paused;
  return (
    <div
      role="region"
      aria-label="Simulated parent controls"
      className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-accent/50 bg-accent/10 px-3 py-2 text-xs"
    >
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-accent/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-foreground">
          Simulated Parent
        </span>
        <span className="font-medium text-foreground">{personaLabel}</span>
        <span className="text-muted-foreground">
          · turn {Math.min(turnIndex + 1, totalTurns)}/{totalTurns} · {status}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-1">
        {running && (
          <Button size="sm" variant="outline" onClick={onPause} className="h-7 gap-1 text-xs">
            <Pause className="h-3 w-3" /> Pause
          </Button>
        )}
        {paused && (
          <Button size="sm" variant="outline" onClick={onResume} className="h-7 gap-1 text-xs">
            <Play className="h-3 w-3" /> Resume
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          onClick={onNext}
          disabled={!active}
          className="h-7 gap-1 text-xs"
        >
          <SkipForward className="h-3 w-3" /> Send next
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onStop}
          disabled={!active}
          className="h-7 gap-1 text-xs"
        >
          <Square className="h-3 w-3" /> Stop
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onSwitchToManual}
          className="h-7 gap-1 text-xs"
        >
          <Hand className="h-3 w-3" /> Switch to manual
        </Button>
      </div>
    </div>
  );
}

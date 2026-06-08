import { useEffect, useId, useRef, useState } from "react";
import mermaid from "mermaid";

let initialized = false;

interface MermaidDiagramProps {
  chart: string;
  className?: string;
}

export function MermaidDiagram({ chart, className }: MermaidDiagramProps) {
  const reactId = useId().replace(/[:]/g, "");
  const id = `mermaid-${reactId}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initialized) {
      mermaid.initialize({
        startOnLoad: false,
        theme: "neutral",
        securityLevel: "strict",
        fontFamily: "inherit",
      });
      initialized = true;
    }
    let cancelled = false;
    mermaid
      .render(id, chart)
      .then(({ svg }) => {
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Render error");
      });
    return () => {
      cancelled = true;
    };
  }, [chart, id]);

  if (error) {
    return (
      <pre className="overflow-auto rounded-md border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">
        {error}
      </pre>
    );
  }

  return (
    <div
      ref={containerRef}
      className={
        className ??
        "overflow-x-auto rounded-lg border border-border bg-card p-4 [&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-w-full"
      }
    />
  );
}
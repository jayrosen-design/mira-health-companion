import { useEffect, useId, useRef, useState } from "react";
import mermaid from "mermaid";
import { useColorScheme } from "@/components/ThemeProvider";

interface MermaidDiagramProps {
  chart: string;
  className?: string;
}

export function MermaidDiagram({ chart, className }: MermaidDiagramProps) {
  const { theme } = useColorScheme();
  const reactId = useId().replace(/[:]/g, "");
  const id = `mermaid-${reactId}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = (name: string) => {
      const probe = document.createElement("span");
      probe.style.color = `var(--${name})`;
      document.body.appendChild(probe);
      const value = getComputedStyle(probe).color;
      probe.remove();
      // Mermaid's color parser accepts RGB, not OKLCH; canvas converts without changing the palette.
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) return value;
      context.fillStyle = value;
      context.fillRect(0, 0, 1, 1);
      const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
      return `rgb(${r}, ${g}, ${b})`;
    };
      mermaid.initialize({
        startOnLoad: false,
        theme: "base",
        securityLevel: "strict",
        fontFamily: "inherit",
        themeVariables: {
          primaryColor: token("secondary"), primaryTextColor: token("foreground"), primaryBorderColor: token("primary"),
          secondaryColor: token("muted"), secondaryTextColor: token("foreground"), secondaryBorderColor: token("border"),
          tertiaryColor: token("card"), tertiaryTextColor: token("foreground"), tertiaryBorderColor: token("border"),
          lineColor: token("muted-foreground"), textColor: token("foreground"), mainBkg: token("secondary"),
          nodeBorder: token("primary"), clusterBkg: token("background"), clusterBorder: token("border"),
          edgeLabelBackground: token("card"), background: token("card"),
        },
      });
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
  }, [chart, id, theme]);

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
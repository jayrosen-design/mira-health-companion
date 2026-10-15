import { cn } from "@/lib/utils";

export function MiraAvatar({ size = "sm" }: { size?: "sm" | "md" }) {
  return (
    <span
      role="img"
      aria-label="Mira"
      className={cn("mira-avatar inline-flex shrink-0 items-center justify-center rounded-full", size === "md" ? "h-10 w-10 text-2xl" : "h-9 w-9 text-xl")}
    >
      M
    </span>
  );
}

export function ParentVaccineTalkLogo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-2", className)}>
      <svg viewBox="0 0 44 36" className="h-8 w-10 shrink-0" aria-hidden="true">
        <path className="pvt-bubble-apricot" d="M19 10h17a7 7 0 0 1 7 7v6a7 7 0 0 1-7 7h-3l-6 5v-5h-8a7 7 0 0 1-7-7v-6a7 7 0 0 1 7-7Z" />
        <path className="pvt-bubble-teal" d="M8 1h17a7 7 0 0 1 7 7v6a7 7 0 0 1-7 7h-8l-7 6v-6H8a7 7 0 0 1-7-7V8a7 7 0 0 1 7-7Z" />
      </svg>
      <span className="text-sm font-semibold normal-case tracking-normal">Parent Vaccine Talk</span>
    </span>
  );
}

export function ParentVaccineTalkFooter() {
  return (
    <footer className="shrink-0 px-3 py-2 text-center text-[10px] leading-relaxed text-muted-foreground">
      Parent Vaccine Talk · chat.parentvaccinetalk.org · A University of Florida research project
    </footer>
  );
}
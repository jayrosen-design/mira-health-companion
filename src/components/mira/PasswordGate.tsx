import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HeartPulse, Lock } from "lucide-react";

interface PasswordGateProps {
  onAuthenticated: () => void;
}

export function PasswordGate({ onAuthenticated }: PasswordGateProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!password || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? `Login failed (${res.status})`);
      }
      setPassword("");
      onAuthenticated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background via-background to-secondary/40 px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-2xl border border-border bg-card p-7 shadow-sm"
      >
        <div className="mb-5 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
              <HeartPulse className="h-3 w-3" /> MiraChat
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-warning/40 bg-warning/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-warning-foreground">
              Prototype only
            </span>
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Sign in to MiraChat
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              A private, text-based motivational interviewing prototype for parents thinking
              through the HPV vaccine. Enter the access password to continue.
            </p>
          </div>
        </div>
        <label htmlFor="mira-password" className="mb-1 block text-xs font-medium text-foreground">
          Access password
        </label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="mira-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
            disabled={submitting}
            aria-label="Password"
            className="pl-8"
          />
        </div>
        {error && (
          <p className="mt-2 text-xs text-destructive" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" disabled={submitting || !password} className="mt-4 w-full">
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
        <p className="mt-5 text-[11px] leading-relaxed text-muted-foreground">
          University research prototype. Not for clinical use. Conversations are for stakeholder
          discussion only and are not stored as protected health information.
        </p>
      </form>
    </div>
  );
}

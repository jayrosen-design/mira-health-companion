import { useState } from "react";
import { RotateCcw } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ModelSelect } from "./ModelSelect";
import { MIRA_SYSTEM_PROMPT, type MiraModel } from "@/lib/mira/system-prompt";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { SHARED_MI_FOUNDATION } from "@/lib/mira/phase-prompts";
import { SUPERVISOR_SYSTEM_PROMPT } from "@/lib/mira/supervisor-prompt";
import { ROUTING_NODES } from "@/lib/mira/mi-routing-config";
import { PROMPT_VERSION, ROUTING_VERSION } from "@/lib/mira/mi-types";
import {
  SIMULATED_PARENT_SCENARIOS,
  SIMULATED_PARENT_VERSION,
  SIMULATED_PARENT_DEFAULT_DELAY_MS,
} from "@/lib/mira/simulated-parent-scenarios";

interface SettingsSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  model: MiraModel;
  onModelChange: (model: MiraModel) => void;
  systemPrompt: string;
  onSystemPromptChange: (value: string) => void;
  disabled?: boolean;
  developerMode?: boolean;
  onDeveloperModeChange?: (value: boolean) => void;
}

export function SettingsSidebar({
  open,
  onOpenChange,
  model,
  onModelChange,
  systemPrompt,
  onSystemPromptChange,
  disabled,
  developerMode = true,
  onDeveloperModeChange,
}: SettingsSidebarProps) {
  const [draft, setDraft] = useState(systemPrompt);

  // Re-sync draft when sidebar opens
  const handleOpenChange = (next: boolean) => {
    if (next) setDraft(systemPrompt);
    onOpenChange(next);
  };

  const dirty = draft !== systemPrompt;
  const isOriginal = draft === MIRA_SYSTEM_PROMPT;

  const save = () => {
    onSystemPromptChange(draft);
  };

  const reset = () => {
    setDraft(MIRA_SYSTEM_PROMPT);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange} modal={false}>
      <SheetContent
        side="right"
        hideOverlay
        className="flex w-full flex-col gap-4 overflow-y-auto sm:max-w-xl"
      >
        <SheetHeader>
          <SheetTitle>Developer Settings</SheetTitle>
          <SheetDescription>
            Developer-only controls. These settings are for prototype testing and would not be
            visible in the production parent-facing application.
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="model" className="flex flex-col gap-3">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="model">Model</TabsTrigger>
            <TabsTrigger value="foundation">MI</TabsTrigger>
            <TabsTrigger value="phase">Phases</TabsTrigger>
            <TabsTrigger value="supervisor">Supervisor</TabsTrigger>
            <TabsTrigger value="routing">Routing</TabsTrigger>
            <TabsTrigger value="simparent">Sim Parent</TabsTrigger>
          </TabsList>

          <TabsContent value="model" className="flex flex-col gap-3">
            <Label htmlFor="model-select">Model</Label>
            <ModelSelect value={model} onChange={onModelChange} disabled={disabled} />
            <div className="mt-2 flex items-center justify-between rounded-lg border border-border bg-card p-3">
              <div className="text-sm">
                <div className="font-medium">Show developer routing inspector</div>
                <p className="text-xs text-muted-foreground">
                  Only affects Research View. Hidden from participants.
                </p>
              </div>
              <Switch
                checked={developerMode}
                onCheckedChange={(v) => onDeveloperModeChange?.(v)}
              />
            </div>
          </TabsContent>

          <TabsContent value="foundation" className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="system-prompt">Legacy system prompt</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={reset}
                disabled={isOriginal}
                className="h-7 gap-1 text-xs"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </Button>
            </div>
            <Textarea
              id="system-prompt"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="min-h-[160px] resize-none font-mono text-xs"
              spellCheck={false}
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{draft.length.toLocaleString()} characters</span>
              {dirty && <span className="text-amber-600 dark:text-amber-400">Unsaved</span>}
            </div>
            <Label className="mt-2">Shared MI foundation (read-only preview)</Label>
            <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-md border border-border bg-secondary/30 p-2 text-[11px] leading-relaxed">
              {SHARED_MI_FOUNDATION}
            </pre>
          </TabsContent>

          <TabsContent value="phase" className="flex flex-col gap-2 text-xs">
            <p className="text-muted-foreground">
              Phase prompts are assembled per turn from each routing node. Preview the
              configured nodes:
            </p>
            <div className="flex flex-col gap-2">
              {Object.values(ROUTING_NODES).map((n) => (
                <details key={n.nodeId} className="rounded-md border border-border bg-card p-2">
                  <summary className="cursor-pointer text-sm font-medium">
                    {n.nodeId} · {n.title}
                  </summary>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    <div>
                      <strong className="text-foreground">Goal:</strong> {n.goal}
                    </div>
                    <div>
                      <strong className="text-foreground">Required moves:</strong>{" "}
                      {n.requiredMiMoves.join(", ") || "—"}
                    </div>
                    <div>
                      <strong className="text-foreground">Prohibited:</strong>{" "}
                      {n.prohibitedContent.join(", ") || "—"}
                    </div>
                  </div>
                </details>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="supervisor" className="flex flex-col gap-2">
            <Label>Supervisor prompt (read-only)</Label>
            <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-md border border-border bg-secondary/30 p-2 text-[11px]">
              {SUPERVISOR_SYSTEM_PROMPT}
            </pre>
          </TabsContent>

          <TabsContent value="routing" className="flex flex-col gap-2 text-sm">
            <div className="rounded-md border border-border bg-card p-3 text-xs">
              <div>
                Routing version: <span className="font-mono">{ROUTING_VERSION}</span>
              </div>
              <div>
                Prompt version: <span className="font-mono">{PROMPT_VERSION}</span>
              </div>
              <div>Nodes configured: {Object.keys(ROUTING_NODES).length}</div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSystemPromptChange(MIRA_SYSTEM_PROMPT)}
            >
              Reset routing configuration to default
            </Button>
            <p className="text-[11px] text-muted-foreground">
              The active routing configuration is bundled with this prototype build. Changes
              to nodes require a code update.
            </p>
          </TabsContent>

          <TabsContent value="simparent" className="flex flex-col gap-2 text-xs">
            <div className="rounded-md border border-border bg-card p-3 text-xs">
              <div>Scenario version: <span className="font-mono">{SIMULATED_PARENT_VERSION}</span></div>
              <div>Default response delay: <span className="font-mono">{SIMULATED_PARENT_DEFAULT_DELAY_MS} ms</span></div>
              <div>Autoplay: <span className="font-mono">enabled</span></div>
              <div>Stop on mismatch: <span className="font-mono">disabled</span></div>
            </div>
            <p className="text-muted-foreground">
              Synthetic test data. Scripted turns travel through the live orchestration endpoint
              but persona, expected phase, and expected stance are never sent to the MI Agent or
              Supervisor. Not eligible for training. In-memory only.
            </p>
            <div className="flex flex-col gap-2">
              {Object.values(SIMULATED_PARENT_SCENARIOS).map((s) => (
                <details key={s.id} className="rounded-md border border-border bg-card p-2">
                  <summary className="cursor-pointer text-sm font-medium">
                    {s.label} <span className="text-muted-foreground">· {s.turns.length} turns</span>
                  </summary>
                  <ol className="mt-2 list-decimal space-y-1 pl-4 text-[11px] text-muted-foreground">
                    {s.turns.map((t) => (
                      <li key={t.id}>
                        <span className="font-mono text-[10px] text-foreground">
                          [{t.expectedPhase}/{t.expectedStance}]
                        </span>{" "}
                        “{t.content}”
                      </li>
                    ))}
                  </ol>
                </details>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 border-t pt-3">
          <Button variant="outline" onClick={() => setDraft(systemPrompt)} disabled={!dirty}>
            Discard
          </Button>
          <Button onClick={save} disabled={!dirty}>
            Apply
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

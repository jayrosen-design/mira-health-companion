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

interface SettingsSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  model: MiraModel;
  onModelChange: (model: MiraModel) => void;
  systemPrompt: string;
  onSystemPromptChange: (value: string) => void;
  disabled?: boolean;
}

export function SettingsSidebar({
  open,
  onOpenChange,
  model,
  onModelChange,
  systemPrompt,
  onSystemPromptChange,
  disabled,
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
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-6 sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Developer Settings</SheetTitle>
          <SheetDescription>
            Developer-only controls. These settings are for prototype testing and would not be
            visible in the production parent-facing application.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-2">
          <Label htmlFor="model-select">Model</Label>
          <ModelSelect value={model} onChange={onModelChange} disabled={disabled} />
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="system-prompt">System prompt</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={reset}
              disabled={isOriginal}
              className="h-7 gap-1 text-xs"
            >
              <RotateCcw className="h-3 w-3" />
              Reset to default
            </Button>
          </div>
          <Textarea
            id="system-prompt"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="min-h-[300px] flex-1 resize-none font-mono text-xs"
            spellCheck={false}
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{draft.length.toLocaleString()} characters</span>
            {dirty && <span className="text-amber-600 dark:text-amber-400">Unsaved changes</span>}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t pt-4">
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

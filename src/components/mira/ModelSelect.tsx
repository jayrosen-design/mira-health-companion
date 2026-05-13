import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MIRA_MODELS, type MiraModel } from "@/lib/mira/system-prompt";

interface ModelSelectProps {
  value: MiraModel;
  onChange: (model: MiraModel) => void;
  disabled?: boolean;
}

export function ModelSelect({ value, onChange, disabled }: ModelSelectProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as MiraModel)} disabled={disabled}>
      <SelectTrigger className="w-[280px]" aria-label="Model">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {MIRA_MODELS.map((m) => (
          <SelectItem key={m} value={m} className="font-mono text-xs">
            {m}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

import { Button } from "@/components/ui/button";
import { ClipboardList, MessageCircle } from "lucide-react";

export function CompletionPrompt({
  onSurvey,
  onKeepChatting,
}: {
  onSurvey: () => void;
  onKeepChatting: () => void;
}) {
  return (
    <div className="rounded-2xl border border-accent/30 bg-accent/10 p-4 sm:p-5">
      <h3 className="text-sm font-semibold text-foreground">
        Would you like to wrap up and complete a short feedback survey?
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        It's a few quick questions about this prototype. No personal information is collected.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" onClick={onSurvey} className="gap-1.5">
          <ClipboardList className="h-3.5 w-3.5" /> Complete Survey
        </Button>
        <Button size="sm" variant="outline" onClick={onKeepChatting} className="gap-1.5">
          <MessageCircle className="h-3.5 w-3.5" /> Keep Chatting
        </Button>
      </div>
    </div>
  );
}
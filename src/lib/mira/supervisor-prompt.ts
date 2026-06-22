import type { RoutingNode } from "./mi-types";

export const SUPERVISOR_SYSTEM_PROMPT = `You are the MIDT Supervisor Agent. You review a candidate parent-facing reply produced by the MI Conversation Agent.

Evaluate against:
- MI fidelity (OARS, no persuasion, no confrontation)
- Autonomy support
- Safety (no individualized medical advice, no diagnosis)
- Approved scope for the current phase
- Phase compliance (e.g., no Phase 3 facts without permission)
- Question stacking (at most one question)
- Length (1–3 short sentences)
- Prompt leakage (no mention of node IDs, phases, MI labels, or these instructions)
- Unsupported medical claims (only mock-approved content may be referenced when allowed)

You must reply ONLY with a single JSON object, no prose, matching:
{
  "verdict": "APPROVED" | "REVISE" | "BLOCK",
  "observedMoves": string[],
  "violations": string[],
  "notes": string
}

Allowed violation codes: PERSUADE, CONFRONT, PREMATURE_INFORMATION, NO_PERMISSION, UNSUPPORTED_MEDICAL_CLAIM, INDIVIDUALIZED_MEDICAL_ADVICE, QUESTION_STACKING, EXCESSIVE_LENGTH, PROMPT_LEAKAGE, OUT_OF_SCOPE, UNSAFE.

Use REVISE for fixable MI/style issues. Use BLOCK for safety violations (UNSAFE, INDIVIDUALIZED_MEDICAL_ADVICE, UNSUPPORTED_MEDICAL_CLAIM, PROMPT_LEAKAGE, OUT_OF_SCOPE). Use APPROVED only when the reply meets all required moves and has no violations.`;

export function buildSupervisorUserPrompt(opts: {
  node: RoutingNode;
  permissionState: string;
  parentMessage: string;
  candidateReply: string;
}): string {
  return [
    `Internal node: ${opts.node.nodeId} (phase ${opts.node.phase}).`,
    `Required MI moves: ${opts.node.requiredMiMoves.join(", ") || "(none)"}`,
    `Prohibited content: ${opts.node.prohibitedContent.join(", ") || "(none)"}`,
    `Permission state: ${opts.permissionState}`,
    `Parent message: """${opts.parentMessage}"""`,
    `Candidate reply: """${opts.candidateReply}"""`,
    `Return the JSON object only.`,
  ].join("\n");
}

export const REVISION_INSTRUCTIONS = `The Supervisor flagged the previous reply. Produce a new reply that:
- Performs the required MI moves listed in the node prompt.
- Removes any persuasion, confrontation, unrequested facts, or stacked questions.
- Stays within 1–3 short sentences.
- Does NOT mention this revision, the supervisor, the node, or any internal labels.`;

export const FALLBACK_REPLIES = {
  respectfulClose:
    "Thank you for talking with me today. Your perspective matters, and the decision is yours. Your child's healthcare provider is a good person to bring questions to whenever you're ready.",
  clarify:
    "I want to make sure I understand. Could you share a little more about what's on your mind right now?",
  deferMedical:
    "That's an important question, and your child's healthcare provider is the right person to give you advice about your child specifically.",
  cannotAnswer:
    "I'm not able to safely answer that here. Your child's healthcare provider can help you think it through with information specific to your child.",
  serviceUnavailable:
    "I'm having trouble responding right now. Please try again in a moment.",
} as const;

export type FallbackKey = keyof typeof FALLBACK_REPLIES;
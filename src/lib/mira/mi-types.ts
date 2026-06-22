// MIDT — MI Routing Engine type definitions.
// Prototype only. Not production clinical schema.

export type MiPhase = "P1" | "P2" | "P3" | "P4" | "P5";

export type ParentStance = "UNKNOWN" | "WILLING" | "AMBIV" | "OPPOSED";

export type PermissionState = "UNKNOWN" | "GRANTED" | "DENIED";

export type RoutingOutcome =
  | "CONT-P1"
  | "CONT-P2"
  | "CONT-P3"
  | "CONT-P4"
  | "CONT-P5"
  | "MOVE-P2"
  | "MOVE-P3"
  | "MOVE-P4"
  | "MOVE-P5"
  | "CLOSE";

export type ContentStatus = "mock" | "draft" | "approved";

export interface RoutingNode {
  nodeId: string;
  phase: MiPhase;
  title: string;
  goal: string;
  allowedContent: string[];
  prohibitedContent: string[];
  requiredMiMoves: string[];
  optionalMiMoves: string[];
  permittedOutcomes: RoutingOutcome[];
  transitionCriteria: string[];
  contentStatus: ContentStatus;
  version: string;
}

export interface MiSessionState {
  sessionId: string;
  phase: MiPhase;
  nodeId: string;
  stance: ParentStance;
  permissionState: PermissionState;
  concernCategory?: string;
  turnCount: number;
  outcome?: RoutingOutcome;
  isComplete: boolean;
  routingVersion: string;
  promptVersion: string;
}

export type SupervisorVerdict = "APPROVED" | "REVISE" | "BLOCK";

export type SupervisorViolation =
  | "PERSUADE"
  | "CONFRONT"
  | "PREMATURE_INFORMATION"
  | "NO_PERMISSION"
  | "UNSUPPORTED_MEDICAL_CLAIM"
  | "INDIVIDUALIZED_MEDICAL_ADVICE"
  | "QUESTION_STACKING"
  | "EXCESSIVE_LENGTH"
  | "PROMPT_LEAKAGE"
  | "OUT_OF_SCOPE"
  | "UNSAFE";

export interface SupervisorReport {
  verdict: SupervisorVerdict;
  requiredMoves: string[];
  observedMoves: string[];
  violations: SupervisorViolation[];
  fallbackUsed: boolean;
  revisionRequested?: boolean;
  notes?: string;
}

export interface DeveloperTrace {
  previousNode: string;
  selectedNode: string;
  selectedOutcome: RoutingOutcome;
  classificationConfidence: number;
  detectedKeywords?: string[];
  candidateLengthChars?: number;
  retrievedSourceIds?: string[];
  latencyMs?: number;
}

export interface OrchestrateChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface OrchestrateRequest {
  message: string;
  history: OrchestrateChatMessage[];
  state: MiSessionState;
  model: string;
  developerMode?: boolean;
}

export interface OrchestrateResponse {
  content: string;
  state: MiSessionState;
  supervisor: SupervisorReport;
  developerTrace?: DeveloperTrace;
}

export const ROUTING_VERSION = "routing-draft-0.1";
export const PROMPT_VERSION = "mi-playbook-draft-0.1";

export function createInitialSessionState(sessionId: string): MiSessionState {
  return {
    sessionId,
    phase: "P1",
    nodeId: "P1-OPEN",
    stance: "UNKNOWN",
    permissionState: "UNKNOWN",
    turnCount: 0,
    isComplete: false,
    routingVersion: ROUTING_VERSION,
    promptVersion: PROMPT_VERSION,
  };
}
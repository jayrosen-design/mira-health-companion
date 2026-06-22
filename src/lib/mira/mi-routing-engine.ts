import { getNode } from "./mi-routing-config";
import type {
  MiSessionState,
  ParentStance,
  PermissionState,
  RoutingNode,
  RoutingOutcome,
} from "./mi-types";

// Deterministic, prototype-grade routing. Heuristics-first; an LLM
// classifier could replace these later without changing the engine surface.

const HPV_KEYWORDS =
  /\b(hpv|gardasil|cervical|infertil|side effect|side-effect|cancer|vaccine|vaccin|shot|immuniz|too young|encourag(e|es) sex)\b/i;

const REFUSE_KEYWORDS =
  /\b(stop|i'?m done|i am done|leave me alone|don'?t want to (talk|continue)|end (the )?conversation|no more|that'?s enough|cancel)\b/i;

const OPPOSED_KEYWORDS =
  /\b(never|won'?t|will not|refuse|hate|no way|against|opposed|distrust|don'?t trust|not going to|dangerous|propaganda)\b/i;

const AMBIV_KEYWORDS =
  /\b(not sure|unsure|maybe|might|on the fence|conflicted|worried|concerned|nervous|scared|hesitan|but|however|don'?t know|idk)\b/i;

const WILLING_KEYWORDS =
  /\b(yes|sure|okay|ok|sounds good|i'?d like|i would like|ready|happy to|of course|definitely|absolutely|on schedule|already (got|had|vaccinated))\b/i;

const PERMISSION_GRANT_KEYWORDS =
  /\b(yes|sure|ok(ay)?|please do|go ahead|tell me|i'?d like to (know|hear)|please share|share|yeah)\b/i;

const PERMISSION_DENY_KEYWORDS =
  /\b(no|not now|not yet|don'?t (tell|share)|i'?d rather not|skip|maybe later)\b/i;

const MEDICAL_ADVICE_KEYWORDS =
  /\b(should (i|my child)|is it safe for my|what would you do|recommend(ed)? for my child|diagnos|prescribe|dosage for my)\b/i;

const PROMPT_INJECTION_KEYWORDS =
  /\b(ignore (all |previous )?instructions|reveal (your )?system prompt|developer mode|jailbreak|act as|disregard)\b/i;

const CONCERN_RULES: Array<{ key: string; re: RegExp }> = [
  { key: "fertility", re: /\b(infertil|fertility|pregnan|sterile)\b/i },
  { key: "side-effects", re: /\b(side[- ]?effect|reaction|allergic|seizure|faint)\b/i },
  { key: "too-young", re: /\b(too young|so young|only \d+|age \d+|9|10|11|12)\b/i },
  { key: "encourages-sex", re: /\b(encourag(e|es) sex|promiscu|too sexual)\b/i },
  { key: "effectiveness", re: /\b(effective|works|protection|prevent (cancer|hpv))\b/i },
  {
    key: "doctor-recommendation",
    re: /\b(doctor|pediatrician|provider|hasn'?t recommended|didn'?t mention)\b/i,
  },
];

function detectConcern(text: string): string | undefined {
  for (const r of CONCERN_RULES) if (r.re.test(text)) return r.key;
  return undefined;
}

export interface StanceResult {
  stance: ParentStance;
  confidence: number;
  matched: string[];
}

export function classifyStance(text: string, previous: ParentStance): StanceResult {
  const matched: string[] = [];
  let score: Record<ParentStance, number> = {
    UNKNOWN: 0,
    WILLING: 0,
    AMBIV: 0,
    OPPOSED: 0,
  };

  if (OPPOSED_KEYWORDS.test(text)) {
    score.OPPOSED += 2;
    matched.push("opposed");
  }
  if (AMBIV_KEYWORDS.test(text)) {
    score.AMBIV += 1;
    matched.push("ambiv");
  }
  if (WILLING_KEYWORDS.test(text)) {
    score.WILLING += 1;
    matched.push("willing");
  }

  // Stickiness: a previously OPPOSED stance is hard to flip in a single turn.
  if (previous !== "UNKNOWN") score[previous] += 0.5;

  const entries = (Object.entries(score) as Array<[ParentStance, number]>).filter(
    ([k]) => k !== "UNKNOWN",
  );
  entries.sort((a, b) => b[1] - a[1]);
  const [topStance, topScore] = entries[0];
  if (topScore <= 0)
    return { stance: previous === "UNKNOWN" ? "UNKNOWN" : previous, confidence: 0.3, matched };
  const total = entries.reduce((s, [, v]) => s + v, 0) || 1;
  return { stance: topStance, confidence: Math.min(0.95, topScore / total), matched };
}

export function detectPermission(text: string, previous: PermissionState): PermissionState {
  // Implied permission: parent directly asks a factual question.
  if (/\?/.test(text) && HPV_KEYWORDS.test(text)) return "GRANTED";
  if (PERMISSION_DENY_KEYWORDS.test(text) && !PERMISSION_GRANT_KEYWORDS.test(text))
    return "DENIED";
  if (PERMISSION_GRANT_KEYWORDS.test(text)) return "GRANTED";
  return previous;
}

export interface RoutingDecision {
  nextState: MiSessionState;
  node: RoutingNode;
  outcome: RoutingOutcome;
  previousNode: string;
  classificationConfidence: number;
  detectedKeywords: string[];
  isRefusal: boolean;
  isMedicalAdviceRequest: boolean;
  isPromptInjection: boolean;
}

export function decideRouting(
  parentMessage: string,
  state: MiSessionState,
): RoutingDecision {
  const isRefusal = REFUSE_KEYWORDS.test(parentMessage);
  const isMedicalAdviceRequest = MEDICAL_ADVICE_KEYWORDS.test(parentMessage);
  const isPromptInjection = PROMPT_INJECTION_KEYWORDS.test(parentMessage);
  const stanceRes = classifyStance(parentMessage, state.stance);
  const newPermission = detectPermission(parentMessage, state.permissionState);
  const concern = detectConcern(parentMessage) ?? state.concernCategory;
  const hasHpv = HPV_KEYWORDS.test(parentMessage);

  let nodeId = state.nodeId;
  let phase = state.phase;
  let outcome: RoutingOutcome = "CONT-P1";
  let isComplete = false;

  if (isRefusal) {
    nodeId = state.phase === "P1" ? "P1-CLOSE-01" : "P5-CLOSE-01";
    phase = state.phase === "P1" ? "P1" : "P5";
    outcome = "CLOSE";
    isComplete = true;
  } else if (state.phase === "P1") {
    if (hasHpv) {
      nodeId = "P1-HPV-EARLY-01";
      outcome = "MOVE-P2";
      phase = "P2";
    } else if (stanceRes.stance === "OPPOSED") {
      nodeId = "P1-OPPOSED-01";
      outcome = "CONT-P1";
    } else if (stanceRes.stance === "AMBIV") {
      nodeId = "P1-AMBIV-01";
      outcome = "CONT-P1";
    } else if (stanceRes.stance === "WILLING" && state.turnCount >= 1) {
      nodeId = "P1-WILLING-01";
      outcome = "MOVE-P2";
      phase = "P2";
    } else if (stanceRes.stance === "WILLING") {
      nodeId = "P1-WILLING-01";
      outcome = "CONT-P1";
    } else {
      nodeId = "P1-OPEN";
      outcome = "CONT-P1";
    }
  } else if (state.phase === "P2") {
    if (newPermission === "GRANTED") {
      nodeId = "P3-PERMISSION-01";
      phase = "P3";
      outcome = "MOVE-P3";
    } else if (newPermission === "DENIED") {
      nodeId = "P3-DENIED-01";
      phase = "P3";
      outcome = "MOVE-P3";
    } else {
      nodeId = "P2-ELICIT-01";
      outcome = "CONT-P2";
    }
  } else if (state.phase === "P3") {
    if (state.nodeId === "P3-DENIED-01") {
      nodeId = "P4-PLAN-01";
      phase = "P4";
      outcome = "MOVE-P4";
    } else {
      // After one offer turn, move to planning.
      nodeId = "P4-PLAN-01";
      phase = "P4";
      outcome = "MOVE-P4";
    }
  } else if (state.phase === "P4") {
    nodeId = "P5-CLOSE-01";
    phase = "P5";
    outcome = "MOVE-P5";
  } else if (state.phase === "P5") {
    nodeId = "P5-CLOSE-01";
    outcome = "CLOSE";
    isComplete = true;
  }

  // Medical advice request short-circuits content; the supervisor + phase
  // prompt will redirect to provider. We do NOT mark complete.
  const node = getNode(nodeId);

  const nextState: MiSessionState = {
    ...state,
    phase,
    nodeId,
    stance: stanceRes.stance,
    permissionState: newPermission,
    concernCategory: concern,
    turnCount: state.turnCount + 1,
    outcome,
    isComplete,
  };

  const detectedKeywords: string[] = [];
  if (hasHpv) detectedKeywords.push("hpv");
  if (isRefusal) detectedKeywords.push("refusal");
  if (isMedicalAdviceRequest) detectedKeywords.push("medical-advice-request");
  if (isPromptInjection) detectedKeywords.push("prompt-injection");
  detectedKeywords.push(...stanceRes.matched);

  return {
    nextState,
    node,
    outcome,
    previousNode: state.nodeId,
    classificationConfidence: stanceRes.confidence,
    detectedKeywords,
    isRefusal,
    isMedicalAdviceRequest,
    isPromptInjection,
  };
}
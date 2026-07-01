// MIDT — Simulated Parent scenarios.
// Deterministic scripted test tool. NOT a live LLM call.
// Synthetic content for prototype testing only. Not training data.

import type { MiPhase, ParentStance } from "./mi-types";

export type SimulatedParentType = "willing" | "ambivalent" | "opposed";

export interface SimulatedParentTurn {
  id: string;
  expectedPhase: MiPhase;
  expectedStance: ParentStance;
  content: string;
}

export interface SimulatedParentScenario {
  id: SimulatedParentType;
  label: string;
  description: string;
  startingStance: ParentStance;
  turns: SimulatedParentTurn[];
}

export const SIMULATED_PARENT_VERSION = "simulated-parent-0.1";
export const SIMULATED_PARENT_DEFAULT_DELAY_MS = 1200;
export const SIMULATED_PARENT_INITIAL_DELAY_MS = 1000;
export const SIMULATION_MAX_TURNS = 12;

export const SIMULATED_PARENT_SCENARIOS: Record<SimulatedParentType, SimulatedParentScenario> = {
  willing: {
    id: "willing",
    label: "Willing",
    description: "Generally trusts preventive care and is open to learning more.",
    startingStance: "WILLING",
    turns: [
      { id: "willing-01", expectedPhase: "P1", expectedStance: "WILLING", content: "We try to stay on top of checkups and usually follow what our pediatrician recommends." },
      { id: "willing-02", expectedPhase: "P1", expectedStance: "WILLING", content: "We usually keep up with recommended vaccines, although I still like to understand what each one is for." },
      { id: "willing-03", expectedPhase: "P2", expectedStance: "WILLING", content: "My main question about the HPV vaccine is why it is recommended when children are still so young." },
      { id: "willing-04", expectedPhase: "P3", expectedStance: "WILLING", content: "Yes, you can share a little information about the reason for that timing." },
      { id: "willing-05", expectedPhase: "P3", expectedStance: "WILLING", content: "That helps me understand the reasoning. I had not thought about it as protection that begins ahead of time." },
      { id: "willing-06", expectedPhase: "P4", expectedStance: "WILLING", content: "I think my next step would be to ask our pediatrician about it at the next appointment." },
      { id: "willing-07", expectedPhase: "P5", expectedStance: "WILLING", content: "That sounds good. I do not have any other questions right now." },
    ],
  },
  ambivalent: {
    id: "ambivalent",
    label: "Ambivalent",
    description: "Values preventive care but has mixed feelings and wants more information.",
    startingStance: "AMBIV",
    turns: [
      { id: "ambivalent-01", expectedPhase: "P1", expectedStance: "AMBIV", content: "I keep up with appointments, but I like to research recommendations before agreeing to them." },
      { id: "ambivalent-02", expectedPhase: "P1", expectedStance: "AMBIV", content: "I am not against vaccines, but I do not automatically agree to every recommendation." },
      { id: "ambivalent-03", expectedPhase: "P2", expectedStance: "AMBIV", content: "I have heard mixed things about the HPV vaccine, especially about side effects and whether children need it this young." },
      { id: "ambivalent-04", expectedPhase: "P3", expectedStance: "AMBIV", content: "You can share a little about why the timing is recommended." },
      { id: "ambivalent-05", expectedPhase: "P3", expectedStance: "AMBIV", content: "I understand the reasoning better, but I am still nervous about possible side effects." },
      { id: "ambivalent-06", expectedPhase: "P4", expectedStance: "AMBIV", content: "I would probably want to write down my questions and talk with our pediatrician before deciding." },
      { id: "ambivalent-07", expectedPhase: "P5", expectedStance: "AMBIV", content: "I am not ready to decide today, but I feel more prepared to ask questions." },
    ],
  },
  opposed: {
    id: "opposed",
    label: "Opposed",
    description: "Is skeptical of vaccines, does not want pressure, and may choose not to continue.",
    startingStance: "OPPOSED",
    turns: [
      { id: "opposed-01", expectedPhase: "P1", expectedStance: "OPPOSED", content: "We do routine checkups, but I am very cautious about vaccines and I do not like feeling pressured." },
      { id: "opposed-02", expectedPhase: "P1", expectedStance: "OPPOSED", content: "I do not always trust vaccine recommendations, especially when they seem to be pushed very strongly." },
      { id: "opposed-03", expectedPhase: "P2", expectedStance: "OPPOSED", content: "I have heard the HPV vaccine is unnecessary at this age, and I am uncomfortable with how strongly it is promoted." },
      { id: "opposed-04", expectedPhase: "P3", expectedStance: "OPPOSED", content: "You can explain briefly, but I am not promising that I will agree." },
      { id: "opposed-05", expectedPhase: "P3", expectedStance: "OPPOSED", content: "I hear what you are saying, but I am still not comfortable making this decision." },
      { id: "opposed-06", expectedPhase: "P4", expectedStance: "OPPOSED", content: "I am not planning to schedule it now. I may discuss it with our doctor later." },
      { id: "opposed-07", expectedPhase: "P5", expectedStance: "OPPOSED", content: "I would like to stop here." },
    ],
  },
};

export type SimulationStatus = "idle" | "running" | "paused" | "completed" | "stopped";

export interface SimulationTurnResult {
  turnId: string;
  scenarioId: SimulatedParentType;
  scenarioVersion: string;
  scriptedContent: string;
  expectedPhase: MiPhase;
  expectedStance: ParentStance;
  actualPhase: MiPhase | null;
  actualStance: ParentStance | null;
  outcome: string | null;
  verdict: string | null;
  regeneration: boolean;
  fallback: boolean;
  result: "Pass" | "Review" | "Stopped" | "Closed correctly";
}

export interface SimulatedParentMetadata {
  origin: "synthetic_parent_simulation";
  scenarioId: SimulatedParentType;
  scenarioVersion: string;
  scriptedTurnId: string;
  eligibleForTraining: false;
}

export function buildSimulatedParentMetadata(
  scenarioId: SimulatedParentType,
  scriptedTurnId: string,
): SimulatedParentMetadata {
  return {
    origin: "synthetic_parent_simulation",
    scenarioId,
    scenarioVersion: SIMULATED_PARENT_VERSION,
    scriptedTurnId,
    eligibleForTraining: false,
  };
}

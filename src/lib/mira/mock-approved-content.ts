// MIDT mock approved content. PROTOTYPE ONLY.
// This is NOT the final approved clinical corpus. Do not add new medical
// facts here. Use for demonstrating Phase 3 retrieval/grounding behavior.

export interface MockSource {
  id: string;
  concern: string;
  snippet: string;
  status: "mock";
}

export const MOCK_APPROVED_SOURCES: MockSource[] = [
  {
    id: "MOCK-HPV-001",
    concern: "side-effects",
    snippet:
      "Most reported reactions to the HPV vaccine are mild and short-lived, such as soreness at the injection site. Serious reactions are uncommon. Talk with your child's healthcare provider about your specific concerns.",
    status: "mock",
  },
  {
    id: "MOCK-HPV-002",
    concern: "fertility",
    snippet:
      "Current public-health summaries do not link the HPV vaccine to fertility problems. This is a frequently raised concern; your child's healthcare provider is the best person to discuss it with you.",
    status: "mock",
  },
  {
    id: "MOCK-HPV-003",
    concern: "too-young",
    snippet:
      "The HPV vaccine is generally offered around ages 9–12 because the immune response is strongest before exposure. This timing is unrelated to expectations about a child's behavior.",
    status: "mock",
  },
  {
    id: "MOCK-HPV-004",
    concern: "encourages-sex",
    snippet:
      "Available research summaries have not found that receiving the HPV vaccine changes sexual behavior in adolescents.",
    status: "mock",
  },
  {
    id: "MOCK-HPV-005",
    concern: "effectiveness",
    snippet:
      "Public-health summaries describe the HPV vaccine as effective at preventing the HPV types most often linked to certain cancers, when given on schedule.",
    status: "mock",
  },
  {
    id: "MOCK-HPV-006",
    concern: "doctor-recommendation",
    snippet:
      "A provider recommendation is one of the strongest factors in vaccination decisions. Bringing your questions to your child's healthcare provider can help.",
    status: "mock",
  },
];

export function findMockSource(concern?: string): MockSource | null {
  if (!concern) return null;
  return MOCK_APPROVED_SOURCES.find((s) => s.concern === concern) ?? null;
}
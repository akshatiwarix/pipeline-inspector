import type { Opportunity, ActivityEntry } from "./pipeline";

/** Hand-built fixtures for unit tests — never used by the corpus or the app. */
export function makeOpportunity(overrides: Partial<Opportunity> = {}): Opportunity {
  return {
    id: "test-opp",
    company: "Test Co",
    amount: 50_000,
    stage: "discovery",
    createdDate: "2026-01-01",
    stageEnteredDate: "2026-01-01",
    closeDate: "2026-04-01",
    outcomeProfile: "healthy",
    contacts: [{ name: "Alex Rivera", role: "VP of Sales" }],
    activityLog: [
      { date: "2026-01-01", type: "stage-change", contactName: null, note: "Opportunity created; entered Discovery." },
    ],
    ...overrides,
  };
}

export function makeActivity(overrides: Partial<ActivityEntry> = {}): ActivityEntry {
  return { date: "2026-01-01", type: "call", contactName: "Alex Rivera", note: "Call.", ...overrides };
}

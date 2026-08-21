import type { Opportunity, Stage } from "@/lib/domain/pipeline";
import type { Flag } from "@/lib/domain/inspection";
import { STAGE_LABEL } from "@/lib/domain/pipeline";
import { daysBetween } from "@/lib/dates";

/**
 * See PLAN.md § Method — checkStalledInStage. Matches data/generate.ts's
 * literal duplicate of this table; kept separate so generation and
 * evaluation never share mutable state (see PLAN.md Rule 5's spirit).
 */
export const STAGE_BENCHMARK_DAYS: Record<Stage, number> = {
  discovery: 10,
  demo: 14,
  proposal: 21,
  negotiation: 30,
};

/** The entry that started the opportunity's current stage: the last
 * `stage-change` logged on `stageEnteredDate`, or the opportunity's creation
 * entry (index 0) if none is found — e.g. hand-edited Try It Yourself input
 * that omits an explicit stage-change entry. */
function findStageEntryIndex(opportunity: Opportunity): number {
  const { activityLog, stageEnteredDate } = opportunity;
  for (let i = activityLog.length - 1; i >= 0; i--) {
    const entry = activityLog[i]!;
    if (entry.type === "stage-change" && entry.date === stageEnteredDate) return i;
  }
  return 0;
}

export function checkStalledInStage(opportunity: Opportunity, asOfDate: string): Flag | null {
  const daysInStage = daysBetween(opportunity.stageEnteredDate, asOfDate);
  const benchmark = STAGE_BENCHMARK_DAYS[opportunity.stage];
  if (daysInStage < benchmark) return null;

  const ratio = daysInStage / benchmark;
  const severity = ratio >= 2 ? "high" : ratio >= 1.5 ? "medium" : "low";
  const index = findStageEntryIndex(opportunity);
  const entry = opportunity.activityLog[index]!;

  return {
    type: "stalled-in-stage",
    severity,
    detail: `${daysInStage} days in ${STAGE_LABEL[opportunity.stage]} (benchmark: ${benchmark} days).`,
    evidence: [{ activityIndex: index, note: entry.note }],
  };
}

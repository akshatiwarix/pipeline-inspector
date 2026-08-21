import type { Opportunity } from "@/lib/domain/pipeline";
import type { Flag } from "@/lib/domain/inspection";

/** See PLAN.md § Method — checkCloseDateSlipping. */
const SLIP_THRESHOLD = 2;

export function checkCloseDateSlipping(opportunity: Opportunity): Flag | null {
  const evidence: { activityIndex: number; note: string }[] = [];
  opportunity.activityLog.forEach((entry, index) => {
    if (entry.type === "close-date-change") evidence.push({ activityIndex: index, note: entry.note });
  });

  if (evidence.length < SLIP_THRESHOLD) return null;

  return {
    type: "close-date-slipping",
    severity: evidence.length >= 3 ? "high" : "medium",
    detail: `Close date pushed back ${evidence.length} times.`,
    evidence,
  };
}

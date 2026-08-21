import type { Opportunity } from "@/lib/domain/pipeline";
import type { Flag } from "@/lib/domain/inspection";
import { STAGE_LABEL } from "@/lib/domain/pipeline";
import { daysBetween } from "@/lib/dates";
import { findLatestActivity } from "./latest-activity";

/** See PLAN.md § Method — checkHighValueCooling. */
const HIGH_VALUE_THRESHOLD = 100_000;
const COOLING_GAP_DAYS = 7;
const LATE_STAGES = new Set(["proposal", "negotiation"]);

export function checkHighValueCooling(opportunity: Opportunity, asOfDate: string): Flag | null {
  if (opportunity.amount < HIGH_VALUE_THRESHOLD) return null;
  if (!LATE_STAGES.has(opportunity.stage)) return null;

  const { index, entry } = findLatestActivity(opportunity.activityLog);
  const daysSince = daysBetween(entry.date, asOfDate);
  if (daysSince < COOLING_GAP_DAYS) return null;

  return {
    type: "high-value-cooling",
    severity: daysSince >= 14 ? "high" : "medium",
    detail: `$${opportunity.amount.toLocaleString()} deal in ${STAGE_LABEL[opportunity.stage]}, quiet for ${daysSince} days.`,
    evidence: [{ activityIndex: index, note: entry.note }],
  };
}

import type { Opportunity } from "@/lib/domain/pipeline";
import type { Flag } from "@/lib/domain/inspection";
import { daysBetween } from "@/lib/dates";
import { findLatestActivity } from "./latest-activity";

/** See PLAN.md § Method — checkNoRecentActivity. */
const STALE_ACTIVITY_DAYS = 14;

export function checkNoRecentActivity(opportunity: Opportunity, asOfDate: string): Flag | null {
  const { index, entry } = findLatestActivity(opportunity.activityLog);
  const daysSince = daysBetween(entry.date, asOfDate);
  if (daysSince < STALE_ACTIVITY_DAYS) return null;

  const severity = daysSince >= 35 ? "high" : daysSince >= 21 ? "medium" : "low";
  return {
    type: "no-recent-activity",
    severity,
    detail: `${daysSince} days since the last logged activity (flags at ${STALE_ACTIVITY_DAYS}+).`,
    evidence: [{ activityIndex: index, note: entry.note }],
  };
}

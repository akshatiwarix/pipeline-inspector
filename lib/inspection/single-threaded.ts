import type { Opportunity } from "@/lib/domain/pipeline";
import type { Flag } from "@/lib/domain/inspection";
import { daysBetween } from "@/lib/dates";

/** An opportunity is "young" if created within this many days of `asOfDate' —
 * a single-threaded young deal is less alarming than a single-threaded old one. */
const YOUNG_DEAL_DAYS = 30;

export function checkSingleThreaded(opportunity: Opportunity, asOfDate: string): Flag | null {
  const named = new Set<string>();
  const evidence: { activityIndex: number; note: string }[] = [];

  opportunity.activityLog.forEach((entry, index) => {
    if (entry.contactName === null) return;
    named.add(entry.contactName);
    evidence.push({ activityIndex: index, note: entry.note });
  });

  if (named.size > 1) return null;

  const age = daysBetween(opportunity.createdDate, asOfDate);
  const severity = age >= YOUNG_DEAL_DAYS ? "high" : "medium";
  const detail =
    named.size === 1
      ? `Only one contact (${Array.from(named)[0]}) has been engaged in ${age} days.`
      : `No named contact has been engaged in ${age} days.`;

  return { type: "single-threaded", severity, detail, evidence };
}

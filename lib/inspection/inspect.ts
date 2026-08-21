import type { Opportunity } from "@/lib/domain/pipeline";
import type { Flag, Inspection, HealthLevel } from "@/lib/domain/inspection";
import { checkNoRecentActivity } from "./no-recent-activity";
import { checkStalledInStage } from "./stalled-in-stage";
import { checkSingleThreaded } from "./single-threaded";
import { checkCloseDateSlipping } from "./close-date-slipping";
import { checkHighValueCooling } from "./high-value-cooling";

/** See PLAN.md § Method — Health rollup. */
function computeHealth(flags: Flag[]): HealthLevel {
  if (flags.some((f) => f.severity === "high") || flags.length >= 2) return "flagged";
  if (flags.length === 1) return "watch";
  return "clear";
}

/**
 * The single inspection entry point — runs unmodified in the browser (Try It
 * Yourself) and on the server (precomputed library + API route). No React,
 * HTTP, or DOM API may ever be imported into this module or anything it
 * calls. `asOfDate` is always an explicit parameter, never read from the
 * clock — see PLAN.md Rule 1 and Rule 3.
 */
export function inspectOpportunity(opportunity: Opportunity, asOfDate: string): Inspection {
  const flags = [
    checkNoRecentActivity(opportunity, asOfDate),
    checkStalledInStage(opportunity, asOfDate),
    checkSingleThreaded(opportunity, asOfDate),
    checkCloseDateSlipping(opportunity),
    checkHighValueCooling(opportunity, asOfDate),
  ].filter((flag): flag is Flag => flag !== null);

  return { flags, health: computeHealth(flags) };
}

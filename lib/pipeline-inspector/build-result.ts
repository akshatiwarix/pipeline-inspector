import type { Opportunity, OutcomeProfile } from "@/lib/domain/pipeline";
import type { OpportunityResult, PipelineSummary, PipelineInspectionResult } from "@/lib/domain/result";
import { inspectOpportunity } from "@/lib/inspection/inspect";

function flagRate(results: OpportunityResult[], profile: OutcomeProfile): number {
  const subset = results.filter((r) => r.opportunity.outcomeProfile === profile);
  if (subset.length === 0) return 0;
  const flagged = subset.filter((r) => r.inspection.health !== "clear");
  return Math.round((100 * flagged.length) / subset.length);
}

function computeSummary(results: OpportunityResult[]): PipelineSummary {
  return {
    opportunityCount: results.length,
    flaggedCount: results.filter((r) => r.inspection.health !== "clear").length,
    criticalCount: results.filter((r) => r.inspection.health === "flagged").length,
    flagRateByOutcomeProfile: {
      healthy: flagRate(results, "healthy"),
      stalling: flagRate(results, "stalling"),
      "at-risk": flagRate(results, "at-risk"),
    },
  };
}

/**
 * Runs inspection for every opportunity and assembles the full result.
 * `generatedAt` and `asOfDate` are parameters, never read from the clock
 * internally, so the pipeline stays byte-identical for the same corpus and
 * reference date across runs — see PLAN.md Rule 1 and Rule 3.
 */
export function buildPipelineInspectionResult(
  opportunities: Opportunity[],
  generatedAt: string,
  asOfDate: string,
): PipelineInspectionResult {
  const results: OpportunityResult[] = opportunities.map((opportunity) => ({
    opportunity,
    inspection: inspectOpportunity(opportunity, asOfDate),
  }));

  return {
    generatedAt,
    opportunityCount: opportunities.length,
    opportunities: results,
    summary: computeSummary(results),
  };
}

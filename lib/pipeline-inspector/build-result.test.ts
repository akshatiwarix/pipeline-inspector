import { describe, expect, it } from "vitest";
import { makeOpportunity, makeActivity } from "@/lib/domain/fixtures";
import { buildPipelineInspectionResult } from "./build-result";

const AS_OF = "2026-03-01";

// Two healthy opportunities that stay clear, one stalling opportunity that
// gets flagged, and one at-risk opportunity that gets flagged.
const HEALTHY_CLEAR = makeOpportunity({
  id: "healthy-1",
  outcomeProfile: "healthy",
  createdDate: "2026-02-20",
  stageEnteredDate: "2026-02-20",
  activityLog: [
    makeActivity({ date: "2026-02-20", contactName: "A" }),
    makeActivity({ date: "2026-02-25", contactName: "B" }),
  ],
});
const HEALTHY_CLEAR_2 = { ...HEALTHY_CLEAR, id: "healthy-2" };
const STALLING_FLAGGED = makeOpportunity({
  id: "stalling-1",
  outcomeProfile: "stalling",
  createdDate: "2025-12-01",
  stageEnteredDate: "2025-12-01",
  activityLog: [makeActivity({ date: "2026-01-01", contactName: "A" })], // stale + stalled-in-stage
});
const AT_RISK_WATCHED = makeOpportunity({
  id: "at-risk-1",
  outcomeProfile: "at-risk",
  createdDate: "2026-02-20",
  stageEnteredDate: "2026-02-20",
  activityLog: [makeActivity({ date: "2026-02-25", contactName: "Solo Contact" })], // single-threaded only
});

describe("buildPipelineInspectionResult", () => {
  const result = buildPipelineInspectionResult(
    [HEALTHY_CLEAR, HEALTHY_CLEAR_2, STALLING_FLAGGED, AT_RISK_WATCHED],
    "2026-03-01T00:00:00.000Z",
    AS_OF,
  );

  it("counts opportunities and computes inspections for every one", () => {
    expect(result.opportunityCount).toBe(4);
    expect(result.opportunities).toHaveLength(4);
  });

  it("aggregates flaggedCount (any non-clear health) and criticalCount (health === flagged)", () => {
    expect(result.summary.flaggedCount).toBe(2); // stalling (flagged) + at-risk (watch)
    expect(result.summary.criticalCount).toBe(1); // only the stalling opportunity reaches "flagged"
  });

  it("computes flag rate by outcome profile", () => {
    expect(result.summary.flagRateByOutcomeProfile.healthy).toBe(0);
    expect(result.summary.flagRateByOutcomeProfile.stalling).toBe(100);
    expect(result.summary.flagRateByOutcomeProfile["at-risk"]).toBe(100);
  });

  it("returns 0 for a profile with no opportunities in the input", () => {
    const emptyProfile = buildPipelineInspectionResult([HEALTHY_CLEAR], "2026-03-01T00:00:00.000Z", AS_OF);
    expect(emptyProfile.summary.flagRateByOutcomeProfile.stalling).toBe(0);
    expect(emptyProfile.summary.flagRateByOutcomeProfile["at-risk"]).toBe(0);
  });
});

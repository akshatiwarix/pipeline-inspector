import { describe, expect, it } from "vitest";
import { makeOpportunity, makeActivity } from "@/lib/domain/fixtures";
import { checkStalledInStage } from "./stalled-in-stage";

describe("checkStalledInStage", () => {
  it("does not fire under the stage benchmark (discovery: 10 days)", () => {
    const opportunity = makeOpportunity({ stage: "discovery", stageEnteredDate: "2026-01-01" });
    expect(checkStalledInStage(opportunity, "2026-01-09")).toBeNull(); // 8 days
  });

  it("fires low severity at [1x, 1.5x) the benchmark", () => {
    const opportunity = makeOpportunity({ stage: "discovery", stageEnteredDate: "2026-01-01" });
    const flag = checkStalledInStage(opportunity, "2026-01-12"); // 11 days, benchmark 10
    expect(flag?.severity).toBe("low");
  });

  it("fires medium severity at [1.5x, 2x) the benchmark", () => {
    const opportunity = makeOpportunity({ stage: "discovery", stageEnteredDate: "2026-01-01" });
    const flag = checkStalledInStage(opportunity, "2026-01-17"); // 16 days
    expect(flag?.severity).toBe("medium");
  });

  it("fires high severity at 2x+ the benchmark", () => {
    const opportunity = makeOpportunity({ stage: "discovery", stageEnteredDate: "2026-01-01" });
    const flag = checkStalledInStage(opportunity, "2026-01-25"); // 24 days
    expect(flag?.severity).toBe("high");
  });

  it("uses each stage's own benchmark", () => {
    const opportunity = makeOpportunity({ stage: "negotiation", stageEnteredDate: "2026-01-01" });
    expect(checkStalledInStage(opportunity, "2026-01-20")).toBeNull(); // 19 days, benchmark 30
    expect(checkStalledInStage(opportunity, "2026-02-05")?.severity).toBe("low"); // 35 days
  });

  it("points evidence at the stage-change entry marking the current stage", () => {
    const opportunity = makeOpportunity({
      stage: "demo",
      createdDate: "2026-01-01",
      stageEnteredDate: "2026-01-10",
      activityLog: [
        makeActivity({ date: "2026-01-01", type: "stage-change", contactName: null, note: "Entered Discovery." }),
        makeActivity({ date: "2026-01-10", type: "stage-change", contactName: null, note: "Entered Demo." }),
      ],
    });
    const flag = checkStalledInStage(opportunity, "2026-02-01")!;
    expect(flag.evidence).toEqual([{ activityIndex: 1, note: "Entered Demo." }]);
  });

  it("falls back to the first activity entry when no matching stage-change is logged", () => {
    const opportunity = makeOpportunity({
      stage: "demo",
      stageEnteredDate: "2026-01-10",
      activityLog: [makeActivity({ date: "2026-01-01", type: "call", note: "Only entry." })],
    });
    const flag = checkStalledInStage(opportunity, "2026-02-01")!;
    expect(flag.evidence).toEqual([{ activityIndex: 0, note: "Only entry." }]);
  });
});

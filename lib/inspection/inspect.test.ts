import { describe, expect, it } from "vitest";
import { makeOpportunity, makeActivity } from "@/lib/domain/fixtures";
import { inspectOpportunity } from "./inspect";

describe("inspectOpportunity health rollup", () => {
  it("is clear with zero flags", () => {
    const opportunity = makeOpportunity({
      createdDate: "2026-01-01",
      stageEnteredDate: "2026-01-01",
      activityLog: [
        makeActivity({ date: "2026-01-01", contactName: "Alex Rivera" }),
        makeActivity({ date: "2026-01-08", contactName: "Sam Okafor" }),
      ],
    });
    expect(inspectOpportunity(opportunity, "2026-01-09").health).toBe("clear");
  });

  it("is watch with exactly one low/medium flag", () => {
    // Single-threaded, young deal => exactly one medium flag.
    const opportunity = makeOpportunity({
      createdDate: "2026-01-01",
      stageEnteredDate: "2026-01-01",
      activityLog: [makeActivity({ date: "2026-01-05", contactName: "Alex Rivera" })],
    });
    const inspection = inspectOpportunity(opportunity, "2026-01-10");
    expect(inspection.flags).toHaveLength(1);
    expect(inspection.health).toBe("watch");
  });

  it("is flagged when any single flag is high severity", () => {
    const opportunity = makeOpportunity({
      createdDate: "2026-01-01",
      stageEnteredDate: "2026-01-01",
      activityLog: [makeActivity({ date: "2025-11-01", contactName: "Alex Rivera" })], // very stale
    });
    const inspection = inspectOpportunity(opportunity, "2026-02-01");
    expect(inspection.flags.some((f) => f.severity === "high")).toBe(true);
    expect(inspection.health).toBe("flagged");
  });

  it("is flagged when two or more flags fire, even without a high severity one", () => {
    // single-threaded (young, medium) + no-recent-activity (low) at once.
    const opportunity = makeOpportunity({
      createdDate: "2026-01-01",
      stageEnteredDate: "2026-01-01",
      activityLog: [makeActivity({ date: "2026-01-01", contactName: "Alex Rivera" })],
    });
    const inspection = inspectOpportunity(opportunity, "2026-01-16"); // 15 days since last activity
    expect(inspection.flags.length).toBeGreaterThanOrEqual(2);
    expect(inspection.flags.every((f) => f.severity !== "high")).toBe(true);
    expect(inspection.health).toBe("flagged");
  });
});

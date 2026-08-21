import { describe, expect, it } from "vitest";
import { makeOpportunity, makeActivity } from "@/lib/domain/fixtures";
import { checkSingleThreaded } from "./single-threaded";

describe("checkSingleThreaded", () => {
  it("does not fire with two or more distinct contacts", () => {
    const opportunity = makeOpportunity({
      createdDate: "2026-01-01",
      activityLog: [
        makeActivity({ contactName: "Alex Rivera" }),
        makeActivity({ contactName: "Sam Okafor" }),
      ],
    });
    expect(checkSingleThreaded(opportunity, "2026-01-05")).toBeNull();
  });

  it("fires medium severity for a young deal (under 30 days)", () => {
    const opportunity = makeOpportunity({
      createdDate: "2026-01-01",
      activityLog: [makeActivity({ contactName: "Alex Rivera" })],
    });
    const flag = checkSingleThreaded(opportunity, "2026-01-10"); // 9 days old
    expect(flag?.severity).toBe("medium");
  });

  it("fires high severity for an old deal (30+ days)", () => {
    const opportunity = makeOpportunity({
      createdDate: "2026-01-01",
      activityLog: [makeActivity({ contactName: "Alex Rivera" })],
    });
    const flag = checkSingleThreaded(opportunity, "2026-02-15"); // 45 days old
    expect(flag?.severity).toBe("high");
  });

  it("handles zero named contacts without crashing", () => {
    const opportunity = makeOpportunity({
      createdDate: "2026-01-01",
      activityLog: [makeActivity({ contactName: null, type: "stage-change", note: "Entered Discovery." })],
    });
    const flag = checkSingleThreaded(opportunity, "2026-02-15")!;
    expect(flag.evidence).toEqual([]);
    expect(flag.detail).toContain("No named contact");
  });

  it("collects evidence from every entry naming the sole contact", () => {
    const opportunity = makeOpportunity({
      createdDate: "2026-01-01",
      activityLog: [
        makeActivity({ contactName: "Alex Rivera", note: "First." }),
        makeActivity({ contactName: "Alex Rivera", note: "Second." }),
      ],
    });
    const flag = checkSingleThreaded(opportunity, "2026-01-10")!;
    expect(flag.evidence).toEqual([
      { activityIndex: 0, note: "First." },
      { activityIndex: 1, note: "Second." },
    ]);
  });
});

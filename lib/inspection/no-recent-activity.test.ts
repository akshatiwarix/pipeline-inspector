import { describe, expect, it } from "vitest";
import { makeOpportunity, makeActivity } from "@/lib/domain/fixtures";
import { checkNoRecentActivity } from "./no-recent-activity";

const AS_OF = "2026-02-01"; // 31 days after 2026-01-01

describe("checkNoRecentActivity", () => {
  it("does not fire when the last activity is under 14 days old", () => {
    const opportunity = makeOpportunity({
      activityLog: [makeActivity({ date: "2026-01-25" })], // 7 days before AS_OF
    });
    expect(checkNoRecentActivity(opportunity, AS_OF)).toBeNull();
  });

  it("fires low severity in [14, 21) days", () => {
    const opportunity = makeOpportunity({ activityLog: [makeActivity({ date: "2026-01-15" })] }); // 17 days
    const flag = checkNoRecentActivity(opportunity, AS_OF);
    expect(flag?.severity).toBe("low");
  });

  it("fires medium severity in [21, 35) days", () => {
    const opportunity = makeOpportunity({ activityLog: [makeActivity({ date: "2026-01-05" })] }); // 27 days
    const flag = checkNoRecentActivity(opportunity, AS_OF);
    expect(flag?.severity).toBe("medium");
  });

  it("fires high severity at 35+ days", () => {
    const opportunity = makeOpportunity({ activityLog: [makeActivity({ date: "2025-12-01" })] }); // 62 days
    const flag = checkNoRecentActivity(opportunity, AS_OF);
    expect(flag?.severity).toBe("high");
  });

  it("points evidence at the most recent activity entry", () => {
    const opportunity = makeOpportunity({
      activityLog: [
        makeActivity({ date: "2026-01-01", note: "Oldest." }),
        makeActivity({ date: "2026-01-05", note: "Most recent." }),
      ],
    });
    const flag = checkNoRecentActivity(opportunity, AS_OF)!;
    expect(flag.evidence).toEqual([{ activityIndex: 1, note: "Most recent." }]);
  });
});

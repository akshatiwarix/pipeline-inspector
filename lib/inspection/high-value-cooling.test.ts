import { describe, expect, it } from "vitest";
import { makeOpportunity, makeActivity } from "@/lib/domain/fixtures";
import { checkHighValueCooling } from "./high-value-cooling";

describe("checkHighValueCooling", () => {
  it("does not fire under the $100k threshold", () => {
    const opportunity = makeOpportunity({
      amount: 99_000,
      stage: "proposal",
      activityLog: [makeActivity({ date: "2026-01-01" })],
    });
    expect(checkHighValueCooling(opportunity, "2026-01-20")).toBeNull();
  });

  it("does not fire outside proposal/negotiation", () => {
    const opportunity = makeOpportunity({
      amount: 150_000,
      stage: "demo",
      activityLog: [makeActivity({ date: "2026-01-01" })],
    });
    expect(checkHighValueCooling(opportunity, "2026-01-20")).toBeNull();
  });

  it("does not fire under a 7-day activity gap", () => {
    const opportunity = makeOpportunity({
      amount: 150_000,
      stage: "proposal",
      activityLog: [makeActivity({ date: "2026-01-15" })],
    });
    expect(checkHighValueCooling(opportunity, "2026-01-20")).toBeNull(); // 5 days
  });

  it("fires medium severity in [7, 14) days", () => {
    const opportunity = makeOpportunity({
      amount: 150_000,
      stage: "negotiation",
      activityLog: [makeActivity({ date: "2026-01-10" })],
    });
    const flag = checkHighValueCooling(opportunity, "2026-01-20"); // 10 days
    expect(flag?.severity).toBe("medium");
  });

  it("fires high severity at 14+ days", () => {
    const opportunity = makeOpportunity({
      amount: 150_000,
      stage: "proposal",
      activityLog: [makeActivity({ date: "2026-01-01" })],
    });
    const flag = checkHighValueCooling(opportunity, "2026-01-20"); // 19 days
    expect(flag?.severity).toBe("high");
  });
});

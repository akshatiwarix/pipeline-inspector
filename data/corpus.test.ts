import { describe, expect, it } from "vitest";
import { OPPORTUNITIES } from "./corpus";
import { OPPORTUNITY_COUNT } from "./generate";
import { OUTCOME_PROFILES } from "@/lib/domain/pipeline";

describe("committed corpus structure", () => {
  it("has exactly 50 opportunities with unique ids", () => {
    expect(OPPORTUNITIES.length).toBe(OPPORTUNITY_COUNT);
    expect(new Set(OPPORTUNITIES.map((o) => o.id)).size).toBe(OPPORTUNITY_COUNT);
  });

  it("gives every opportunity at least one contact and one activity entry", () => {
    for (const opportunity of OPPORTUNITIES) {
      expect(opportunity.contacts.length).toBeGreaterThan(0);
      expect(opportunity.activityLog.length).toBeGreaterThan(0);
    }
  });

  it("has at least 12 opportunities of each outcome profile", () => {
    for (const profile of OUTCOME_PROFILES) {
      const count = OPPORTUNITIES.filter((o) => o.outcomeProfile === profile).length;
      expect(count).toBeGreaterThanOrEqual(12);
    }
  });

  it("gives every opportunity fixed synthetic dates, not derived from the real current date", () => {
    for (const opportunity of OPPORTUNITIES) {
      expect(opportunity.createdDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(opportunity.stageEnteredDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(opportunity.closeDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      for (const entry of opportunity.activityLog) {
        expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    }
  });

  it("keeps activityLog sorted chronologically", () => {
    for (const opportunity of OPPORTUNITIES) {
      const dates = opportunity.activityLog.map((e) => e.date);
      const sorted = [...dates].sort();
      expect(dates).toEqual(sorted);
    }
  });

  it("orders createdDate <= stageEnteredDate <= the last logged activity date", () => {
    for (const opportunity of OPPORTUNITIES) {
      const lastActivityDate = opportunity.activityLog[opportunity.activityLog.length - 1]!.date;
      expect(opportunity.createdDate <= opportunity.stageEnteredDate).toBe(true);
      expect(opportunity.stageEnteredDate <= lastActivityDate).toBe(true);
    }
  });

  it("only ever assigns open stages, never a closed one", () => {
    for (const opportunity of OPPORTUNITIES) {
      expect(["discovery", "demo", "proposal", "negotiation"]).toContain(opportunity.stage);
    }
  });
});

import { describe, expect, it } from "vitest";
import { parseOpportunityText } from "./parse-opportunity";

const WELL_FORMED = `
Company: Northwind Labs
Amount: 120000
Stage: proposal
Created: 2026-01-05
Stage entered: 2026-02-01
Close date: 2026-03-15
Contact: Priya Chen, VP of Engineering
Activity: 2026-01-05 meeting Priya Chen "Kickoff call, discussed requirements."
Activity: 2026-01-20 email Priya Chen "Sent pricing overview."
Activity: 2026-02-01 stage-change - "Moved to Proposal."
`;

describe("parseOpportunityText", () => {
  it("parses a well-formed opportunity with no skipped lines", () => {
    const { opportunity, skippedLineCount } = parseOpportunityText(WELL_FORMED);
    expect(skippedLineCount).toBe(0);
    expect(opportunity.company).toBe("Northwind Labs");
    expect(opportunity.amount).toBe(120_000);
    expect(opportunity.stage).toBe("proposal");
    expect(opportunity.createdDate).toBe("2026-01-05");
    expect(opportunity.stageEnteredDate).toBe("2026-02-01");
    expect(opportunity.closeDate).toBe("2026-03-15");
    expect(opportunity.contacts).toEqual([{ name: "Priya Chen", role: "VP of Engineering" }]);
    expect(opportunity.activityLog).toHaveLength(3);
    expect(opportunity.activityLog[2]!.contactName).toBeNull();
  });

  it("counts and skips unrecognized lines without throwing", () => {
    const text = `${WELL_FORMED}\nThis is not a valid line.\nNeither is this one.`;
    const { skippedLineCount } = parseOpportunityText(text);
    expect(skippedLineCount).toBe(2);
  });

  it("ignores blank lines without counting them as skipped", () => {
    const { skippedLineCount } = parseOpportunityText("\n\nCompany: Solo Co\n\n\n");
    expect(skippedLineCount).toBe(0);
  });

  it("derives contacts from activity entries when no Contact line is given", () => {
    const text = `Company: Solo Co\nActivity: 2026-01-01 call Jordan Lee "Intro call."`;
    const { opportunity } = parseOpportunityText(text);
    expect(opportunity.contacts).toEqual([{ name: "Jordan Lee", role: "Unknown" }]);
  });

  it("falls back to a placeholder contact and activity entry for a bare minimum input", () => {
    const { opportunity } = parseOpportunityText("Company: Bare Co");
    expect(opportunity.contacts).toEqual([{ name: "Unknown Contact", role: "Unknown" }]);
    expect(opportunity.activityLog).toHaveLength(1);
    expect(opportunity.activityLog[0]!.note).toBe("No activity logged.");
  });

  it("rejects a non-positive amount as malformed rather than crashing", () => {
    const { opportunity, skippedLineCount } = parseOpportunityText("Company: Zero Co\nAmount: 0");
    expect(skippedLineCount).toBe(1);
    expect(opportunity.amount).toBeGreaterThan(0);
  });

  it("always returns a schema-valid opportunity even for garbage input", () => {
    const { opportunity } = parseOpportunityText("asdkjhaskjdh\n!!!\n");
    expect(opportunity.contacts.length).toBeGreaterThan(0);
    expect(opportunity.activityLog.length).toBeGreaterThan(0);
    expect(opportunity.amount).toBeGreaterThan(0);
  });
});

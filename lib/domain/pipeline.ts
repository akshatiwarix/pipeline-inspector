import { z } from "zod";

export const STAGES = ["discovery", "demo", "proposal", "negotiation"] as const;
export type Stage = (typeof STAGES)[number];

/**
 * The fixed point in time the whole precomputed corpus is analyzed as-of.
 * Never `Date.now()` — see PLAN.md Rule 3. Try It Yourself is the one place
 * in the app that intentionally uses the real current date instead.
 */
export const ANALYSIS_DATE = "2026-03-01";

/** Shared with lib/inspection/ (flag detail text) and app/ (table/detail UI). */
export const STAGE_LABEL: Record<Stage, string> = {
  discovery: "Discovery",
  demo: "Demo",
  proposal: "Proposal",
  negotiation: "Negotiation",
};

export const OUTCOME_PROFILES = ["healthy", "stalling", "at-risk"] as const;
export type OutcomeProfile = (typeof OUTCOME_PROFILES)[number];

export const ACTIVITY_TYPES = ["call", "email", "meeting", "stage-change", "close-date-change"] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const ActivityEntrySchema = z.object({
  date: z.string(),
  type: z.enum(ACTIVITY_TYPES),
  contactName: z.string().nullable(),
  note: z.string(),
});
export type ActivityEntry = z.infer<typeof ActivityEntrySchema>;

export const ContactSchema = z.object({
  name: z.string(),
  role: z.string(),
});
export type Contact = z.infer<typeof ContactSchema>;

export const OpportunitySchema = z.object({
  id: z.string(),
  company: z.string(),
  amount: z.number().int().positive(),
  stage: z.enum(STAGES),
  createdDate: z.string(),
  stageEnteredDate: z.string(),
  closeDate: z.string(),
  outcomeProfile: z.enum(OUTCOME_PROFILES),
  contacts: z.array(ContactSchema).min(1),
  activityLog: z.array(ActivityEntrySchema).min(1),
});
export type Opportunity = z.infer<typeof OpportunitySchema>;

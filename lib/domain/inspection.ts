import { z } from "zod";

export const FLAG_TYPES = [
  "no-recent-activity",
  "stalled-in-stage",
  "single-threaded",
  "close-date-slipping",
  "high-value-cooling",
] as const;
export type FlagType = (typeof FLAG_TYPES)[number];

export const FLAG_SEVERITIES = ["high", "medium", "low"] as const;
export type FlagSeverity = (typeof FLAG_SEVERITIES)[number];

export const EvidenceSchema = z.object({
  activityIndex: z.number().int().nonnegative(),
  note: z.string(),
});
export type Evidence = z.infer<typeof EvidenceSchema>;

export const FlagSchema = z.object({
  type: z.enum(FLAG_TYPES),
  severity: z.enum(FLAG_SEVERITIES),
  detail: z.string(),
  evidence: z.array(EvidenceSchema),
});
export type Flag = z.infer<typeof FlagSchema>;

export const HEALTH_LEVELS = ["clear", "watch", "flagged"] as const;
export type HealthLevel = (typeof HEALTH_LEVELS)[number];

export const InspectionSchema = z.object({
  flags: z.array(FlagSchema),
  health: z.enum(HEALTH_LEVELS),
});
export type Inspection = z.infer<typeof InspectionSchema>;

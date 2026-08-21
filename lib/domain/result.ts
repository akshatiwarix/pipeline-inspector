import { z } from "zod";
import { OpportunitySchema } from "./pipeline";
import { InspectionSchema } from "./inspection";

export const OpportunityResultSchema = z.object({
  opportunity: OpportunitySchema,
  inspection: InspectionSchema,
});
export type OpportunityResult = z.infer<typeof OpportunityResultSchema>;

export const PipelineSummarySchema = z.object({
  opportunityCount: z.number().int().positive(),
  flaggedCount: z.number().int().nonnegative(),
  criticalCount: z.number().int().nonnegative(),
  flagRateByOutcomeProfile: z.object({
    healthy: z.number().int().min(0).max(100),
    stalling: z.number().int().min(0).max(100),
    "at-risk": z.number().int().min(0).max(100),
  }),
});
export type PipelineSummary = z.infer<typeof PipelineSummarySchema>;

export const PipelineInspectionResultSchema = z.object({
  generatedAt: z.string(),
  opportunityCount: z.number().int().positive(),
  opportunities: z.array(OpportunityResultSchema),
  summary: PipelineSummarySchema,
});
export type PipelineInspectionResult = z.infer<typeof PipelineInspectionResultSchema>;

import { NextResponse } from "next/server";
import { OPPORTUNITIES } from "@/data/corpus";
import { buildPipelineInspectionResult } from "@/lib/pipeline-inspector/build-result";
import { ANALYSIS_DATE } from "@/lib/domain/pipeline";
import { PipelineInspectionResultSchema, type PipelineInspectionResult } from "@/lib/domain/result";

let cached: PipelineInspectionResult | null = null;

function getPipelineInspectionResult(): PipelineInspectionResult {
  if (!cached) {
    const computed = buildPipelineInspectionResult(OPPORTUNITIES, new Date().toISOString(), ANALYSIS_DATE);
    cached = PipelineInspectionResultSchema.parse(computed);
  }
  return cached;
}

/** No auth, no persistence, no rate limit, no input to validate. */
export async function GET() {
  return NextResponse.json(getPipelineInspectionResult());
}

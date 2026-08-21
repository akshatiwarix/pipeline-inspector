import type { PipelineInspectionResult } from "@/lib/domain/result";
import { PipelineHealthPanel } from "./pipeline-health-panel";
import { OpportunityTable } from "./opportunity-table";

export function PipelineLibrary({ result }: { result: PipelineInspectionResult }) {
  return (
    <div className="space-y-8">
      <PipelineHealthPanel summary={result.summary} />
      <OpportunityTable opportunities={result.opportunities} />
    </div>
  );
}

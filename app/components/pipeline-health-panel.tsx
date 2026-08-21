import type { PipelineSummary } from "@/lib/domain/result";

export function PipelineHealthPanel({ summary }: { summary: PipelineSummary }) {
  return (
    <section aria-labelledby="health-heading" className="rounded-lg border border-line bg-paper-raised p-4">
      <h2 id="health-heading" className="font-display text-xl italic text-ink">
        Pipeline health
      </h2>
      <p className="mt-1 text-sm text-ink-dim">
        Every opportunity below was scanned by five deterministic rules. The calibration row compares
        the flag rate against each opportunity&apos;s hidden, generator-assigned storyline — this is a
        measured number, not a self-reported one.
      </p>
      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <Stat label="Opportunities" value={summary.opportunityCount} />
        <Stat label="Flagged" value={summary.flaggedCount} />
        <Stat label="Critical" value={summary.criticalCount} />
      </div>
      <div className="mt-4 border-t border-line pt-4">
        <p className="text-xs uppercase tracking-wide text-ink-dim">Flag rate by hidden storyline</p>
        <div className="mt-2 grid grid-cols-3 gap-4 text-center">
          <Stat label="Healthy" value={`${summary.flagRateByOutcomeProfile.healthy}%`} />
          <Stat label="Stalling" value={`${summary.flagRateByOutcomeProfile.stalling}%`} />
          <Stat label="At-risk" value={`${summary.flagRateByOutcomeProfile["at-risk"]}%`} />
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <div className="tabular font-mono text-3xl font-semibold text-ink">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wide text-ink-dim">{label}</div>
    </div>
  );
}

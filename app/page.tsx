import { OPPORTUNITIES } from "@/data/corpus";
import { buildPipelineInspectionResult } from "@/lib/pipeline-inspector/build-result";
import { ANALYSIS_DATE } from "@/lib/domain/pipeline";
import { PipelineLibrary } from "@/app/components/pipeline-library";

export default function Home() {
  const result = buildPipelineInspectionResult(OPPORTUNITIES, new Date().toISOString(), ANALYSIS_DATE);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-10 max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-wide text-ink-dim">
          Day 022 of 100 · Pipeline Inspector
        </p>
        <h1 className="mt-2 font-display text-4xl italic text-ink sm:text-5xl">
          Every open deal, scanned, evidenced, and calibrated.
        </h1>
        <p className="mt-4 text-ink-dim">
          {result.opportunityCount} synthetic open opportunities scanned by five deterministic risk
          rules — no recent activity, stalled in stage, single-threaded, a slipping close date, a
          cooling high-value deal — each flag carrying its own evidence and severity, checked against
          each opportunity&apos;s hidden underlying health.
        </p>
        <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <a
            className="underline decoration-line-strong underline-offset-4 hover:decoration-ink"
            href="https://github.com/akshatiwarix/pipeline-inspector"
          >
            Source
          </a>
          <a
            className="underline decoration-line-strong underline-offset-4 hover:decoration-ink"
            href="/try-it"
          >
            Try It Yourself
          </a>
          <a
            className="underline decoration-line-strong underline-offset-4 hover:decoration-ink"
            href="/api/v1/opportunities"
          >
            GET /api/v1/opportunities
          </a>
          <a
            className="underline decoration-line-strong underline-offset-4 hover:decoration-ink"
            href="/api/schema"
          >
            GET /api/schema
          </a>
          <a
            className="underline decoration-line-strong underline-offset-4 hover:decoration-ink"
            href="https://github.com/akshatiwarix/pipeline-inspector/blob/main/PLAN.md"
          >
            Plan
          </a>
        </p>
      </header>

      <PipelineLibrary result={result} />

      <footer className="mt-16 border-t border-line pt-6 text-xs text-ink-dim">
        Synthetic, seeded corpus — no real pipeline data, no live API calls, no model calls. Every
        rule&apos;s thresholds and the calibration formula are documented deterministic logic (see
        PLAN.md).
      </footer>
    </main>
  );
}

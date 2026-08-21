import { OPPORTUNITIES } from "../data/corpus";
import { generateCorpus, OPPORTUNITY_COUNT } from "../data/generate";
import { ANALYSIS_DATE, OUTCOME_PROFILES } from "../lib/domain/pipeline";
import { FLAG_TYPES, FLAG_SEVERITIES, HEALTH_LEVELS } from "../lib/domain/inspection";
import { inspectOpportunity } from "../lib/inspection/inspect";
import { buildPipelineInspectionResult } from "../lib/pipeline-inspector/build-result";

let failures = 0;

function check(name: string, condition: boolean, detail: string): void {
  if (condition) {
    console.log(`  ok  ${name}`);
  } else {
    failures++;
    console.log(`FAIL  ${name} — ${detail}`);
  }
}

console.log("Sweep: nine invariants over the committed corpus + full inspection pipeline\n");

// 1. Corpus size.
check(
  "1. corpus size",
  OPPORTUNITIES.length === OPPORTUNITY_COUNT &&
    new Set(OPPORTUNITIES.map((o) => o.id)).size === OPPORTUNITY_COUNT &&
    OPPORTUNITIES.every((o) => o.contacts.length > 0 && o.activityLog.length > 0),
  `expected ${OPPORTUNITY_COUNT} unique opportunities, each with a contact and an activity entry, got ${OPPORTUNITIES.length}`,
);

// 2. Outcome mix.
{
  const counts = Object.fromEntries(
    OUTCOME_PROFILES.map((p) => [p, OPPORTUNITIES.filter((o) => o.outcomeProfile === p).length]),
  );
  check(
    "2. outcome mix (>=12 of each)",
    OUTCOME_PROFILES.every((p) => counts[p]! >= 12),
    `counts=${JSON.stringify(counts)}`,
  );
}

const generatedAt = "2026-01-01T00:00:00.000Z"; // fixed, for determinism checks below
const result = buildPipelineInspectionResult(OPPORTUNITIES, generatedAt, ANALYSIS_DATE);

// 3. Field bounds.
{
  const severitiesOk = result.opportunities.every((r) =>
    r.inspection.flags.every((f) => (FLAG_SEVERITIES as readonly string[]).includes(f.severity)),
  );
  const healthOk = result.opportunities.every((r) => (HEALTH_LEVELS as readonly string[]).includes(r.inspection.health));
  const amountsOk = OPPORTUNITIES.every((o) => Number.isInteger(o.amount) && o.amount > 0);
  check(
    "3. field bounds (severity/health enums, positive integer amounts)",
    severitiesOk && healthOk && amountsOk,
    `severitiesOk=${severitiesOk} healthOk=${healthOk} amountsOk=${amountsOk}`,
  );
}

// 4. Evidence traceability.
{
  let ok = true;
  let bad = "";
  for (const r of result.opportunities) {
    for (const flag of r.inspection.flags) {
      for (const evidence of flag.evidence) {
        const entry = r.opportunity.activityLog[evidence.activityIndex];
        if (!entry || entry.note !== evidence.note) {
          ok = false;
          bad = `${r.opportunity.id} flag=${flag.type} activityIndex=${evidence.activityIndex}`;
        }
      }
    }
  }
  check("4. evidence traceability", ok, bad || "n/a");
}

// 5. Inspection reproducibility.
{
  const ok = result.opportunities.every((r) => {
    const recomputed = inspectOpportunity(r.opportunity, ANALYSIS_DATE);
    return JSON.stringify(recomputed) === JSON.stringify(r.inspection);
  });
  check("5. inspection reproducibility (recompute matches precomputed)", ok, "a recomputed inspection diverged from the precomputed one");
}

// 6. Signal coverage.
{
  const fired = new Set(result.opportunities.flatMap((r) => r.inspection.flags.map((f) => f.type)));
  const missing = FLAG_TYPES.filter((t) => !fired.has(t));
  check("6. signal coverage (every flag type fires at least once)", missing.length === 0, `missing=${JSON.stringify(missing)}`);
}

// 7. Risk calibration.
{
  const { healthy, stalling } = result.summary.flagRateByOutcomeProfile;
  const atRisk = result.summary.flagRateByOutcomeProfile["at-risk"];
  check(
    "7. risk calibration (stalling and at-risk flag rate > healthy)",
    stalling > healthy && atRisk > healthy,
    `healthy=${healthy} stalling=${stalling} at-risk=${atRisk}`,
  );
}

// 8. Healthy floor.
check(
  "8. healthy floor (healthy flag rate <= 25)",
  result.summary.flagRateByOutcomeProfile.healthy <= 25,
  `healthy=${result.summary.flagRateByOutcomeProfile.healthy}`,
);

// 9. Determinism.
{
  const corpusA = JSON.stringify(generateCorpus());
  const corpusB = JSON.stringify(generateCorpus());
  const pipelineA = JSON.stringify(buildPipelineInspectionResult(OPPORTUNITIES, generatedAt, ANALYSIS_DATE));
  const pipelineB = JSON.stringify(buildPipelineInspectionResult(OPPORTUNITIES, generatedAt, ANALYSIS_DATE));
  check(
    "9. determinism (corpus generation + full pipeline, byte-identical across two runs)",
    corpusA === corpusB && pipelineA === pipelineB,
    "two runs over the same seed/inputs differed",
  );
}

console.log(`\n${failures === 0 ? "All nine invariants passed." : `${failures} invariant(s) FAILED.`}`);
if (failures > 0) process.exit(1);

console.log("\nHeadline:");
console.log(
  `  flagged: ${result.summary.flaggedCount}/${result.summary.opportunityCount}  critical: ${result.summary.criticalCount}  ` +
    `calibration: healthy=${result.summary.flagRateByOutcomeProfile.healthy} stalling=${result.summary.flagRateByOutcomeProfile.stalling} at-risk=${result.summary.flagRateByOutcomeProfile["at-risk"]}`,
);

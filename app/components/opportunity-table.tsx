"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { OpportunityResult } from "@/lib/domain/result";
import { STAGES, STAGE_LABEL, type Stage } from "@/lib/domain/pipeline";
import { FLAG_TYPES, type FlagType, type HealthLevel } from "@/lib/domain/inspection";
import { HealthBadge } from "./health-badge";
import { FLAG_LABEL } from "./flag-label";

type SortColumn = "health" | "amount" | "company";
const ALL = "All" as const;

const HEALTH_RANK: Record<HealthLevel, number> = { flagged: 2, watch: 1, clear: 0 };

const SORT_LABEL: Record<SortColumn, string> = {
  health: "health",
  amount: "amount",
  company: "company",
};

export function OpportunityTable({ opportunities }: { opportunities: OpportunityResult[] }) {
  const [sortColumn, setSortColumn] = useState<SortColumn>("health");
  const [stageFilter, setStageFilter] = useState<Stage | typeof ALL>(ALL);
  const [flagFilter, setFlagFilter] = useState<FlagType | typeof ALL>(ALL);

  const filtered = useMemo(
    () =>
      opportunities.filter((o) => {
        const stageOk = stageFilter === ALL || o.opportunity.stage === stageFilter;
        const flagOk = flagFilter === ALL || o.inspection.flags.some((f) => f.type === flagFilter);
        return stageOk && flagOk;
      }),
    [opportunities, stageFilter, flagFilter],
  );

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sortColumn === "health") {
        const diff = HEALTH_RANK[b.inspection.health] - HEALTH_RANK[a.inspection.health];
        if (diff !== 0) return diff;
      } else if (sortColumn === "amount") {
        const diff = b.opportunity.amount - a.opportunity.amount;
        if (diff !== 0) return diff;
      } else {
        const diff = a.opportunity.company.localeCompare(b.opportunity.company);
        if (diff !== 0) return diff;
      }
      return a.opportunity.id.localeCompare(b.opportunity.id);
    });
  }, [filtered, sortColumn]);

  return (
    <section aria-labelledby="table-heading" className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="table-heading" className="font-display text-2xl italic text-ink">
          Pipeline Library
        </h2>
        <div className="flex flex-wrap gap-2 text-sm">
          <select
            aria-label="Filter by stage"
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value as Stage | typeof ALL)}
            className="rounded-md border border-line bg-paper-raised px-2 py-1"
          >
            <option value={ALL}>All stages</option>
            {STAGES.map((stage) => (
              <option key={stage} value={stage}>
                {STAGE_LABEL[stage]}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter by flag type"
            value={flagFilter}
            onChange={(e) => setFlagFilter(e.target.value as FlagType | typeof ALL)}
            className="rounded-md border border-line bg-paper-raised px-2 py-1"
          >
            <option value={ALL}>All flags</option>
            {FLAG_TYPES.map((type) => (
              <option key={type} value={type}>
                {FLAG_LABEL[type]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="text-sm text-ink-dim">
        Showing {sorted.length} of {opportunities.length} opportunities, sorted by{" "}
        <span className="font-medium text-ink">{SORT_LABEL[sortColumn]}</span>. Sort by{" "}
        {(["health", "amount", "company"] as const).map((column, i) => (
          <span key={column}>
            {i > 0 && " · "}
            <button
              type="button"
              onClick={() => setSortColumn(column)}
              className={
                sortColumn === column
                  ? "font-medium text-ink underline decoration-line-strong underline-offset-2"
                  : "underline decoration-line-strong underline-offset-2 hover:decoration-ink"
              }
            >
              {SORT_LABEL[column]}
            </button>
          </span>
        ))}
        .
      </p>

      <div className="overflow-x-auto rounded-lg border border-line">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line bg-paper-raised text-left text-xs uppercase tracking-wide text-ink-dim">
              <th className="px-3 py-2">Company</th>
              <th className="px-3 py-2">Stage</th>
              <th className="px-3 py-2">Amount</th>
              <th className="px-3 py-2">Health</th>
              <th className="px-3 py-2">Flags</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((result) => (
              <tr key={result.opportunity.id} className="border-b border-line last:border-0 hover:bg-paper-raised">
                <td className="px-3 py-2">
                  <Link
                    href={`/opportunities/${result.opportunity.id}`}
                    className="font-medium text-ink underline decoration-line-strong underline-offset-2 hover:decoration-ink"
                  >
                    {result.opportunity.company}
                  </Link>
                </td>
                <td className="px-3 py-2 text-ink">{STAGE_LABEL[result.opportunity.stage]}</td>
                <td className="tabular px-3 py-2 font-mono text-ink">
                  ${result.opportunity.amount.toLocaleString("en-US")}
                </td>
                <td className="px-3 py-2">
                  <HealthBadge health={result.inspection.health} />
                </td>
                <td className="max-w-[280px] px-3 py-2 text-xs text-ink-dim">
                  {result.inspection.flags.length > 0
                    ? result.inspection.flags.map((f) => FLAG_LABEL[f.type]).join(", ")
                    : "None"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

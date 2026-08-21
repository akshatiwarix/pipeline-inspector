"use client";

import { useMemo, useState } from "react";
import { parseOpportunityText } from "@/lib/inspection/parse-opportunity";
import { inspectOpportunity } from "@/lib/inspection/inspect";
import { todayIso, addDays } from "@/lib/dates";
import { ActivityTimeline } from "./activity-timeline";
import { FlagsPanel } from "./flags-panel";
import { HealthBadge } from "./health-badge";

/**
 * Built relative to "today" (not a fixed date) so the example stays a
 * realistic, moderately-aged deal no matter when this page is visited —
 * see PLAN.md Rule 3 on Try It Yourself using the real clock.
 */
function buildExample(today: string): string {
  const created = addDays(today, -25);
  const introDate = addDays(today, -24);
  const demoDate = addDays(today, -22);
  const secondContactDate = addDays(today, -21);
  const proposalDate = addDays(today, -20);
  const pricingDate = addDays(today, -18);
  const closeDatePush = addDays(today, -12);
  const lastActivity = addDays(today, -9);
  const closeDate = addDays(today, 25);

  return `Company: Northwind Labs
Amount: 120000
Stage: proposal
Created: ${created}
Stage entered: ${proposalDate}
Close date: ${closeDate}
Contact: Priya Chen, VP of Engineering
Contact: Jordan Reyes, Director of IT
Activity: ${created} stage-change - "Opportunity created; entered Discovery."
Activity: ${introDate} meeting Priya Chen "Kickoff call, discussed requirements."
Activity: ${demoDate} stage-change - "Entered Demo."
Activity: ${secondContactDate} call Jordan Reyes "Introductory call with Jordan Reyes, Director of IT."
Activity: ${proposalDate} stage-change - "Entered Proposal."
Activity: ${pricingDate} email Priya Chen "Sent pricing overview."
Activity: ${closeDatePush} close-date-change - "Close date pushed back (push 1 of 1)."
Activity: ${lastActivity} call Priya Chen "Follow-up call to review open questions."`;
}

export function TryItForm() {
  const [today] = useState(() => todayIso());
  const [rawText, setRawText] = useState(() => buildExample(today));

  const { opportunity, skippedLineCount } = useMemo(() => parseOpportunityText(rawText), [rawText]);
  const inspection = useMemo(() => inspectOpportunity(opportunity, today), [opportunity, today]);

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div>
        <h2 className="font-display text-xl italic text-ink">Paste or edit an opportunity</h2>
        <p className="mt-1 text-xs text-ink-dim">
          Lines: <code className="font-mono">Company:</code>, <code className="font-mono">Amount:</code>,{" "}
          <code className="font-mono">Stage:</code>, <code className="font-mono">Created:</code>,{" "}
          <code className="font-mono">Stage entered:</code>, <code className="font-mono">Close date:</code>,{" "}
          <code className="font-mono">Contact: Name, Role</code>, and{" "}
          <code className="font-mono">Activity: YYYY-MM-DD type ContactOrDash &quot;note&quot;</code> (type is
          call/email/meeting/stage-change/close-date-change). Evaluated against today&apos;s date ({today}),
          not the Pipeline Library&apos;s fixed snapshot date.
        </p>
        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          rows={18}
          spellCheck={false}
          aria-label="Opportunity text"
          className="mt-3 w-full rounded-lg border border-line bg-paper-raised p-3 font-mono text-sm text-ink"
        />
        {skippedLineCount > 0 && (
          <p className="mt-2 text-xs text-risk-high">
            {skippedLineCount} line{skippedLineCount === 1 ? "" : "s"} didn&apos;t match the format above and{" "}
            {skippedLineCount === 1 ? "was" : "were"} skipped.
          </p>
        )}
        <div className="mt-4 max-h-[300px] overflow-y-auto rounded-lg border border-line bg-paper-raised p-4">
          <ActivityTimeline activityLog={opportunity.activityLog} />
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-xl italic text-ink">Fired flags</h2>
          <HealthBadge health={inspection.health} />
        </div>
        <p className="mt-1 text-xs text-ink-dim">
          Runs the exact same inspector as the Pipeline Library, live in your browser.
        </p>
        <div className="mt-3 rounded-lg border border-line bg-paper-raised p-4">
          <FlagsPanel flags={inspection.flags} />
        </div>
      </div>
    </div>
  );
}

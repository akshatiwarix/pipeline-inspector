import { notFound } from "next/navigation";
import Link from "next/link";
import { OPPORTUNITIES } from "@/data/corpus";
import { inspectOpportunity } from "@/lib/inspection/inspect";
import { ANALYSIS_DATE, STAGE_LABEL } from "@/lib/domain/pipeline";
import { ActivityTimeline } from "@/app/components/activity-timeline";
import { FlagsPanel } from "@/app/components/flags-panel";
import { HealthBadge } from "@/app/components/health-badge";

export default async function OpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const opportunity = OPPORTUNITIES.find((o) => o.id === id);

  if (!opportunity) notFound();

  const inspection = inspectOpportunity(opportunity, ANALYSIS_DATE);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/" className="text-sm underline decoration-line-strong underline-offset-4 hover:decoration-ink">
        ← Back to Pipeline Library
      </Link>

      <header className="mt-4">
        <span className="font-mono text-xs uppercase tracking-wide text-ink-dim">
          {STAGE_LABEL[opportunity.stage]} · ${opportunity.amount.toLocaleString("en-US")}
        </span>
        <h1 className="mt-1 font-display text-3xl italic text-ink sm:text-4xl">{opportunity.company}</h1>
        <p className="mt-2 flex items-center gap-2 text-ink-dim">
          Health: <HealthBadge health={inspection.health} />
        </p>
      </header>

      <section className="mt-8 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-xl italic text-ink">Activity timeline</h2>
          <div className="mt-3 max-h-[600px] overflow-y-auto rounded-lg border border-line bg-paper-raised p-4">
            <ActivityTimeline activityLog={opportunity.activityLog} />
          </div>
        </div>
        <div>
          <h2 className="font-display text-xl italic text-ink">Fired flags</h2>
          <div className="mt-3 rounded-lg border border-line bg-paper-raised p-4">
            <FlagsPanel flags={inspection.flags} />
          </div>
        </div>
      </section>

      <section className="mt-10 text-sm text-ink-dim">
        <p>Contacts: {opportunity.contacts.map((c) => `${c.name} (${c.role})`).join(", ")}</p>
        <p className="mt-1">Created: {opportunity.createdDate} · Entered {STAGE_LABEL[opportunity.stage]}: {opportunity.stageEnteredDate} · Close date: {opportunity.closeDate}</p>
      </section>
    </main>
  );
}

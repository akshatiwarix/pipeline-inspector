import type { ActivityEntry, ActivityType } from "@/lib/domain/pipeline";

const TYPE_LABEL: Record<ActivityType, string> = {
  call: "Call",
  email: "Email",
  meeting: "Meeting",
  "stage-change": "Stage change",
  "close-date-change": "Close date change",
};

export function ActivityTimeline({ activityLog }: { activityLog: ActivityEntry[] }) {
  return (
    <ol className="space-y-3">
      {activityLog.map((entry, i) => (
        <li key={i} className="text-sm">
          <span className="mr-2 font-mono text-xs uppercase tracking-wide text-ink-dim">
            {entry.date} · {TYPE_LABEL[entry.type]}
            {entry.contactName ? ` · ${entry.contactName}` : ""}
          </span>
          <span className="text-ink">{entry.note}</span>
        </li>
      ))}
    </ol>
  );
}

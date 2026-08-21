import type { Flag } from "@/lib/domain/inspection";
import { SeverityBadge } from "./severity-badge";
import { FLAG_LABEL } from "./flag-label";

export function FlagsPanel({ flags }: { flags: Flag[] }) {
  if (flags.length === 0) {
    return <p className="text-sm italic text-ink-dim">No flags fired — this opportunity is clear.</p>;
  }

  return (
    <div>
      {flags.map((flag, i) => (
        <div key={i} className="border-b border-line py-3 last:border-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-medium text-ink">{FLAG_LABEL[flag.type]}</span>
            <SeverityBadge severity={flag.severity} />
          </div>
          <p className="mt-1 text-sm text-ink-dim">{flag.detail}</p>
          {flag.evidence.length > 0 && (
            <ul className="mt-2 space-y-0.5">
              {flag.evidence.map((e) => (
                <li key={e.activityIndex} className="text-xs text-ink-dim">
                  &ldquo;{e.note}&rdquo; <span className="text-ink-dim/70">(activity #{e.activityIndex + 1})</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

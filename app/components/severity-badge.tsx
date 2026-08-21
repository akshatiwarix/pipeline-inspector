import type { FlagSeverity } from "@/lib/domain/inspection";
import { SEVERITY_COLOR, SEVERITY_DIM } from "./severity-style";

export function SeverityBadge({ severity }: { severity: FlagSeverity }) {
  return (
    <span
      className="rounded-full px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wide"
      style={{ background: SEVERITY_DIM[severity], color: SEVERITY_COLOR[severity] }}
    >
      {severity}
    </span>
  );
}

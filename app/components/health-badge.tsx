import type { HealthLevel, FlagSeverity } from "@/lib/domain/inspection";
import { SEVERITY_COLOR, SEVERITY_DIM } from "./severity-style";

const HEALTH_LABEL: Record<HealthLevel, string> = { clear: "Clear", watch: "Watch", flagged: "Flagged" };

/** Reuses the severity palette: flagged reads as the worst tone, clear as the best. */
const HEALTH_TONE: Record<HealthLevel, FlagSeverity> = { flagged: "high", watch: "medium", clear: "low" };

export function HealthBadge({ health }: { health: HealthLevel }) {
  const tone = HEALTH_TONE[health];
  return (
    <span
      className="rounded-full px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wide"
      style={{ background: SEVERITY_DIM[tone], color: SEVERITY_COLOR[tone] }}
    >
      {HEALTH_LABEL[health]}
    </span>
  );
}

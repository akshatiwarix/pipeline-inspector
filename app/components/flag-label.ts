import type { FlagType } from "@/lib/domain/inspection";

export const FLAG_LABEL: Record<FlagType, string> = {
  "no-recent-activity": "No recent activity",
  "stalled-in-stage": "Stalled in stage",
  "single-threaded": "Single-threaded",
  "close-date-slipping": "Close date slipping",
  "high-value-cooling": "High-value, cooling",
};

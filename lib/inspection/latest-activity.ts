import type { ActivityEntry } from "@/lib/domain/pipeline";

/**
 * The most recently dated entry. Ties (same date) resolve to the later index,
 * since `activityLog` is expected chronological — the later index is the one
 * actually logged last. `activityLog` is always non-empty (zod `.min(1)`).
 */
export function findLatestActivity(activityLog: ActivityEntry[]): { index: number; entry: ActivityEntry } {
  let bestIndex = 0;
  for (let i = 1; i < activityLog.length; i++) {
    const entry = activityLog[i]!;
    const best = activityLog[bestIndex]!;
    if (entry.date >= best.date) bestIndex = i;
  }
  return { index: bestIndex, entry: activityLog[bestIndex]! };
}

/**
 * Plain ISO-date ("YYYY-MM-DD") arithmetic. No timezone, no Date.now() — every
 * caller supplies its own reference date explicitly, so this stays usable from
 * both the deterministic corpus builder and the live Try It Yourself page.
 */

export function daysBetween(fromIso: string, toIso: string): number {
  const from = Date.parse(`${fromIso}T00:00:00Z`);
  const to = Date.parse(`${toIso}T00:00:00Z`);
  return Math.round((to - from) / 86_400_000);
}

export function addDays(iso: string, days: number): string {
  const base = Date.parse(`${iso}T00:00:00Z`);
  const result = new Date(base + days * 86_400_000);
  return result.toISOString().slice(0, 10);
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

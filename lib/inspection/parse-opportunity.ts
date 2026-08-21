import { OpportunitySchema, STAGES, type Stage, type ActivityType, type Opportunity, type ActivityEntry, type Contact } from "@/lib/domain/pipeline";
import { addDays } from "@/lib/dates";

const ACTIVITY_TYPES: ActivityType[] = ["call", "email", "meeting", "stage-change", "close-date-change"];

const LINE_PATTERNS = {
  company: /^Company:\s*(.+)$/i,
  amount: /^Amount:\s*\$?([\d,]+)\s*$/i,
  stage: /^Stage:\s*(.+)$/i,
  created: /^Created:\s*(\d{4}-\d{2}-\d{2})\s*$/i,
  stageEntered: /^Stage entered:\s*(\d{4}-\d{2}-\d{2})\s*$/i,
  closeDate: /^Close date:\s*(\d{4}-\d{2}-\d{2})\s*$/i,
  contact: /^Contact:\s*([^,]+),\s*(.+)$/i,
  activity: /^Activity:\s*(\d{4}-\d{2}-\d{2})\s+(call|email|meeting|stage-change|close-date-change)\s+(.+?)\s+"(.*)"\s*$/i,
} as const;

export type ParsedOpportunity = { opportunity: Opportunity; skippedLineCount: number };

/**
 * A small, lenient line-format parser for the Try It Yourself textarea.
 * Unrecognized non-blank lines are skipped and counted, never thrown. Every
 * field the visitor omits falls back to a sensible default so the result
 * always satisfies `OpportunitySchema` — this is a live sandbox, not a
 * strict importer.
 */
export function parseOpportunityText(text: string): ParsedOpportunity {
  let company: string | null = null;
  let amount: number | null = null;
  let stage: Stage | null = null;
  let createdDate: string | null = null;
  let stageEnteredDate: string | null = null;
  let closeDate: string | null = null;
  const contacts: Contact[] = [];
  const activityLog: ActivityEntry[] = [];
  let skippedLineCount = 0;

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (line.length === 0) continue;

    let matched = false;

    const activityMatch = line.match(LINE_PATTERNS.activity);
    if (activityMatch) {
      const date = activityMatch[1]!;
      const typeToken = activityMatch[2]!.toLowerCase();
      const contactToken = activityMatch[3]!.trim();
      const note = activityMatch[4]!;
      const type = ACTIVITY_TYPES.find((t) => t === typeToken) ?? "call";
      activityLog.push({ date, type, contactName: contactToken === "-" ? null : contactToken, note });
      matched = true;
    }

    if (!matched) {
      const contactMatch = line.match(LINE_PATTERNS.contact);
      if (contactMatch) {
        contacts.push({ name: contactMatch[1]!.trim(), role: contactMatch[2]!.trim() });
        matched = true;
      }
    }

    if (!matched) {
      const companyMatch = line.match(LINE_PATTERNS.company);
      if (companyMatch) {
        company = companyMatch[1]!.trim();
        matched = true;
      }
    }

    if (!matched) {
      const amountMatch = line.match(LINE_PATTERNS.amount);
      if (amountMatch) {
        const parsed = Number.parseInt(amountMatch[1]!.replace(/,/g, ""), 10);
        if (Number.isFinite(parsed) && parsed > 0) {
          amount = parsed;
          matched = true;
        }
      }
    }

    if (!matched) {
      const stageMatch = line.match(LINE_PATTERNS.stage);
      if (stageMatch) {
        const candidate = stageMatch[1]!.trim().toLowerCase();
        if ((STAGES as readonly string[]).includes(candidate)) stage = candidate as Stage;
        matched = true;
      }
    }

    if (!matched) {
      const createdMatch = line.match(LINE_PATTERNS.created);
      if (createdMatch) {
        createdDate = createdMatch[1]!;
        matched = true;
      }
    }

    if (!matched) {
      const stageEnteredMatch = line.match(LINE_PATTERNS.stageEntered);
      if (stageEnteredMatch) {
        stageEnteredDate = stageEnteredMatch[1]!;
        matched = true;
      }
    }

    if (!matched) {
      const closeDateMatch = line.match(LINE_PATTERNS.closeDate);
      if (closeDateMatch) {
        closeDate = closeDateMatch[1]!;
        matched = true;
      }
    }

    if (!matched) skippedLineCount++;
  }

  activityLog.sort((a, b) => a.date.localeCompare(b.date));

  if (activityLog.length === 0) {
    activityLog.push({
      date: createdDate ?? "2026-01-01",
      type: "stage-change",
      contactName: null,
      note: "No activity logged.",
    });
  }

  if (contacts.length === 0) {
    const namedInActivity = Array.from(
      new Set(activityLog.map((entry) => entry.contactName).filter((name): name is string => name !== null)),
    );
    for (const name of namedInActivity) contacts.push({ name, role: "Unknown" });
    if (contacts.length === 0) contacts.push({ name: "Unknown Contact", role: "Unknown" });
  }

  const resolvedCreatedDate = createdDate ?? activityLog[0]!.date;
  const resolvedStageEnteredDate = stageEnteredDate ?? resolvedCreatedDate;
  const resolvedCloseDate = closeDate ?? addDays(resolvedCreatedDate, 60);

  const opportunity = OpportunitySchema.parse({
    id: "try-it",
    company: company ?? "Unnamed Co",
    amount: amount ?? 25_000, // placeholder when no "Amount:" line is given — OpportunitySchema requires a positive value
    stage: stage ?? "discovery",
    createdDate: resolvedCreatedDate,
    stageEnteredDate: resolvedStageEnteredDate,
    closeDate: resolvedCloseDate,
    outcomeProfile: "healthy", // never read by inspection; Try It Yourself has no hidden ground truth
    contacts,
    activityLog,
  } satisfies Opportunity);

  return { opportunity, skippedLineCount };
}

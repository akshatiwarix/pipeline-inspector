import { Rng, derive } from "@/lib/rng";
import { addDays } from "@/lib/dates";
import {
  STAGES,
  OUTCOME_PROFILES,
  ANALYSIS_DATE,
  STAGE_LABEL,
  type Stage,
  type OutcomeProfile,
  type Opportunity,
  type ActivityEntry,
  type Contact,
} from "@/lib/domain/pipeline";

export const SEED = 22;
export const OPPORTUNITY_COUNT = 50;

// ---------------------------------------------------------------------------
// Word lists
// ---------------------------------------------------------------------------

const NAME_PREFIXES = [
  "Anchor", "Beacon", "Cascade", "Driftwood", "Ember", "Foundry", "Granite",
  "Hollow", "Ironwood", "Juniper", "Keystone", "Lattice", "Meridian",
  "Nightshade", "Outpost", "Pinnacle", "Quarry", "Ridgeline", "Summit",
  "Thornwood",
] as const;

const NAME_SUFFIXES = [
  "Robotics", "Cloudworks", "Systems", "Analytics", "Health", "Capital",
  "Logistics", "Networks", "Dynamics", "Labs", "Software", "Digital",
  "Industries", "Partners", "Technologies", "Data", "Foundries", "Collective",
  "Solutions", "AI",
] as const;

const CONTACT_FIRST_NAMES = [
  "Jamie", "Riley", "Devon", "Morgan", "Alexis", "Chris", "Taylor", "Jordan",
  "Casey", "Reese", "Harper", "Quinn", "Skyler", "Avery", "Rowan", "Blair",
  "Emerson", "Dakota", "Finley", "Sage",
] as const;

const CONTACT_LAST_NAMES = [
  "Ortiz", "Bennett", "Foster", "Reyes", "Chen", "Nakamura", "Silva",
  "Hughes", "Patel", "Novak", "Ibrahim", "Delgado", "Fitzgerald", "Okafor",
  "Larsen", "Winters", "Castillo", "Marsh", "Abernathy", "Kwan",
] as const;

const ROLES = [
  "VP of Sales", "Head of Marketing", "Director of Engineering",
  "VP of Engineering", "Chief Revenue Officer", "Director of Operations",
  "VP of Product", "Head of Customer Success", "Director of IT",
  "Chief Technology Officer",
] as const;

const CALL_NOTES = [
  "Discovery call covering current workflow and pain points.",
  "Follow-up call to review open questions.",
  "Check-in call on timeline and next steps.",
  "Call to align on requirements.",
] as const;

const EMAIL_NOTES = [
  "Sent product overview deck.",
  "Sent pricing overview.",
  "Sent a relevant case study.",
  "Replied with answers to technical questions.",
] as const;

const MEETING_NOTES = [
  "Kickoff meeting with the extended team.",
  "Product walkthrough meeting.",
  "Technical deep dive session.",
  "Stakeholder alignment meeting.",
] as const;

// Matches lib/inspection/stalled-in-stage.ts's STAGE_BENCHMARK_DAYS. Kept as
// a literal duplicate (documented, like the sibling repos' keyword tables)
// rather than imported, since data/ builds the corpus and lib/inspection/
// evaluates it — the two should never accidentally share mutable state.
const STAGE_BENCHMARK_DAYS: Record<Stage, number> = {
  discovery: 10,
  demo: 14,
  proposal: 21,
  negotiation: 30,
};

// Days from ANALYSIS_DATE forward to a plausible expected close date, by stage.
const CLOSE_HORIZON_DAYS: Record<Stage, number> = {
  discovery: 75,
  demo: 60,
  proposal: 40,
  negotiation: 20,
};

type StallingSubtype = "stage-bound" | "activity-gap";
type AtRiskSubtype = "single-threaded" | "slipping" | "cooling";

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function makeCompanyName(rng: Rng, used: Set<string>): string {
  for (let attempt = 0; attempt < 50; attempt++) {
    const name = `${rng.pick(NAME_PREFIXES)} ${rng.pick(NAME_SUFFIXES)}`;
    if (!used.has(name)) {
      used.add(name);
      return name;
    }
  }
  const fallback = `${rng.pick(NAME_PREFIXES)} ${rng.pick(NAME_SUFFIXES)} ${used.size}`;
  used.add(fallback);
  return fallback;
}

function makeContactName(rng: Rng, used: Set<string>): string {
  for (let attempt = 0; attempt < 50; attempt++) {
    const name = `${rng.pick(CONTACT_FIRST_NAMES)} ${rng.pick(CONTACT_LAST_NAMES)}`;
    if (!used.has(name)) {
      used.add(name);
      return name;
    }
  }
  const fallback = `${rng.pick(CONTACT_FIRST_NAMES)} ${rng.pick(CONTACT_LAST_NAMES)} ${used.size}`;
  used.add(fallback);
  return fallback;
}

function roundToThousand(n: number): number {
  return Math.round(n / 1000) * 1000;
}

// ---------------------------------------------------------------------------
// Per-opportunity generation
// ---------------------------------------------------------------------------

type Rngs = {
  company: Rng;
  contactName: Rng;
  contactRole: Rng;
  contactCount: Rng;
  outcomeProfile: Rng;
  subtype: Rng;
  stage: Rng;
  amount: Rng;
  timing: Rng;
  activity: Rng;
  note: Rng;
};

function makeRngs(): Rngs {
  return {
    company: new Rng(derive(SEED, "company-name")),
    contactName: new Rng(derive(SEED, "contact-name")),
    contactRole: new Rng(derive(SEED, "contact-role")),
    contactCount: new Rng(derive(SEED, "contact-count")),
    outcomeProfile: new Rng(derive(SEED, "outcome-profile")),
    subtype: new Rng(derive(SEED, "subtype")),
    stage: new Rng(derive(SEED, "stage")),
    amount: new Rng(derive(SEED, "amount")),
    timing: new Rng(derive(SEED, "timing")),
    activity: new Rng(derive(SEED, "activity")),
    note: new Rng(derive(SEED, "note")),
  };
}

function generateOpportunity(
  index: number,
  rngs: Rngs,
  usedCompanies: Set<string>,
  usedContacts: Set<string>,
): Opportunity {
  const id = `opp-${String(index + 1).padStart(3, "0")}`;
  const company = makeCompanyName(rngs.company, usedCompanies);

  const outcomeProfile = OUTCOME_PROFILES[rngs.outcomeProfile.weightedIndex([40, 30, 30])] as OutcomeProfile;

  const stallingSubtype: StallingSubtype | null =
    outcomeProfile === "stalling"
      ? (["stage-bound", "activity-gap"] as const)[rngs.subtype.weightedIndex([50, 50])]!
      : null;
  const atRiskSubtype: AtRiskSubtype | null =
    outcomeProfile === "at-risk"
      ? (["single-threaded", "slipping", "cooling"] as const)[rngs.subtype.weightedIndex([34, 33, 33])]!
      : null;

  // ---- Stage ----
  let stage = STAGES[rngs.stage.weightedIndex([35, 30, 20, 15])] as Stage;
  if (atRiskSubtype === "cooling") {
    // The rule only fires in proposal/negotiation — force it there.
    stage = rngs.stage.pick(["proposal", "negotiation"] as const);
  }
  const benchmark = STAGE_BENCHMARK_DAYS[stage];

  // ---- Amount ----
  const AMOUNT_BUCKETS: [number, number][] = [
    [15_000, 50_000],
    [50_000, 100_000],
    [100_000, 180_000],
    [180_000, 250_000],
  ];
  let bucketIndex = rngs.amount.weightedIndex([35, 30, 20, 15]);
  if (atRiskSubtype === "cooling") {
    // Force "high value" ($100k+) — pick between the two upper buckets.
    bucketIndex = 2 + rngs.amount.int(2);
  }
  const [bucketMin, bucketMax] = AMOUNT_BUCKETS[bucketIndex] as [number, number];
  const amount = roundToThousand(rngs.amount.intBetween(bucketMin, bucketMax));

  // ---- Contacts ----
  let contactCount = [1, 2, 2, 3][rngs.contactCount.weightedIndex([15, 45, 30, 10])] ?? 2;
  if (outcomeProfile === "healthy") contactCount = rngs.contactCount.bool(0.4) ? 3 : 2;
  if (atRiskSubtype === "single-threaded") contactCount = 1;

  const contacts: Contact[] = [];
  for (let c = 0; c < contactCount; c++) {
    contacts.push({
      name: makeContactName(rngs.contactName, usedContacts),
      role: rngs.contactRole.pick(ROLES),
    });
  }

  // ---- Timing: days-ago values, oldest to newest ----
  // Invariant maintained throughout: lastActivityAgo <= stageEnteredAgo <= createdAgo.
  let stageEnteredAgo: number;
  let lastActivityAgo: number;

  if (stallingSubtype === "stage-bound") {
    stageEnteredAgo = rngs.timing.intBetween(Math.ceil(benchmark * 1.2), benchmark * 3);
    lastActivityAgo = rngs.timing.intBetween(0, 10);
  } else if (stallingSubtype === "activity-gap") {
    lastActivityAgo = rngs.timing.intBetween(15, 45);
    stageEnteredAgo = lastActivityAgo + rngs.timing.intBetween(0, 10);
  } else if (atRiskSubtype === "cooling") {
    lastActivityAgo = rngs.timing.intBetween(7, 20);
    stageEnteredAgo = lastActivityAgo + rngs.timing.intBetween(1, 8);
  } else {
    // healthy, and the remaining at-risk subtypes (single-threaded, slipping):
    // normal, comfortably-under-benchmark stage timing.
    stageEnteredAgo = rngs.timing.intBetween(1, Math.max(1, benchmark - 2));
    lastActivityAgo = rngs.timing.intBetween(0, Math.min(10, stageEnteredAgo));
  }

  const extraDaysBeforeCurrentStage = stage === "discovery" ? 0 : rngs.timing.intBetween(5, 40);
  const createdAgo = stageEnteredAgo + extraDaysBeforeCurrentStage;

  const createdDate = addDays(ANALYSIS_DATE, -createdAgo);
  const stageEnteredDate = addDays(ANALYSIS_DATE, -stageEnteredAgo);
  const lastActivityDate = addDays(ANALYSIS_DATE, -lastActivityAgo);

  // ---- Close date + pushes ----
  const closeDate = addDays(ANALYSIS_DATE, CLOSE_HORIZON_DAYS[stage] + rngs.timing.intBetween(-10, 10));
  const pushCount = atRiskSubtype === "slipping" ? rngs.timing.intBetween(2, 3) : rngs.timing.bool(0.15) ? 1 : 0;

  // ---- Activity log ----
  const activity: ActivityEntry[] = [];
  const pushEvent = (daysAgo: number, entry: ActivityEntry) => {
    activity.push({ ...entry, date: addDays(ANALYSIS_DATE, -daysAgo) });
  };

  // 1. Creation / entered Discovery.
  pushEvent(createdAgo, {
    date: "",
    type: "stage-change",
    contactName: null,
    note: `Opportunity created; entered ${STAGE_LABEL.discovery}.`,
  });

  // 2. Intermediate stage-change transitions up to the current stage, evenly
  //    spaced between creation and the current stage's entry.
  const stageOrder = STAGES;
  const currentStageIndex = stageOrder.indexOf(stage);
  if (currentStageIndex > 0) {
    const span = createdAgo - stageEnteredAgo;
    for (let s = 1; s <= currentStageIndex; s++) {
      const fraction = s / (currentStageIndex + 1);
      const daysAgo = Math.round(createdAgo - span * fraction);
      pushEvent(Math.max(daysAgo, stageEnteredAgo), {
        date: "",
        type: "stage-change",
        contactName: null,
        note: `Entered ${STAGE_LABEL[stageOrder[s] as Stage]}.`,
      });
    }
  }

  // 3. Contact introductions, spread across [stageEnteredAgo+1, createdAgo].
  const introSpan = Math.max(createdAgo - stageEnteredAgo, 1);
  contacts.forEach((contact, i) => {
    const daysAgo = Math.max(
      stageEnteredAgo,
      createdAgo - Math.round((introSpan * (i + 1)) / (contacts.length + 1)),
    );
    const introType = rngs.activity.bool(0.5) ? "meeting" : "call";
    pushEvent(daysAgo, {
      date: "",
      type: introType,
      contactName: contact.name,
      note: `Introductory ${introType} with ${contact.name}, ${contact.role}.`,
    });
  });

  // 4. A handful of regular activity entries between stage entry and the last
  //    activity, so single-threaded opportunities have real evidence and the
  //    timeline reads as a genuine history rather than three bare events.
  const fillCount = rngs.activity.intBetween(2, 5);
  for (let f = 0; f < fillCount; f++) {
    const daysAgo = rngs.activity.intBetween(lastActivityAgo, stageEnteredAgo);
    const contact = rngs.activity.pick(contacts);
    const type = (["call", "email", "meeting"] as const)[rngs.activity.int(3)] as "call" | "email" | "meeting";
    const note = type === "call" ? rngs.note.pick(CALL_NOTES) : type === "email" ? rngs.note.pick(EMAIL_NOTES) : rngs.note.pick(MEETING_NOTES);
    pushEvent(daysAgo, { date: "", type, contactName: contact.name, note });
  }

  // 5. The most recent activity, pinned exactly at lastActivityAgo.
  {
    const contact = rngs.activity.pick(contacts);
    const type = (["call", "email", "meeting"] as const)[rngs.activity.int(3)] as "call" | "email" | "meeting";
    const note = type === "call" ? rngs.note.pick(CALL_NOTES) : type === "email" ? rngs.note.pick(EMAIL_NOTES) : rngs.note.pick(MEETING_NOTES);
    pushEvent(lastActivityAgo, { date: "", type, contactName: contact.name, note });
  }

  // 6. Close-date-change pushes, if any.
  for (let p = 0; p < pushCount; p++) {
    const daysAgo = rngs.timing.intBetween(lastActivityAgo, stageEnteredAgo);
    pushEvent(daysAgo, {
      date: "",
      type: "close-date-change",
      contactName: null,
      note: `Close date pushed back (push ${p + 1} of ${pushCount}).`,
    });
  }

  activity.sort((a, b) => a.date.localeCompare(b.date));

  const opportunity: Opportunity = {
    id,
    company,
    amount,
    stage,
    createdDate,
    stageEnteredDate,
    closeDate,
    outcomeProfile,
    contacts,
    activityLog: activity,
  };

  // Sanity: lastActivityDate must actually be the latest log entry, since the
  // rules read "most recent activity" straight off the log.
  const latestLogged = activity[activity.length - 1]!.date;
  if (latestLogged !== lastActivityDate) {
    throw new Error(`${id}: expected latest activity ${lastActivityDate}, log ends at ${latestLogged}`);
  }

  return opportunity;
}

export function generateCorpus(): { opportunities: Opportunity[] } {
  const rngs = makeRngs();
  const usedCompanies = new Set<string>();
  const usedContacts = new Set<string>();
  const opportunities: Opportunity[] = [];
  for (let i = 0; i < OPPORTUNITY_COUNT; i++) {
    opportunities.push(generateOpportunity(i, rngs, usedCompanies, usedContacts));
  }
  return { opportunities };
}

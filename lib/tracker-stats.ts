import type { StatusEntry, TrackerStatus } from "@/lib/types/applications";

const DAY = 24 * 60 * 60 * 1000;
const SENT: TrackerStatus[] = ["applied", "screening", "interview", "offer", "rejected", "ghosted"];
// A rejection is still a reply; ghosted and dropped are not.
const REPLIED: TrackerStatus[] = ["screening", "interview", "offer", "rejected"];
const INTERVIEWED: TrackerStatus[] = ["interview", "offer"];
export const TIMED_STAGES: TrackerStatus[] = ["saved", "applied", "screening", "interview"];

type Card = { status: TrackerStatus; statusHistory: StatusEntry[]; appliedOn: string };

const reached = (card: Card, set: TrackerStatus[]) =>
  set.includes(card.status) || card.statusHistory.some((entry) => set.includes(entry.status));

/** The board's funnel: how many applications got a reply or an interview, and how long each stage lasts. */
export function trackerStats(cards: Card[]) {
  const sent = cards.filter((card) => reached(card, SENT));
  const rate = (set: TrackerStatus[]) =>
    sent.length ? Math.round((sent.filter((card) => reached(card, set)).length / sent.length) * 100) : null;

  // Only finished stays count, so a card still sitting in a column does not drag the average.
  const stays = new Map<TrackerStatus, number[]>();
  for (const card of cards) {
    card.statusHistory.forEach((entry, i) => {
      const next = card.statusHistory[i + 1];
      if (next) stays.set(entry.status, [...(stays.get(entry.status) ?? []), (next.at - entry.at) / DAY]);
    });
  }
  const avgDays = Object.fromEntries(
    TIMED_STAGES.map((stage) => {
      const days = stays.get(stage) ?? [];
      return [stage, days.length ? Math.round((days.reduce((a, b) => a + b, 0) / days.length) * 10) / 10 : null];
    }),
  ) as Record<TrackerStatus, number | null>;

  return { sent: sent.length, responseRate: rate(REPLIED), interviewRate: rate(INTERVIEWED), avgDays };
}

/** Whole days an Applied card has waited for a reply: from the application date if typed, else from entering the column. */
export function daysWaiting(card: Card, now = Date.now()): number | null {
  if (card.status !== "applied") return null;
  const typed = card.appliedOn ? new Date(`${card.appliedOn}T00:00:00`).getTime() : NaN;
  const entered = card.statusHistory.findLast((entry) => entry.status === "applied")?.at;
  const since = Number.isNaN(typed) ? entered : typed;
  return since === undefined ? null : Math.max(0, Math.floor((now - since) / DAY));
}

export const FOLLOW_UP_AFTER_DAYS = 7;
export const GHOSTED_AFTER_DAYS = 30;

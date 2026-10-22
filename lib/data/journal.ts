/**
 * This app's data-access functions. Components call these, never Dexie directly.
 *
 * Everything reads through `database.ready()`, which opens the browser's database (or the
 * in-memory stand-in) once however many callers ask. Writes are awaited by their callers, which
 * show a toast when one fails — nothing here swallows an error.
 */
import { database, newId, type CustomQuestion, type JournalEntry } from "@/lib/db";
import { addDays, dateFromDayNumber, dayNumber, weekStart } from "./dates";

const entries = async () => (await database.ready()).entries;
const customQuestions = async () => (await database.ready()).customQuestions;

/** Every entry, newest calendar day first. */
export async function listEntries(): Promise<JournalEntry[]> {
  const rows = await (await entries()).toArray();
  return rows.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

/** Write (or overwrite — the primary key is the date) one day's entry. */
export async function saveEntry(entry: JournalEntry): Promise<void> {
  await (await entries()).put(entry);
}

export async function deleteEntry(date: string): Promise<void> {
  await (await entries()).delete(date);
}

/** Custom questions in the order they were added. */
export async function listCustomQuestions(): Promise<CustomQuestion[]> {
  const rows = await (await customQuestions()).toArray();
  return rows.sort((a, b) => a.createdAt - b.createdAt);
}

export async function addCustomQuestion(text: string): Promise<CustomQuestion> {
  const question: CustomQuestion = { id: newId(), text, createdAt: Date.now() };
  await (await customQuestions()).add(question);
  return question;
}

export async function removeCustomQuestion(id: string): Promise<void> {
  await (await customQuestions()).delete(id);
}

/** One live read of everything the home page needs; Dexie re-runs it when either table changes. */
export async function loadJournalData(): Promise<{ entries: JournalEntry[]; customQuestions: CustomQuestion[] }> {
  const [entryRows, customRows] = await Promise.all([listEntries(), listCustomQuestions()]);
  return { entries: entryRows, customQuestions: customRows };
}

// ---- Statistics, all pure so the components can compute them from the live list ----

/** Total days with an answer on file. */
export function countJournaled(all: readonly JournalEntry[]): number {
  return all.length;
}

/**
 * The current streak in consecutive answered days, counted back from today — or, when today has no
 * answer yet, from yesterday, so a streak survives the hours before tonight's entry is written.
 */
export function currentStreak(all: readonly JournalEntry[], today: string): number {
  const answered = new Set(all.map((entry) => entry.date));
  let day = dayNumber(today);
  if (!answered.has(dateFromDayNumber(day))) {
    day -= 1;
    if (!answered.has(dateFromDayNumber(day))) return 0;
  }
  let streak = 0;
  while (answered.has(dateFromDayNumber(day))) {
    streak += 1;
    day -= 1;
  }
  return streak;
}

export type WeekBucket = {
  /** The Monday that starts the week. */
  start: string;
  /** Answers filed on a day in this week. */
  count: number;
};

/** Answers per week over the past `weeks` weeks, oldest week first, ending with the current one. */
export function answersPerWeek(all: readonly JournalEntry[], today: string, weeks: number): WeekBucket[] {
  const counts = new Map<string, number>();
  for (const entry of all) {
    const start = weekStart(entry.date);
    counts.set(start, (counts.get(start) ?? 0) + 1);
  }
  const currentStart = dayNumber(weekStart(today));
  return Array.from({ length: weeks }, (_, i) => {
    const start = dateFromDayNumber(currentStart - (weeks - 1 - i) * 7);
    return { start, count: counts.get(start) ?? 0 };
  });
}

/** The entries filed within the seven days ending `today`, oldest first — the week the summary reads. */
export function weekEntries(all: readonly JournalEntry[], today: string): JournalEntry[] {
  const from = addDays(today, -6);
  return all
    .filter((entry) => entry.date >= from && entry.date <= today)
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

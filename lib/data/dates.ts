/**
 * Calendar-date helpers, all working on local calendar dates ("2026-02-21") as plain strings.
 *
 * Days are counted as whole calendar days — never by dividing milliseconds, which skips or repeats
 * a day across daylight-saving changes. A date string is turned into a day number through
 * `Date.UTC` on its own year/month/day, which is an exact count of days since the epoch with no
 * time-of-day in it, and back again through the UTC parts of that same instant.
 *
 * Display formatting fixes the locale ("en-GB") so the server, the browser and any copy agree on
 * the words; none of this runs during server rendering anyway (see the hydration note in the
 * components that call it).
 */

const MS_PER_DAY = 86_400_000;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, (month ?? 1) - 1, day ?? 1);
  return date.getFullYear() === year && date.getMonth() === (month ?? 1) - 1 && date.getDate() === day;
}

/** Today, in the visitor's own calendar. Call it after hydration or in an event handler. */
export function todayISO(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Whole days since 1970-01-01 for a local calendar date. */
export function dayNumber(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  return Math.round(Date.UTC(year, (month ?? 1) - 1, day ?? 1) / MS_PER_DAY);
}

/** The inverse of `dayNumber`. */
export function dateFromDayNumber(number: number): string {
  return new Date(number * MS_PER_DAY).toISOString().slice(0, 10);
}

/** `n` days after `date` (negative for before). */
export function addDays(date: string, n: number): string {
  return dateFromDayNumber(dayNumber(date) + n);
}

/** The last `n` calendar dates ending today, oldest first. */
export function lastDays(n: number, today: string): string[] {
  const start = dayNumber(today) - (n - 1);
  return Array.from({ length: n }, (_, i) => dateFromDayNumber(start + i));
}

const DAY_FORMAT = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" });
const DAY_WITH_YEAR = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const SHORT_FORMAT = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });
const WEEKDAY_NARROW = new Intl.DateTimeFormat("en-GB", { weekday: "narrow" });

/** "Saturday 21 February" — with the year when it is not this year. */
export function formatDate(date: string, thisYear: number): string {
  if (!isValidDate(date)) return date;
  const [year, month, day] = date.split("-").map(Number);
  const parsed = new Date(year, (month ?? 1) - 1, day ?? 1);
  return year === thisYear ? DAY_FORMAT.format(parsed) : DAY_WITH_YEAR.format(parsed);
}

/** "21 Feb" — for chart and strip labels. */
export function formatShort(date: string): string {
  if (!isValidDate(date)) return date;
  const [year, month, day] = date.split("-").map(Number);
  return SHORT_FORMAT.format(new Date(year, (month ?? 1) - 1, day ?? 1));
}

/** "S", "M", "T" — the letter above a day in the strip. */
export function weekdayInitial(date: string): string {
  if (!isValidDate(date)) return "";
  const [year, month, day] = date.split("-").map(Number);
  return WEEKDAY_NARROW.format(new Date(year, (month ?? 1) - 1, day ?? 1));
}

/** The Monday on or before `date`, as a date string. Weeks in this app start on Monday. */
export function weekStart(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const weekday = new Date(year, (month ?? 1) - 1, day ?? 1).getDay(); // 0 Sunday … 6 Saturday
  const back = weekday === 0 ? 6 : weekday - 1;
  return addDays(date, -back);
}

/**
 * This application's database.
 *
 * The reusable half of the setup is in `lib/storage/` and is not edited. This file is the half
 * that describes the product: which tables exist, what is indexed, how the schema has changed over
 * time, and what a first visit starts with.
 *
 * Two tables:
 *
 * - `entries` — one journal entry per calendar date, keyed by that date ("2026-02-21"). Each entry
 *   stores the exact question text it answered alongside the answer, so an entry stays truthful
 *   even after the rotation moves on or a custom question is removed.
 * - `customQuestions` — questions the visitor added, which join the rotation pool.
 *
 * There is no seed on purpose: an evening journal starts empty, and the empty state is real —
 * "0 days journaled", "0 day streak" — not something to fill with example content.
 */
import { defineDatabase } from "@/lib/storage/database";

/** A saved answer for one calendar day. `date` ("YYYY-MM-DD") is the primary key. */
export type JournalEntry = {
  date: string;
  /** The exact question this entry answered, stored with the answer. */
  question: string;
  answer: string;
  /** Epoch millis, for "answered at" displays and share-card cache keys. */
  updatedAt: number;
};

/** A question the visitor added to the rotation. */
export type CustomQuestion = {
  id: string;
  text: string;
  /** Epoch millis, so the pool lists them in the order they were added. */
  createdAt: number;
};

/** Ids are generated here so the data layer never depends on an auto-increment round trip. */
export function newId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export const database = defineDatabase<{
  entries: JournalEntry;
  customQuestions: CustomQuestion;
}>({
  // Part of the origin's storage identity. Renaming it does not migrate anything — it points the
  // application at a different, empty database and abandons the old one in place. That is exactly
  // what you want on a first build, and never what you want afterwards.
  name: "evening-journal",
  versions: [
    // Only the primary key and the properties queried on. `question` and `answer` are stored but
    // never filtered or sorted by in the database — search happens over the loaded list.
    { version: 1, stores: { entries: "date", customQuestions: "id" } },
  ],
});

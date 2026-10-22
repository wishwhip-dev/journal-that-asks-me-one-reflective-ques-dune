"use client";

import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AI_PRIVACY_NOTE, useAsk } from "@/lib/ai";
import type { JournalEntry } from "@/lib/db";
import { currentStreak, weekEntries, answersPerWeek } from "@/lib/data/journal";
import { questionForDate } from "@/lib/data/questions";
import { formatDate, formatShort, lastDays, weekdayInitial } from "@/lib/data/dates";
import { WeekChart } from "@/components/journal/week-chart";
import { AnswerForm } from "@/components/journal/answer-form";
import { EntryShare } from "@/components/journal/entry-share";
import { cn } from "@/lib/utils";

/**
 * Journal: everything on file. The last seven days as tappable days, the totals and the weekly
 * chart, the assistant's weekly summary (an extra — the app works fully without it), and every
 * answered day newest first, searchable, each editable, deletable and shareable.
 */
export function JournalTab({
  today,
  entries,
  customTexts,
  onSave,
  onDelete,
}: {
  today: string;
  entries: JournalEntry[];
  customTexts: readonly string[];
  onSave: (date: string, question: string, answer: string) => Promise<void>;
  onDelete: (entry: JournalEntry) => Promise<void>;
}) {
  const thisYear = Number(today.slice(0, 4));
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const formCardRef = useRef<HTMLDivElement | null>(null);

  const activeEntry = activeDate ? entries.find((entry) => entry.date === activeDate) : undefined;

  const openDay = (date: string) => {
    setActiveDate(date);
    // From the tap, not from an effect: bring the form that just opened into view.
    requestAnimationFrame(() => formCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const query = search.trim().toLowerCase();
  const visible = query
    ? entries.filter((entry) => entry.question.toLowerCase().includes(query) || entry.answer.toLowerCase().includes(query))
    : entries;

  return (
    <div className="space-y-4">
      {activeDate ? (
        <Card ref={formCardRef}>
          <CardHeader>
            <CardDescription>Answering {formatDate(activeDate, thisYear)}</CardDescription>
            <CardTitle className="text-lg leading-snug">
              {activeEntry?.question ?? questionForDate(activeDate, customTexts).text}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AnswerForm
              key={activeDate}
              date={activeDate}
              initialAnswer={activeEntry?.answer ?? ""}
              autoFocus
              submitLabel={activeEntry ? "Save changes" : "Save"}
              onSave={async (answer) => {
                await onSave(activeDate, activeEntry?.question ?? questionForDate(activeDate, customTexts).text, answer);
                setActiveDate(null);
              }}
              onCancel={() => setActiveDate(null)}
            />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Last 7 days</CardTitle>
          <CardDescription>Tap an open day to answer it; answered days open for editing.</CardDescription>
        </CardHeader>
        <CardContent>
          <SevenDayStrip today={today} entries={entries} onOpen={openDay} />
        </CardContent>
      </Card>

      <StatsCard today={today} entries={entries} />

      <WeeklySummary today={today} entries={entries} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All entries</CardTitle>
          <div className="space-y-2 pt-1">
            <Label htmlFor="journal-search">Search entries</Label>
            <Input
              id="journal-search"
              type="search"
              placeholder="A word from a question or an answer…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {visible.length ? (
            <ul className="divide-y divide-border">
              {visible.map((entry) => (
                <EntryRow
                  key={entry.date}
                  entry={entry}
                  thisYear={thisYear}
                  onEdit={() => openDay(entry.date)}
                  onDelete={onDelete}
                />
              ))}
            </ul>
          ) : query ? (
            <div className="space-y-2 py-6 text-center">
              <p className="text-sm font-medium">Nothing matches “{search.trim()}”.</p>
              <p className="text-xs text-muted-foreground">Try another word, or clear the search to see every entry.</p>
              <Button type="button" variant="outline" size="sm" onClick={() => setSearch("")}>
                Clear search
              </Button>
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No entries yet. Tonight's question is waiting on the Tonight tab.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SevenDayStrip({
  today,
  entries,
  onOpen,
}: {
  today: string;
  entries: JournalEntry[];
  onOpen: (date: string) => void;
}) {
  const days = useMemo(() => lastDays(7, today), [today]);
  const answered = useMemo(() => new Set(entries.map((entry) => entry.date)), [entries]);
  return (
    <div className="grid grid-cols-7 gap-1.5" role="list" aria-label="The last seven days">
      {days.map((date) => {
        const isAnswered = answered.has(date);
        const dayOfMonth = Number(date.slice(8, 10));
        return (
          <button
            key={date}
            type="button"
            role="listitem"
            onClick={() => onOpen(date)}
            aria-label={`${formatDate(date, Number(today.slice(0, 4)))}${isAnswered ? " — answered" : " — no answer yet"}`}
            aria-current={date === today ? "date" : undefined}
            className={cn(
              "flex min-h-12 min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg border px-0.5 py-1 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isAnswered
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              date === today && !isAnswered && "border-dashed",
            )}
          >
            <span className="text-[10px] uppercase tracking-wide opacity-80">{weekdayInitial(date)}</span>
            <span className="text-sm font-semibold leading-none">{dayOfMonth}</span>
          </button>
        );
      })}
    </div>
  );
}

function StatsCard({ today, entries }: { today: string; entries: JournalEntry[] }) {
  const thisYear = Number(today.slice(0, 4));
  const total = countJournaledSafe(entries);
  const streak = currentStreak(entries, today);
  const weeks = useMemo(() => answersPerWeek(entries, today, 12), [entries, today]);
  const chartData = weeks.map((bucket) => ({ label: formatShort(bucket.start), answers: bucket.count }));
  const answeredThisWeek = weeks[weeks.length - 1]?.count ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Your journal so far</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border bg-card p-3">
            <p className="text-3xl font-semibold tabular-nums">{total}</p>
            <p className="text-xs text-muted-foreground">{total === 1 ? "day journaled" : "days journaled"}</p>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <p className="text-3xl font-semibold tabular-nums">{streak}</p>
            <p className="text-xs text-muted-foreground">{streak === 1 ? "day streak" : "day streak"}</p>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Answers per week
            <span className="font-normal text-muted-foreground"> · past 12 weeks, {answeredThisWeek} {answeredThisWeek === 1 ? "entry" : "entries"} this week</span>
          </p>
          <WeekChart data={chartData} />
        </div>
      </CardContent>
    </Card>
  );
}

function countJournaledSafe(entries: JournalEntry[]): number {
  return entries.length;
}

function EntryRow({
  entry,
  thisYear,
  onEdit,
  onDelete,
}: {
  entry: JournalEntry;
  thisYear: number;
  onEdit: () => void;
  onDelete: (entry: JournalEntry) => Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);

  return (
    <li className="space-y-2 py-4 first:pt-2 last:pb-2">
      <h4 className="text-sm font-semibold">{formatDate(entry.date, thisYear)}</h4>
      <p className="text-sm italic text-muted-foreground">“{entry.question}”</p>
      <p className="whitespace-pre-wrap text-sm leading-relaxed">{entry.answer}</p>
      {confirming ? (
        <div className="space-y-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3">
          <p className="text-sm font-medium">Delete this answer for {formatDate(entry.date, thisYear)}? This cannot be undone.</p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => {
                setConfirming(false);
                void onDelete(entry);
              }}
            >
              Delete
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-1 pt-1">
          <Button type="button" variant="outline" size="sm" onClick={onEdit}>
            Edit
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setConfirming(true)}
          >
            Delete
          </Button>
          <EntryShare entry={entry} label="Share" />
        </div>
      )}
    </li>
  );
}

function WeeklySummary({ today, entries }: { today: string; entries: JournalEntry[] }) {
  const { ask, status, text, statusText, busy } = useAsk();
  const week = useMemo(() => weekEntries(entries, today), [entries, today]);

  const run = async () => {
    const lines = week.map((entry) => {
      const answer = entry.answer.length > 500 ? `${entry.answer.slice(0, 500)}…` : entry.answer;
      return `${entry.date} — "${entry.question}" — ${answer}`;
    });
    await ask(["These are my journal entries from the past seven days:", ...lines, "Write my weekly summary from them."].join("\n"), {
      instructions: "weeklySummary",
      maxTokens: 400,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Weekly summary</CardTitle>
        <CardDescription>A gentle look back at the past week's answers, written by the assistant.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button type="button" disabled={busy || week.length === 0} onClick={() => void run()}>
          {busy ? "Thinking…" : "Weekly summary"}
        </Button>
        {week.length === 0 ? (
          <p className="text-sm text-muted-foreground">No answers this week yet — write a few evenings first.</p>
        ) : (
          <p className="text-xs text-muted-foreground">{AI_PRIVACY_NOTE}</p>
        )}
        {statusText ? (
          <p role="status" className="text-sm text-muted-foreground">
            {statusText}
          </p>
        ) : null}
        {status === "done" && text ? <p className="whitespace-pre-wrap text-sm leading-relaxed">{text}</p> : null}
      </CardContent>
    </Card>
  );
}

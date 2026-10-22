"use client";

import { useState } from "react";
import { MoonStar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AnswerForm } from "@/components/journal/answer-form";
import { EntryShare } from "@/components/journal/entry-share";
import type { JournalEntry } from "@/lib/db";
import type { PoolQuestion } from "@/lib/data/questions";
import { formatDate } from "@/lib/data/dates";

/**
 * Tonight: today's date, tonight's question as the page's heading, and the answer form right
 * there — no sign-in, no navigation. Once the day has an answer, the form gives way to the saved
 * answer with an Edit button (and Share), and editing reopens the form with the saved text.
 */
export function Tonight({
  today,
  question,
  entry,
  onSave,
}: {
  today: string;
  question: PoolQuestion;
  entry: JournalEntry | undefined;
  onSave: (answer: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);

  const answering = !entry || editing;

  return (
    <div className="space-y-5">
      <header className="space-y-3">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          <MoonStar className="size-4" aria-hidden="true" />
          Tonight · {formatDate(today, Number(today.slice(0, 4)))}
        </p>
        <h1 className="text-balance text-2xl font-semibold leading-snug tracking-tight sm:text-3xl">
          {question.text}
        </h1>
        <p className="text-xs text-muted-foreground">
          {question.custom ? "One of your own questions" : question.theme}
        </p>
      </header>

      {answering ? (
        <Card>
          <CardContent className="pt-6">
            <AnswerForm
              key={today}
              date={today}
              initialAnswer={entry?.answer ?? ""}
              autoFocus={Boolean(entry)}
              onSave={async (answer) => {
                await onSave(answer);
                setEditing(false);
              }}
              onCancel={entry ? () => setEditing(false) : undefined}
              submitLabel={entry ? "Save changes" : "Save"}
            />
          </CardContent>
        </Card>
      ) : entry ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Your answer</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-base leading-relaxed">{entry.answer}</p>
          </CardContent>
          <CardFooter className="flex-wrap items-center gap-2">
            <Button type="button" variant="outline" onClick={() => setEditing(true)}>
              Edit
            </Button>
            <EntryShare entry={entry} label="Share" />
          </CardFooter>
        </Card>
      ) : null}

      {!answering && entry ? (
        <p className="text-xs text-muted-foreground">Saved in this browser — it will still be here tomorrow.</p>
      ) : null}
    </div>
  );
}

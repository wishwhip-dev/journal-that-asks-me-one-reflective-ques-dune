"use client";

import { useState } from "react";
import { toast } from "sonner";
import { NotebookPen, HelpCircle, MoonStar } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLive, useWrite } from "@/lib/storage/react";
import { db } from "@/lib/db";
import { loadAllEntries, loadCustomQuestions, putEntry, deleteEntry, addCustomQuestion, removeCustomQuestion } from "@/lib/data/journal";
import { today as dayKeyToday } from "@/lib/data/dates";
import { questionForDate } from "@/lib/data/questions";
import { useIsHydrated } from "@/lib/storage/react";
import { Tonight } from "@/components/journal/tonight";
import { JournalTab } from "@/components/journal/journal-tab";
import { QuestionsTab } from "@/components/journal/questions-tab";

/**
 * The whole app: three tabs over one live Dexie query. Everything the tabs need is loaded here and
 * passed down; every write goes through lib/data/journal.ts and reports to the visitor with a toast
 * when it fails, never silently.
 */
export function JournalApp() {
  const ready = useIsHydrated();
  const today = dayKeyToday(); // called after the hydration gate — see Tonight/Journal guards

  const entriesQuery = useLive(() => loadAllEntries(), []);
  const customQuery = useLive(() => loadCustomQuestions(), []);
  const entries = entriesQuery ?? [];
  const customQuestions = customQuery ?? [];

  const [saving, setSaving] = useState(false);

  const write = useWrite();

  const guard = (work: () => Promise<void>) =>
    write(async () => {
      setSaving(true);
      try {
        await work();
      } finally {
        setSaving(false);
      }
    });

  const saveAnswer = async (date: string, question: string, answer: string) => {
    await guard(async () => {
      try {
        await putEntry(db, { date, question, answer });
      } catch (error) {
        console.error("Failed to save the entry", error);
        toast.error("The entry could not be saved", {
          description: "Your answer is still in the box — try again in a moment.",
        });
        throw error;
      }
      toast.success(date === today ? "Saved. Sleep well." : `Saved for ${date}.`);
    });
  };

  const removeEntry = async (entry: { date: string }) => {
    await guard(async () => {
      try {
        await deleteEntry(db, entry.date);
      } catch (error) {
        console.error("Failed to delete the entry", error);
        toast.error("The entry could not be deleted", { description: "It is still there — try again in a moment." });
        throw error;
      }
      toast.success("Entry deleted.");
    });
  };

  const addQuestion = async (text: string) => {
    await guard(async () => {
      try {
        await addCustomQuestion(db, text);
      } catch (error) {
        console.error("Failed to add the question", error);
        toast.error("The question could not be added", { description: "Try again in a moment." });
        throw error;
      }
      toast.success("Added to the rotation — it can be drawn from tomorrow.");
    });
  };

  const removeQuestion = async (id: number) => {
    await guard(async () => {
      try {
        await removeCustomQuestion(db, id);
      } catch (error) {
        console.error("Failed to remove the question", error);
        toast.error("The question could not be removed", { description: "It is still there — try again in a moment." });
        throw error;
      }
      toast.success("Question removed from the rotation.");
    });
  };

  if (!ready) {
    return (
      <div className="space-y-4" aria-hidden="true">
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="h-9 w-full max-w-md animate-pulse rounded bg-muted" />
        <div className="h-40 w-full animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  const tonightQuestion = questionForDate(today, customQuestions.map((question) => question.text));
  const tonightEntry = entries.find((entry) => entry.date === today);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="tonight">
        <TabsList className="w-full">
          <TabsTrigger value="tonight" className="flex-1 gap-1.5">
            <MoonStar className="size-4" aria-hidden="true" />
            Tonight
          </TabsTrigger>
          <TabsTrigger value="journal" className="flex-1 gap-1.5">
            <NotebookPen className="size-4" aria-hidden="true" />
            Journal
          </TabsTrigger>
          <TabsTrigger value="questions" className="flex-1 gap-1.5">
            <HelpCircle className="size-4" aria-hidden="true" />
            Questions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tonight">
          <Tonight
            today={today}
            question={tonightQuestion}
            entry={tonightEntry}
            onSave={async (answer) => {
              await saveAnswer(today, tonightQuestion.text, answer);
            }}
          />
        </TabsContent>

        <TabsContent value="journal">
          <JournalTab
            today={today}
            entries={entries}
            customTexts={customQuestions.map((question) => question.text)}
            onSave={saveAnswer}
            onDelete={removeEntry}
          />
        </TabsContent>

        <TabsContent value="questions">
          <QuestionsTab customQuestions={customQuestions} onAdd={addQuestion} onRemove={removeQuestion} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

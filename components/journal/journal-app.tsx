"use client";

import { MoonStar, NotebookPen, HelpCircle, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { database } from "@/lib/db";
import { useIsHydrated, useStoredQuery, useStorageStatus } from "@/lib/storage/react";
import { loadAllEntries, loadCustomQuestions, putEntry, deleteEntry, addCustomQuestion, removeCustomQuestion } from "@/lib/data/journal";
import { today as dayKeyToday } from "@/lib/data/dates";
import { questionForDate } from "@/lib/data/questions";
import { Tonight } from "@/components/journal/tonight";
import { JournalTab } from "@/components/journal/journal-tab";
import { QuestionsTab } from "@/components/journal/questions-tab";

/**
 * The whole app: three tabs over two live queries. Everything the tabs need is loaded here and
 * passed down; every write goes through lib/data/journal.ts and tells the visitor when it failed —
 * never silently.
 */
export function JournalApp() {
  const ready = useIsHydrated();
  const entriesState = useStoredQuery(database, () => loadAllEntries(), []);
  const customState = useStoredQuery(database, () => loadCustomQuestions(), []);
  const status = useStorageStatus(database);

  if (!ready) {
    return (
      <div className="space-y-4" aria-hidden="true">
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="h-9 w-full max-w-md animate-pulse rounded bg-muted" />
        <div className="h-40 w-full animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  // Everything below runs only in the browser, after hydration: reading the clock here is safe.
  const today = dayKeyToday();
  const entries = entriesState.data ?? [];
  const customQuestions = customState.data ?? [];

  const saveAnswer = async (date: string, question: string, answer: string) => {
    try {
      await putEntry(database.db, { date, question, answer });
      toast.success(date === today ? "Saved. Sleep well." : `Saved for ${date}.`);
    } catch (error) {
      console.error("Failed to save the entry", error);
      toast.error("The entry could not be saved", {
        description: "Your answer is still in the box — try again in a moment.",
      });
    }
  };

  const removeEntry = async (entry: { date: string }) => {
    try {
      await deleteEntry(database.db, entry.date);
      toast.success("Entry deleted.");
    } catch (error) {
      console.error("Failed to delete the entry", error);
      toast.error("The entry could not be deleted", { description: "It is still there — try again in a moment." });
    }
  };

  const addQuestion = async (text: string) => {
    try {
      await addCustomQuestion(database.db, text);
      toast.success("Added to the rotation — it can be drawn from tomorrow.");
    } catch (error) {
      console.error("Failed to add the question", error);
      toast.error("The question could not be added", { description: "Try again in a moment." });
    }
  };

  const removeQuestion = async (id: number) => {
    try {
      await removeCustomQuestion(database.db, id);
      toast.success("Question removed from the rotation.");
    } catch (error) {
      console.error("Failed to remove the question", error);
      toast.error("The question could not be removed", { description: "It is still there — try again in a moment." });
    }
  };

  const tonightQuestion = questionForDate(today, customQuestions.map((question) => question.text));
  const tonightEntry = entries.find((entry) => entry.date === today);

  return (
    <div className="space-y-6">
      {status === "memory" ? (
        <Alert>
          <TriangleAlert className="size-4" />
          <AlertTitle>This browser is not keeping anything</AlertTitle>
          <AlertDescription>
            It refused the private storage this app saves into, so tonight's app is running from memory:
            everything works, but answers will be gone when you close the tab.
          </AlertDescription>
        </Alert>
      ) : null}

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

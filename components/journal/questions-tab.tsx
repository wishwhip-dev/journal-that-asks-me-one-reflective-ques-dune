"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CustomQuestion } from "@/lib/db";
import { fullPool, type PoolQuestion } from "@/lib/data/questions";
import { cn } from "@/lib/utils";

/** Display names for the rotation's themes, in the order the sections appear. */
const THEME_LABELS: Record<PoolQuestion["theme"], string> = {
  gratitude: "Gratitude",
  relationships: "Relationships",
  work: "Work",
  memory: "Memory",
  "self-knowledge": "Self-knowledge",
  "the day": "The day itself",
};

type Listed = PoolQuestion & { id?: string };

/**
 * Questions: the whole rotation pool, grouped by theme, plus the visitor's own questions. Adding
 * one joins the rotation and can be drawn from the next night on; Remove takes it back out. Fixed
 * questions cannot be removed — they are the rotation itself.
 */
export function QuestionsTab({
  customQuestions,
  onAdd,
  onRemove,
}: {
  customQuestions: CustomQuestion[];
  onAdd: (text: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState("");
  const [problem, setProblem] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const customTexts = customQuestions.map((question) => question.text);
  const listed: Listed[] = fullPool(customTexts).map((question) => ({
    ...question,
    id: question.custom ? customQuestions.find((candidate) => candidate.text === question.text)?.id : undefined,
  }));

  const sections: { label: string; items: Listed[] }[] = [
    ...Object.entries(THEME_LABELS).map(([theme, label]) => ({
      label,
      items: listed.filter((question) => !question.custom && question.theme === theme),
    })),
    { label: "Your own", items: listed.filter((question) => question.custom) },
  ].filter((section) => section.items.length > 0);

  const submit = async () => {
    const text = draft.trim();
    if (!text) {
      setProblem("Write the question first.");
      return;
    }
    if (text.length > 180) {
      setProblem("Keep questions to 180 characters so they read well on the home page.");
      return;
    }
    if (listed.some((question) => question.text.toLowerCase() === text.toLowerCase())) {
      setProblem("That question is already in the rotation.");
      return;
    }
    setProblem(null);
    setSaving(true);
    try {
      await onAdd(text);
      setDraft("");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    setRemoving(id);
    try {
      await onRemove(id);
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add a question</CardTitle>
          <CardDescription>Your questions join the evening rotation and can be drawn any night from tomorrow.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void submit();
            }}
            className="space-y-3"
          >
            <div className="space-y-2">
              <Label htmlFor="new-question">Your question</Label>
              <Input
                id="new-question"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                maxLength={180}
                placeholder="What did I do today that I want to remember?"
              />
              {problem ? (
                <p role="alert" className="text-sm font-medium text-destructive">
                  {problem}
                </p>
              ) : null}
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "Adding…" : "Add question"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">The rotation</CardTitle>
          <CardDescription>
            {listed.length} questions in the pool{customQuestions.length ? `, ${customQuestions.length} of them yours` : ""} —
            one drawn each evening.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {sections.map((section) => (
            <section key={section.label} className="space-y-2" aria-label={section.label}>
              <h3 className="text-sm font-semibold text-muted-foreground">{section.label}</h3>
              <ul className="space-y-2">
                {section.items.map((question) => (
                  <li
                    key={question.text}
                    className={cn(
                      "flex items-start justify-between gap-3 rounded-lg border bg-card p-3",
                      question.custom && "border-dashed",
                    )}
                  >
                    <div className="min-w-0 space-y-1.5">
                      <p className="text-sm leading-snug">{question.text}</p>
                      {question.custom ? (
                        <Badge variant="secondary" className="text-[10px]">
                          Yours
                        </Badge>
                      ) : null}
                    </div>
                    {question.custom && question.id !== undefined ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={removing === question.id}
                        onClick={() => void remove(question.id as string)}
                      >
                        {removing === question.id ? "Removing…" : "Remove"}
                      </Button>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

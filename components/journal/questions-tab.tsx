"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CustomQuestion } from "@/lib/db";
import { POOL, type PoolQuestion } from "@/lib/data/questions";
import { cn } from "@/lib/utils";

/**
 * Questions: the whole rotation pool, grouped by theme, plus the visitor's own questions. Adding
 * one joins the rotation from tomorrow; Remove takes it back out. Fixed questions cannot be
 * removed — they are the rotation itself.
 */
export function QuestionsTab({
  customQuestions,
  onAdd,
  onRemove,
}: {
  customQuestions: CustomQuestion[];
  onAdd: (text: string) => Promise<void>;
  onRemove: (id: number) => Promise<void>;
}) {
  const thisYear = new Date().getFullYear(); // render-time only after hydration gate; used as fallback year
  const [draft, setDraft] = useState("");
  const [problem, setProblem] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState<number | null>(null);

  const customTexts = customQuestions.map((question) => question.text);
  const poolWithMark: (PoolQuestion & { isCustom: boolean })[] = [
    ...POOL.map((question) => ({ ...question, isCustom: false })),
    ...customQuestions.map((question) => ({
      text: question.text,
      theme: "Your own",
      custom: true,
      isCustom: true,
    })),
  ];

  const themes = new Map<string, { theme: string; items: (PoolQuestion & { isCustom: boolean })[] }>();
  for (const question of poolWithMark) {
    const bucket = themes.get(question.theme);
    if (bucket) {
      bucket.items.push(question);
    } else {
      themes.set(question.theme, { theme: question.theme, items: [question] });
    }
  }

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
    if (poolWithMark.some((question) => question.text.toLowerCase() === text.toLowerCase())) {
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

  const remove = async (id: number) => {
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
            {POOL.length} questions on rotation{customQuestions.length ? `, plus ${customQuestions.length} of your own` : ""} — one
            drawn each evening.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {[...themes.values()].map((bucket) => (
            <section key={bucket.theme} className="space-y-2" aria-label={bucket.theme}>
              <h3 className="text-sm font-semibold text-muted-foreground">{bucket.theme}</h3>
              <ul className="space-y-2">
                {bucket.items.map((question) => (
                  <li
                    key={question.text}
                    className={cn(
                      "flex items-start justify-between gap-3 rounded-lg border bg-card p-3",
                      question.isCustom && "border-dashed",
                    )}
                  >
                    <div className="min-w-0 space-y-1">
                      <p className="text-sm leading-snug">{question.text}</p>
                      {question.isCustom ? (
                        <Badge variant="secondary" className="text-[10px]">
                          Yours
                        </Badge>
                      ) : null}
                    </div>
                    {question.isCustom && "id" in question ? null : null}
                    {question.isCustom ? (
                      (() => {
                        const custom = customQuestions.find((candidate) => candidate.text === question.text);
                        return custom ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={removing === custom.id}
                            onClick={() => void remove(custom.id)}
                          >
                            {removing === custom.id ? "Removing…" : "Remove"}
                          </Button>
                        ) : null;
                      })()
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

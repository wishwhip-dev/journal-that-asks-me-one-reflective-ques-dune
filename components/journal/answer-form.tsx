"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/**
 * The one answer form, used by every answering flow: tonight's question, editing a saved answer,
 * answering a past day from the strip. Owns its text and validation state; the parent owns the
 * write — `onSave` is awaited, and the parent surfaces its failure as a toast.
 *
 * Submitting with nothing but whitespace saves nothing and says so. Ctrl+Enter (or ⌘+Enter) in the
 * box submits, so the whole flow works from the keyboard.
 */
export type AnswerFormProps = {
  date: string;
  /** Starts the box with a saved answer, when this is an edit. */
  initialAnswer?: string;
  submitLabel?: string;
  onSave: (answer: string) => Promise<void>;
  onCancel?: () => void;
  autoFocus?: boolean;
  className?: string;
};

export function AnswerForm({ date, initialAnswer = "", submitLabel = "Save", onSave, onCancel, autoFocus = false, className }: AnswerFormProps) {
  const [text, setText] = useState(initialAnswer);
  const [problem, setProblem] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const problemId = useId();

  const submit = async () => {
    if (saving) return;
    if (!text.trim()) {
      setProblem("Write something first — even one honest sentence.");
      return;
    }
    setProblem(null);
    setSaving(true);
    try {
      await onSave(text.trim());
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
      className={cn("space-y-3", className)}
      data-date={date}
    >
      <div className="space-y-2">
        <Label htmlFor={`answer-${date}`}>Your answer</Label>
        <Textarea
          id={`answer-${date}`}
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
              event.preventDefault();
              void submit();
            }
          }}
          placeholder="A few honest sentences are plenty…"
          rows={6}
          autoFocus={autoFocus}
          aria-describedby={problem ? problemId : undefined}
          aria-invalid={problem ? true : undefined}
          className="min-h-32 resize-y"
        />
        {problem ? (
          <p id={problemId} role="alert" className="text-sm font-medium text-destructive">
            {problem}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">Press Ctrl+Enter to save.</p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : submitLabel}
        </Button>
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}

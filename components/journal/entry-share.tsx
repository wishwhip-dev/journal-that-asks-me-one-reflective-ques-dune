"use client";

import { ShareButton } from "@/components/share-button";
import { renderShareCard } from "@/lib/share";
import type { JournalEntry } from "@/lib/db";
import { formatDate } from "@/lib/data/dates";

/**
 * Share for one journal entry: an image card of that day's question and answer, offered only when
 * the visitor presses the button. Where there is no share sheet the card is saved instead — the
 * ShareButton writes what happened underneath itself.
 */

/** A sentence at a time, grouped so the card shows the answer rather than one cut line of it. */
function answerChunks(answer: string, maxChunks = 12): string[] {
  const paragraphs = answer
    .split(/\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  const sentences = paragraphs.flatMap((paragraph) => paragraph.replace(/([.!?…])\s+/g, "$1\u0000").split("\u0000").map((sentence) => sentence.trim()));
  const chunks: string[] = [];
  let current = "";
  for (const sentence of sentences) {
    if (current && `${current} ${sentence}`.length > 150) {
      chunks.push(current);
      current = sentence;
    } else {
      current = current ? `${current} ${sentence}` : sentence;
    }
  }
  if (current) chunks.push(current);
  if (chunks.length > maxChunks) {
    return [...chunks.slice(0, maxChunks), "…"];
  }
  return chunks;
}

export function EntryShare({ entry, label = "Share", className }: { entry: JournalEntry; label?: string; className?: string }) {
  return (
    <ShareButton
      label={label}
      className={className}
      cacheKey={`${entry.date}:${entry.updatedAt}`}
      title={entry.question}
      text={`From my evening journal, ${entry.date}`}
      filename={`journal-${entry.date}.png`}
      makeImage={() => {
        // The year is read here, at press time — never during render.
        return renderShareCard({
          title: formatDate(entry.date, new Date().getFullYear()),
          subtitle: entry.question,
          lines: answerChunks(entry.answer),
          format: "square",
        });
      }}
    />
  );
}

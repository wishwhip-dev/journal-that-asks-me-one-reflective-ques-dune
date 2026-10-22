import { JournalApp } from "@/components/journal/journal-app";

/**
 * The whole product lives on this one route: tonight's question, the journal, the question pool.
 * It stays a server component; the interactive app mounts as one client island below it.
 */
export default function Home() {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-2xl px-4 pb-safe pt-6 sm:px-6 sm:pt-10">
      <JournalApp />
    </main>
  );
}

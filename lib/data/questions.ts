/**
 * The rotation pool of reflective questions, and how a day is given one.
 *
 * `questionForDate` is the single source of truth for "tonight's question": it is a pure function
 * of the calendar date and the pool, so the same day always gets the same question — reloading the
 * page changes nothing, and the next day gets the next question. A day's answer stores the exact
 * text it answered, so adding or removing a custom question never rewrites history.
 *
 * The pool is base questions (here, grouped by theme) plus the questions the visitor added
 * themselves, which join the rotation at the end.
 */

import { dayNumber } from "./dates";

export type QuestionTheme =
  | "gratitude"
  | "relationships"
  | "work"
  | "memory"
  | "self-knowledge"
  | "the day";

export type PoolQuestion = {
  text: string;
  theme: QuestionTheme;
  /** True for a question the visitor added, false for one from the base pool. */
  custom: boolean;
};

/** One question per line, twelve per theme — evening-sized: answerable in a few honest sentences. */
export const BASE_QUESTIONS: readonly { text: string; theme: QuestionTheme }[] = [
  // Gratitude
  { theme: "gratitude", text: "What small thing today made your day better than it had to be?" },
  { theme: "gratitude", text: "Who did something kind for you recently, and did you tell them it mattered?" },
  { theme: "gratitude", text: "What is one comfort in your life you would miss most if it vanished tomorrow?" },
  { theme: "gratitude", text: "What went right today that you could easily have overlooked?" },
  { theme: "gratitude", text: "Who is someone you have never properly thanked, and what would you say to them?" },
  { theme: "gratitude", text: "What did your body do for you today without being asked?" },
  { theme: "gratitude", text: "What was the best thing that happened this week, however small?" },
  { theme: "gratitude", text: "What place feels like a refuge to you, and when were you last there?" },
  { theme: "gratitude", text: "What is a skill or ability you are glad you have?" },
  { theme: "gratitude", text: "What did you eat or drink today that you genuinely enjoyed?" },
  { theme: "gratitude", text: "What made you smile or laugh recently?" },
  { theme: "gratitude", text: "What ordinary thing were you able to do today that someone, somewhere, cannot?" },

  // Relationships
  { theme: "relationships", text: "Which conversation this week are you still thinking about?" },
  { theme: "relationships", text: "Who do you wish you saw more of, and what gets in the way?" },
  { theme: "relationships", text: "What did you do recently to take care of someone else?" },
  { theme: "relationships", text: "Who in your life makes you feel most like yourself?" },
  { theme: "relationships", text: "Is there anyone you owe an apology? What would saying it take?" },
  { theme: "relationships", text: "What do you appreciate about your closest person that you have never said aloud?" },
  { theme: "relationships", text: "Who would you call tonight if everything fell apart?" },
  { theme: "relationships", text: "Which relationship in your life is quietly getting stronger?" },
  { theme: "relationships", text: "Who taught you something you still use all the time?" },
  { theme: "relationships", text: "What did you learn about someone close to you recently that surprised you?" },
  { theme: "relationships", text: "If you could have dinner with anyone from your past, who would it be, and what would you ask them?" },
  { theme: "relationships", text: "What did someone do for you once that still shapes who you are?" },

  // Work
  { theme: "work", text: "What did you do today that moved something forward, even slightly?" },
  { theme: "work", text: "What part of your work feels most like you?" },
  { theme: "work", text: "What would you attempt if you knew you could not fail at it?" },
  { theme: "work", text: "What is one thing you are avoiding, and what is avoiding it costing you?" },
  { theme: "work", text: "When did you last feel genuinely proud of work you did?" },
  { theme: "work", text: "What does enough look like for you this year?" },
  { theme: "work", text: "What skill would you love to be better at a year from now?" },
  { theme: "work", text: "What did a hard moment today teach you about your limits?" },
  { theme: "work", text: "If your work disappeared tomorrow, what would you miss, and what would you not?" },
  { theme: "work", text: "What advice would you give yourself about the way you worked this week?" },
  { theme: "work", text: "What does rest look like for you, and did you get any today?" },
  { theme: "work", text: "What is something you did well recently that nobody noticed?" },

  // Memory
  { theme: "memory", text: "What smell or sound takes you straight back to childhood?" },
  { theme: "memory", text: "What is the best day you have had this year, and what made it good?" },
  { theme: "memory", text: "What do you remember most vividly about the home you grew up in?" },
  { theme: "memory", text: "What small tradition, yours or your family's, do you never want to lose?" },
  { theme: "memory", text: "What do you think this day last year looked like for you?" },
  { theme: "memory", text: "What moment would you relive exactly as it happened?" },
  { theme: "memory", text: "What is something you used to love that you have drifted away from?" },
  { theme: "memory", text: "What is the kindest thing a stranger ever did for you?" },
  { theme: "memory", text: "What memory makes you laugh every time it surfaces?" },
  { theme: "memory", text: "What do you wish you had asked a grandparent or elder before it was too late?" },
  { theme: "memory", text: "What do you own that carries a story worth writing down?" },
  { theme: "memory", text: "What place from your past would you walk through again tomorrow if you could?" },

  // Self-knowledge
  { theme: "self-knowledge", text: "What did you learn about yourself this week?" },
  { theme: "self-knowledge", text: "What emotion visited you most today, and what do you think it was pointing at?" },
  { theme: "self-knowledge", text: "What do you pretend not to know about yourself?" },
  { theme: "self-knowledge", text: "When do you feel most alive?" },
  { theme: "self-knowledge", text: "What is a belief you held ten years ago that you have since outgrown?" },
  { theme: "self-knowledge", text: "What do you do when you are afraid, and does it actually help?" },
  { theme: "self-knowledge", text: "What would the most forgiving version of you say about today?" },
  { theme: "self-knowledge", text: "What are you slowly getting better at, even if nobody claps?" },
  { theme: "self-knowledge", text: "What drains you that you could simply stop doing?" },
  { theme: "self-knowledge", text: "What do you want more of in your life, and less of?" },
  { theme: "self-knowledge", text: "Which compliment is the hardest for you to accept?" },
  { theme: "self-knowledge", text: "If today were a chapter title in your book, what would it be called?" },

  // The day
  { theme: "the day", text: "What are you carrying into tomorrow that you could set down tonight?" },
  { theme: "the day", text: "What did you notice today that you usually hurry past?" },
  { theme: "the day", text: "What is one thing you can do in the next ten minutes to make tomorrow kinder to you?" },
  { theme: "the day", text: "How did today treat you, in one honest sentence?" },
  { theme: "the day", text: "What are you looking forward to, even a little?" },
  { theme: "the day", text: "What felt heavy today, and is it actually yours to carry?" },
  { theme: "the day", text: "What would make tomorrow a good day?" },
  { theme: "the day", text: "What did you say no to today, and how did it feel?" },
  { theme: "the day", text: "What question have you been avoiding asking yourself?" },
  { theme: "the day", text: "What are you proud of from today, even quietly?" },
  { theme: "the day", text: "What is something true about your life right now worth writing down?" },
  { theme: "the day", text: "What do you hope the person you are in a year remembers about tonight?" },
];

/** The base pool in a stable rotation order: theme by theme, as written above. */
const BASE_TEXTS: readonly string[] = BASE_QUESTIONS.map((question) => question.text);

const THEME_OF: ReadonlyMap<string, QuestionTheme> = new Map(
  BASE_QUESTIONS.map((question) => [question.text, question.theme]),
);

/**
 * The full rotation for a moment in time: the base pool, then the visitor's own questions in the
 * order they were added. Adding or removing a custom question reshuffles which base question a
 * future day gets — that is what "joins the rotation" means — but days already answered keep the
 * question text stored with their entry.
 */
export function fullPool(customTexts: readonly string[]): PoolQuestion[] {
  return [
    ...BASE_TEXTS.map((text) => ({ text, theme: THEME_OF.get(text) as QuestionTheme, custom: false })),
    ...customTexts.map((text) => ({ text, theme: "the day" as QuestionTheme, custom: true })),
  ];
}

/**
 * The question a given calendar day gets. Deterministic: the same date and pool always give the
 * same question, on any reload, in any tab. Consecutive days walk through the pool in order.
 */
export function questionForDate(date: string, customTexts: readonly string[]): PoolQuestion {
  const pool = fullPool(customTexts);
  const index = ((dayNumber(date) % pool.length) + pool.length) % pool.length;
  return pool[index] ?? { text: "What is on your mind tonight?", theme: "the day", custom: false };
}

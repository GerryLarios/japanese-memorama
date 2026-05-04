export interface Sentence {
  id: string;
  type: "sentence";
  japanese: string;   // space-separated tiles, e.g. "わたしは 先生 です"
  hiragana: string;   // matching space-separated tiles in hiragana
  romaji: string;     // full sentence romanization
  spanish: string;
  english: string;
  lesson: number;
}

// Import sentence files as they are created. Add new lessons here.
import lesson01 from "./lesson-01.json";
// import lesson02 from "./lesson-02.json";
// ...

const ALL_SENTENCES: Sentence[] = [
  ...(lesson01 as Sentence[]),
];

/** Returns all sentences for the given lesson number. */
export function getSentences(lesson: number): Sentence[] {
  return ALL_SENTENCES.filter((s) => s.lesson === lesson);
}

/** Returns the lesson numbers that have at least one sentence. */
export function getLessonsWithSentences(): number[] {
  const set = new Set(ALL_SENTENCES.map((s) => s.lesson));
  return Array.from(set).sort((a, b) => a - b);
}

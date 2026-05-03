import { ALL_COUNTERS } from "./counters/index";
import { getKanaWords } from "./kana";
import type { Direction, GameConfig, VocabWord } from "./types";
import lesson01 from "./vocabulary/lesson-01.json";
import lesson02 from "./vocabulary/lesson-02.json";
import lesson03 from "./vocabulary/lesson-03.json";
import lesson04 from "./vocabulary/lesson-04.json";
import lesson05 from "./vocabulary/lesson-05.json";
import lesson06 from "./vocabulary/lesson-06.json";
import lesson07 from "./vocabulary/lesson-07.json";
import lesson08 from "./vocabulary/lesson-08.json";
import lesson09 from "./vocabulary/lesson-09.json";
import lesson10 from "./vocabulary/lesson-10.json";
import lesson11 from "./vocabulary/lesson-11.json";
import lesson12 from "./vocabulary/lesson-12.json";
import lesson13 from "./vocabulary/lesson-13.json";
import lesson14 from "./vocabulary/lesson-14.json";
import lesson15 from "./vocabulary/lesson-15.json";
import lesson16 from "./vocabulary/lesson-16.json";
import lesson17 from "./vocabulary/lesson-17.json";
import lesson18 from "./vocabulary/lesson-18.json";
import lesson19 from "./vocabulary/lesson-19.json";
import lesson20 from "./vocabulary/lesson-20.json";
import lesson21 from "./vocabulary/lesson-21.json";
import lesson22 from "./vocabulary/lesson-22.json";
import lesson23 from "./vocabulary/lesson-23.json";
import lesson24 from "./vocabulary/lesson-24.json";
import lesson25 from "./vocabulary/lesson-25.json";

const counterWords: VocabWord[] = ALL_COUNTERS.map((e) => ({
  id: e.id,
  japanese: e.japanese,
  hiragana: e.hiragana,
  romaji: e.romaji,
  spanish: e.spanish,
  english: e.english,
  type: "counter" as const,
  lesson: 0, // counters aren't lesson-bound; lesson 0 = "all lessons" pool
}));

const ALL_WORDS: VocabWord[] = [
  ...(lesson01 as VocabWord[]),
  ...(lesson02 as VocabWord[]),
  ...(lesson03 as VocabWord[]),
  ...(lesson04 as VocabWord[]),
  ...(lesson05 as VocabWord[]),
  ...(lesson06 as VocabWord[]),
  ...(lesson07 as VocabWord[]),
  ...(lesson08 as VocabWord[]),
  ...(lesson09 as VocabWord[]),
  ...(lesson10 as VocabWord[]),
  ...(lesson11 as VocabWord[]),
  ...(lesson12 as VocabWord[]),
  ...(lesson13 as VocabWord[]),
  ...(lesson14 as VocabWord[]),
  ...(lesson15 as VocabWord[]),
  ...(lesson16 as VocabWord[]),
  ...(lesson17 as VocabWord[]),
  ...(lesson18 as VocabWord[]),
  ...(lesson19 as VocabWord[]),
  ...(lesson20 as VocabWord[]),
  ...(lesson21 as VocabWord[]),
  ...(lesson22 as VocabWord[]),
  ...(lesson23 as VocabWord[]),
  ...(lesson24 as VocabWord[]),
  ...(lesson25 as VocabWord[]),
  ...counterWords,
];

export function getAllLessons(): number[] {
  return [...new Set(ALL_WORDS.map((w) => w.lesson))]
    .filter((l) => l > 0)
    .sort((a, b) => a - b);
}

export function getWords(config: Partial<GameConfig> = {}): VocabWord[] {
  // Kana practice mode
  if (config.kana) {
    return getKanaWords(
      config.kana.script,
      config.kana.types,
      config.count ?? 0,
    );
  }

  // Custom imported vocabulary — skip all lesson/type filters
  if (config.customWords && config.customWords.length > 0) {
    const words = config.count && config.count > 0
      ? shuffle([...config.customWords]).slice(0, config.count)
      : [...config.customWords];
    return words;
  }

  let words = [...ALL_WORDS];

  // Counters (lesson: 0) are only included when explicitly requested via wordType "counter"
  const wantsCounters =
    Array.isArray(config.wordTypes) && config.wordTypes.includes("counter");
  if (!wantsCounters) {
    words = words.filter((w) => w.lesson !== 0);
  }

  if (config.lessons && config.lessons.length > 0) {
    words = words.filter(
      (w) => w.lesson === 0 || config.lessons!.includes(w.lesson),
    );
  }

  if (config.wordTypes && config.wordTypes !== "all") {
    words = words.filter((w) =>
      (config.wordTypes as string[]).includes(w.type),
    );
  }

  if (config.count && config.count > 0) {
    words = shuffle(words).slice(0, config.count);
  }

  return words;
}

export function getQuestion(
  word: VocabWord,
  direction: Direction,
): { question: string; answer: string } {
  const dir =
    direction === "random"
      ? (["jp-es", "jp-en", "es-jp", "en-jp"] as Direction[])[
          Math.floor(Math.random() * 4)
        ]
      : direction;

  switch (dir) {
    case "jp-es":
      return { question: word.japanese, answer: word.spanish };
    case "jp-en":
      return { question: word.japanese, answer: word.english };
    case "es-jp":
      return { question: word.spanish, answer: word.japanese };
    case "en-jp":
      return { question: word.english, answer: word.japanese };
    default:
      return { question: word.japanese, answer: word.spanish };
  }
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pickWrongAnswers(
  word: VocabWord,
  allWords: VocabWord[],
  direction: Direction,
  count = 3,
): string[] {
  const dir = direction === "random" ? "jp-es" : direction;
  const isKana = word.id.startsWith("kana-");

  // Group i-adjective and na-adjective together
  const normalizeType = (t: string) =>
    t === "i-adjective" || t === "na-adjective" ? "adjective" : t;

  const wordGroup = normalizeType(word.type);

  const sameType = allWords.filter(
    (w) => w.id !== word.id && normalizeType(w.type) === wordGroup,
  );

  // Fall back to any word if not enough same-type candidates
  const pool =
    sameType.length >= count
      ? sameType
      : allWords.filter((w) => w.id !== word.id);

  const shuffled = shuffle(pool);

  return shuffled.slice(0, count).map((w) => {
    if (isKana) return w.romaji;
    switch (dir) {
      case "jp-es":
        return w.spanish;
      case "jp-en":
        return w.english;
      case "es-jp":
      case "en-jp":
        return w.japanese;
      default:
        return w.spanish;
    }
  });
}

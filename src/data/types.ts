export type WordType =
  | "noun"
  | "verb"
  | "i-adjective"
  | "na-adjective"
  | "expression"
  | "counter"
  | "adverb"
  | "particle"
  | "conjunction"
  | "sentence";

export type Direction = "jp-es" | "jp-en" | "es-jp" | "en-jp" | "random";

export interface VocabWord {
  id: string;
  japanese: string;
  hiragana: string;
  romaji: string;
  spanish: string;
  english: string;
  type: WordType;
  lesson: number;
  example?: string;
}

export type KanaScript = "hiragana" | "katakana";
export type KanaType = "seion" | "dakuon" | "youon";

export interface GameConfig {
  lessons: number[];
  wordTypes: WordType[] | "all";
  direction: Direction;
  count: number; // 10 | 20 | 0 = all
  kana?: { script: KanaScript[]; types: KanaType[] };
  customWords?: VocabWord[]; // session-only imported vocabulary
  showHiragana?: boolean; // default true
  showRomaji?: boolean;   // default true
}

export type GameMode =
  | "memorama"
  | "quiz"
  | "flashcards"
  | "fill-blank"
  | "listening"
  | "numbers"
  | "conjugations"
  | "adjectives";

export interface GameInfo {
  id: GameMode;
  title: string;
  description: string;
  emoji: string;
  color: string; // tailwind bg class
}

export const GAMES: GameInfo[] = [
  {
    id: "memorama",
    title: "Memorama",
    description: "Encuentra los pares de cartas (japonés ↔ traducción)",
    emoji: "🃏",
    color: "bg-violet-500",
  },
  {
    id: "quiz",
    title: "Quiz Kahoot",
    description: "Elige la respuesta correcta antes de que se acabe el tiempo",
    emoji: "🎯",
    color: "bg-rose-500",
  },
  {
    id: "flashcards",
    title: "Flashcards",
    description: "Repasa las tarjetas y evalúa cuánto recuerdas",
    emoji: "📖",
    color: "bg-amber-500",
  },
  {
    id: "fill-blank",
    title: "Llena el Espacio",
    description: "Escribe la palabra japonesa a partir del significado",
    emoji: "✍️",
    color: "bg-emerald-500",
  },
  {
    id: "listening",
    title: "Listening",
    description: "Escucha la palabra y elige el significado correcto",
    emoji: "🔊",
    color: "bg-sky-500",
  },
  {
    id: "numbers",
    title: "Números",
    description: "Practica la lectura de números en japonés (1 – 9999)",
    emoji: "🔢",
    color: "bg-teal-500",
  },
  {
    id: "conjugations",
    title: "Conjugaciones",
    description: "Practica las formas verbales: ます, ない, て, た, たら, ています",
    emoji: "🔤",
    color: "bg-indigo-500",
  },
  {
    id: "adjectives",
    title: "Adjetivos",
    description: "Practica las formas de adjetivos い y な: negativo, pasado, て, adverbio",
    emoji: "🎨",
    color: "bg-pink-500",
  },
];

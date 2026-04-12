/** Japanese number reading system (0–9999) */

const ONES_H = [
  "",
  "いち",
  "に",
  "さん",
  "よん",
  "ご",
  "ろく",
  "なな",
  "はち",
  "きゅう",
];
const ONES_R = [
  "",
  "ichi",
  "ni",
  "san",
  "yon",
  "go",
  "roku",
  "nana",
  "hachi",
  "kyuu",
];

function buildNumber(n: number): { hiragana: string; romaji: string } {
  if (n === 0) return { hiragana: "ぜろ", romaji: "zero" };

  let h = "";
  let r = "";

  // Thousands (1000–9000)
  const thou = Math.floor(n / 1000);
  if (thou === 1) {
    h += "せん";
    r += "sen";
  } else if (thou === 3) {
    h += "さんぜん";
    r += "sansen";
  } else if (thou === 8) {
    h += "はっせん";
    r += "hassen";
  } else if (thou > 1) {
    h += ONES_H[thou] + "せん";
    r += ONES_R[thou] + "sen";
  }

  // Hundreds (100–900) – irregular sound changes for 3, 6, 8
  const hund = Math.floor((n % 1000) / 100);
  if (hund === 1) {
    h += "ひゃく";
    r += "hyaku";
  } else if (hund === 3) {
    h += "さんびゃく";
    r += "sanbyaku";
  } else if (hund === 6) {
    h += "ろっぴゃく";
    r += "roppyaku";
  } else if (hund === 8) {
    h += "はっぴゃく";
    r += "happyaku";
  } else if (hund > 1) {
    h += ONES_H[hund] + "ひゃく";
    r += ONES_R[hund] + "hyaku";
  }

  // Tens (10–90)
  const tens = Math.floor((n % 100) / 10);
  if (tens === 1) {
    h += "じゅう";
    r += "juu";
  } else if (tens > 1) {
    h += ONES_H[tens] + "じゅう";
    r += ONES_R[tens] + "juu";
  }

  // Ones (1–9)
  const ones = n % 10;
  if (ones > 0) {
    h += ONES_H[ones];
    r += ONES_R[ones];
  }

  return { hiragana: h, romaji: r };
}

export interface NumberWord {
  value: number;
  hiragana: string;
  romaji: string;
}

export function getNumberWords(min: number, max: number): NumberWord[] {
  const out: NumberWord[] = [];
  for (let i = min; i <= max; i++) {
    out.push({ value: i, ...buildNumber(i) });
  }
  return out;
}

export function numberToJapanese(n: number): {
  hiragana: string;
  romaji: string;
} {
  return buildNumber(n);
}

export const NUMBER_RANGES = [
  { label: "1 – 10", min: 1, max: 10 },
  { label: "1 – 20", min: 1, max: 20 },
  { label: "1 – 100", min: 1, max: 100 },
  { label: "1 – 999", min: 1, max: 999 },
  { label: "1 – 9999", min: 1, max: 9999 },
] as const;

import nin    from "./nin.json";
import hiki   from "./hiki.json";
import tou    from "./tou.json";
import hon    from "./hon.json";
import mai    from "./mai.json";
import satsu  from "./satsu.json";
import dai    from "./dai.json";
import hai    from "./hai.json";
import kai    from "./kai.json";
import ko     from "./ko.json";
import fun_   from "./fun.json";
import ji     from "./ji.json";
import nen    from "./nen.json";
import gatsu  from "./gatsu.json";
import nichi  from "./nichi.json";

const rawData = [...nin, ...hiki, ...tou, ...hon, ...mai, ...satsu, ...dai, ...hai, ...kai, ...ko, ...fun_, ...ji, ...nen, ...gatsu, ...nichi];

export interface CounterEntry {
  id: string;
  counter: string; // kanji suffix, e.g. "匹"
  counterRomaji: string; // reading hint, e.g. "hiki"
  category: string; // e.g. "Animales pequeños"
  categoryEmoji: string;
  n: number; // the number (0 = question word 何~)
  japanese: string; // kanji form, e.g. "三匹"
  hiragana: string; // reading, e.g. "さんびき"
  romaji: string; // e.g. "sanbiki"
  spanish: string;
  english: string;
  irregular: boolean; // sound-change from base reading
}

/** All counter entries */
export const ALL_COUNTERS: CounterEntry[] = rawData as CounterEntry[];

/** Unique counter categories in order of appearance */
export const COUNTER_CATEGORIES: {
  counter: string;
  category: string;
  emoji: string;
}[] = ALL_COUNTERS.reduce<
  { counter: string; category: string; emoji: string }[]
>((acc, e) => {
  if (!acc.some((c) => c.counter === e.counter)) {
    acc.push({
      counter: e.counter,
      category: e.category,
      emoji: e.categoryEmoji,
    });
  }
  return acc;
}, []);

/** Get entries for specific counters (pass [] for all) */
export function getCounterEntries(counters: string[]): CounterEntry[] {
  if (!counters.length) return ALL_COUNTERS;
  return ALL_COUNTERS.filter((e) => counters.includes(e.counter));
}

/** Get entries flagged as irregular only */
export function getIrregularEntries(counters: string[]): CounterEntry[] {
  return getCounterEntries(counters).filter((e) => e.irregular);
}

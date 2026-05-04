import adjN1 from "./adj_n1.json";
import adjN2 from "./adj_n2.json";
import adjN3 from "./adj_n3.json";
import adjN4 from "./adj_n4.json";
import adjN5 from "./adj_n5.json";

export type AdjType = "i" | "na";
export type AdjLevel = "N5" | "N4" | "N3" | "N2" | "N1";
export type AdjForm = "negative" | "past" | "negativePast" | "te" | "adverb";

export interface ConjugationAdj {
  id: string;
  dictionary: string;
  hiragana: string;
  romaji: string;
  type: AdjType;
  // Conjugation forms
  negative: string;
  negativeRomaji: string;
  past: string;
  pastRomaji: string;
  negativePast: string;
  negativePastRomaji: string;
  te: string;
  teRomaji: string;
  adverb: string;
  adverbRomaji: string;
  // Meaning
  spanish: string;
  english: string;
}

export const ADJ_LEVELS: { value: AdjLevel; label: string; count: number }[] =
  [
    { value: "N5", label: "N5", count: (adjN5 as ConjugationAdj[]).length },
    { value: "N4", label: "N4", count: (adjN4 as ConjugationAdj[]).length },
    { value: "N3", label: "N3", count: (adjN3 as ConjugationAdj[]).length },
    { value: "N2", label: "N2", count: (adjN2 as ConjugationAdj[]).length },
    { value: "N1", label: "N1", count: (adjN1 as ConjugationAdj[]).length },
  ];

export const ADJ_FORM_LABELS: Record<AdjForm, string> = {
  negative: "negativo",
  past: "pasado",
  negativePast: "neg. pasado",
  te: "て形",
  adverb: "adverbio",
};

export const ADJ_FORM_ROMAJI: Record<AdjForm, string> = {
  negative: "nai",
  past: "past",
  negativePast: "nai past",
  te: "te",
  adverb: "adverb",
};

const ADJS_BY_LEVEL: Record<AdjLevel, ConjugationAdj[]> = {
  N5: adjN5 as ConjugationAdj[],
  N4: adjN4 as ConjugationAdj[],
  N3: adjN3 as ConjugationAdj[],
  N2: adjN2 as ConjugationAdj[],
  N1: adjN1 as ConjugationAdj[],
};

export function getAdjsByLevels(levels: AdjLevel[]): ConjugationAdj[] {
  return levels.flatMap((l) => ADJS_BY_LEVEL[l]);
}

export function getAdjForm(adj: ConjugationAdj, form: AdjForm): string {
  return adj[form];
}

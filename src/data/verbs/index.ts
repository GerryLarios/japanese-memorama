import verbsN1 from "./verbs_n1.json";
import verbsN2 from "./verbs_n2.json";
import verbsN3 from "./verbs_n3.json";
import verbsN4 from "./verbs_n4.json";
import verbsN5 from "./verbs_n5.json";

export type VerbLevel = "N5" | "N4" | "N3" | "N2" | "N1";

export type VerbForm = "masu" | "nai" | "te" | "ta" | "tara" | "teiru";

export interface ConjugationVerb {
  id: string;
  dictionary: string;
  hiragana: string;
  romaji: string;
  // All conjugation forms (hiragana)
  masu: string;
  masuRomaji: string;
  nai: string;
  naiRomaji: string;
  te: string;
  teRomaji: string;
  ta: string;
  taRomaji: string;
  tara: string;
  taraRomaji: string;
  teiru: string;
  teiruRomaji: string;
  // Meaning
  spanish: string;
  english: string;
  // Verb group (1 = Godan, 2 = Ichidan, 3 = Irregular)
  group: 1 | 2 | 3;
}

export const VERB_LEVELS: { value: VerbLevel; label: string; count: number }[] =
  [
    { value: "N5", label: "N5", count: (verbsN5 as ConjugationVerb[]).length },
    { value: "N4", label: "N4", count: (verbsN4 as ConjugationVerb[]).length },
    { value: "N3", label: "N3", count: (verbsN3 as ConjugationVerb[]).length },
    { value: "N2", label: "N2", count: (verbsN2 as ConjugationVerb[]).length },
    { value: "N1", label: "N1", count: (verbsN1 as ConjugationVerb[]).length },
  ];

export const VERB_FORM_LABELS: Record<VerbForm, string> = {
  masu: "ます",
  nai: "ない",
  te: "て",
  ta: "た",
  tara: "たら",
  teiru: "ています",
};

export const VERB_FORM_ROMAJI: Record<VerbForm, string> = {
  masu: "masu",
  nai: "nai",
  te: "te",
  ta: "ta",
  tara: "tara",
  teiru: "te iru",
};

const VERBS_BY_LEVEL: Record<VerbLevel, ConjugationVerb[]> = {
  N5: verbsN5 as ConjugationVerb[],
  N4: verbsN4 as ConjugationVerb[],
  N3: verbsN3 as ConjugationVerb[],
  N2: verbsN2 as ConjugationVerb[],
  N1: verbsN1 as ConjugationVerb[],
};

export function getVerbsByLevels(levels: VerbLevel[]): ConjugationVerb[] {
  return levels.flatMap((l) => VERBS_BY_LEVEL[l]);
}

export function getVerbForm(verb: ConjugationVerb, form: VerbForm): string {
  return verb[form];
}

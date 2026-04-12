import type { VocabWord } from './types';

// ---------------------------------------------------------------------------
// Raw kana tables
// [japanese, romaji, hiraganaEquivalent (for katakana rows)]
// ---------------------------------------------------------------------------

type RawKana = [string, string, string?]; // [char, romaji, hiraEquiv?]

// Hiragana Seion
const H_SEION: RawKana[] = [
  ['あ','a'],['い','i'],['う','u'],['え','e'],['お','o'],
  ['か','ka'],['き','ki'],['く','ku'],['け','ke'],['こ','ko'],
  ['さ','sa'],['し','shi'],['す','su'],['せ','se'],['そ','so'],
  ['た','ta'],['ち','chi'],['つ','tsu'],['て','te'],['と','to'],
  ['な','na'],['に','ni'],['ぬ','nu'],['ね','ne'],['の','no'],
  ['は','ha'],['ひ','hi'],['ふ','fu'],['へ','he'],['ほ','ho'],
  ['ま','ma'],['み','mi'],['む','mu'],['め','me'],['も','mo'],
  ['や','ya'],['ゆ','yu'],['よ','yo'],
  ['ら','ra'],['り','ri'],['る','ru'],['れ','re'],['ろ','ro'],
  ['わ','wa'],['を','wo'],['ん','n'],
];

// Hiragana Dakuon + Handakuon
const H_DAKUON: RawKana[] = [
  ['が','ga'],['ぎ','gi'],['ぐ','gu'],['げ','ge'],['ご','go'],
  ['ざ','za'],['じ','ji'],['ず','zu'],['ぜ','ze'],['ぞ','zo'],
  ['だ','da'],['ぢ','ji'],['づ','zu'],['で','de'],['ど','do'],
  ['ば','ba'],['び','bi'],['ぶ','bu'],['べ','be'],['ぼ','bo'],
  ['ぱ','pa'],['ぴ','pi'],['ぷ','pu'],['ぺ','pe'],['ぽ','po'],
];

// Hiragana Youon
const H_YOUON: RawKana[] = [
  ['きゃ','kya'],['きゅ','kyu'],['きょ','kyo'],
  ['しゃ','sha'],['しゅ','shu'],['しょ','sho'],
  ['ちゃ','cha'],['ちゅ','chu'],['ちょ','cho'],
  ['にゃ','nya'],['にゅ','nyu'],['にょ','nyo'],
  ['ひゃ','hya'],['ひゅ','hyu'],['ひょ','hyo'],
  ['みゃ','mya'],['みゅ','myu'],['みょ','myo'],
  ['りゃ','rya'],['りゅ','ryu'],['りょ','ryo'],
  ['ぎゃ','gya'],['ぎゅ','gyu'],['ぎょ','gyo'],
  ['じゃ','ja'], ['じゅ','ju'], ['じょ','jo'],
  ['びゃ','bya'],['びゅ','byu'],['びょ','byo'],
  ['ぴゃ','pya'],['ぴゅ','pyu'],['ぴょ','pyo'],
];

// Katakana Seion
const K_SEION: RawKana[] = [
  ['ア','a','あ'],['イ','i','い'],['ウ','u','う'],['エ','e','え'],['オ','o','お'],
  ['カ','ka','か'],['キ','ki','き'],['ク','ku','く'],['ケ','ke','け'],['コ','ko','こ'],
  ['サ','sa','さ'],['シ','shi','し'],['ス','su','す'],['セ','se','せ'],['ソ','so','そ'],
  ['タ','ta','た'],['チ','chi','ち'],['ツ','tsu','つ'],['テ','te','て'],['ト','to','と'],
  ['ナ','na','な'],['ニ','ni','に'],['ヌ','nu','ぬ'],['ネ','ne','ね'],['ノ','no','の'],
  ['ハ','ha','は'],['ヒ','hi','ひ'],['フ','fu','ふ'],['ヘ','he','へ'],['ホ','ho','ほ'],
  ['マ','ma','ま'],['ミ','mi','み'],['ム','mu','む'],['メ','me','め'],['モ','mo','も'],
  ['ヤ','ya','や'],['ユ','yu','ゆ'],['ヨ','yo','よ'],
  ['ラ','ra','ら'],['リ','ri','り'],['ル','ru','る'],['レ','re','れ'],['ロ','ro','ろ'],
  ['ワ','wa','わ'],['ヲ','wo','を'],['ン','n','ん'],
];

// Katakana Dakuon + Handakuon
const K_DAKUON: RawKana[] = [
  ['ガ','ga','が'],['ギ','gi','ぎ'],['グ','gu','ぐ'],['ゲ','ge','げ'],['ゴ','go','ご'],
  ['ザ','za','ざ'],['ジ','ji','じ'],['ズ','zu','ず'],['ゼ','ze','ぜ'],['ゾ','zo','ぞ'],
  ['ダ','da','だ'],['ヂ','ji','ぢ'],['ヅ','zu','づ'],['デ','de','で'],['ド','do','ど'],
  ['バ','ba','ば'],['ビ','bi','び'],['ブ','bu','ぶ'],['ベ','be','べ'],['ボ','bo','ぼ'],
  ['パ','pa','ぱ'],['ピ','pi','ぴ'],['プ','pu','ぷ'],['ペ','pe','ぺ'],['ポ','po','ぽ'],
];

// Katakana Youon
const K_YOUON: RawKana[] = [
  ['キャ','kya','きゃ'],['キュ','kyu','きゅ'],['キョ','kyo','きょ'],
  ['シャ','sha','しゃ'],['シュ','shu','しゅ'],['ショ','sho','しょ'],
  ['チャ','cha','ちゃ'],['チュ','chu','ちゅ'],['チョ','cho','ちょ'],
  ['ニャ','nya','にゃ'],['ニュ','nyu','にゅ'],['ニョ','nyo','にょ'],
  ['ヒャ','hya','ひゃ'],['ヒュ','hyu','ひゅ'],['ヒョ','hyo','ひょ'],
  ['ミャ','mya','みゃ'],['ミュ','myu','みゅ'],['ミョ','myo','みょ'],
  ['リャ','rya','りゃ'],['リュ','ryu','りゅ'],['リョ','ryo','りょ'],
  ['ギャ','gya','ぎゃ'],['ギュ','gyu','ぎゅ'],['ギョ','gyo','ぎょ'],
  ['ジャ','ja','じゃ'], ['ジュ','ju','じゅ'], ['ジョ','jo','じょ'],
  ['ビャ','bya','びゃ'],['ビュ','byu','びゅ'],['ビョ','byo','びょ'],
  ['ピャ','pya','ぴゃ'],['ピュ','pyu','ぴゅ'],['ピョ','pyo','ぴょ'],
];

// ---------------------------------------------------------------------------
// Build VocabWord from raw kana entry
// ---------------------------------------------------------------------------
function toWord(
  raw: RawKana,
  script: 'hiragana' | 'katakana',
  kanaType: 'seion' | 'dakuon' | 'youon',
): VocabWord {
  const [char, romaji, hiraEquiv] = raw;
  const id = `kana-${script}-${kanaType}-${romaji}-${char}`;
  return {
    id,
    japanese: char,
    // For hiragana: hiragana === japanese so JapaneseWord won't duplicate it.
    // For katakana: show the hiragana equivalent as a reading hint.
    hiragana: hiraEquiv ?? char,
    romaji,
    // "meaning" for kana is just the romaji reading
    spanish: romaji,
    english: romaji,
    type: 'noun', // placeholder — not used for kana filtering
    lesson: 0,
  };
}

export type KanaScript = 'hiragana' | 'katakana';
export type KanaType = 'seion' | 'dakuon' | 'youon';

const ALL_KANA: VocabWord[] = [
  ...H_SEION.map((r) => toWord(r, 'hiragana', 'seion')),
  ...H_DAKUON.map((r) => toWord(r, 'hiragana', 'dakuon')),
  ...H_YOUON.map((r) => toWord(r, 'hiragana', 'youon')),
  ...K_SEION.map((r) => toWord(r, 'katakana', 'seion')),
  ...K_DAKUON.map((r) => toWord(r, 'katakana', 'dakuon')),
  ...K_YOUON.map((r) => toWord(r, 'katakana', 'youon')),
];

export function getKanaWords(
  scripts: KanaScript[],
  types: KanaType[],
  count = 0,
): VocabWord[] {
  const scriptSet = new Set(scripts);
  const typeSet = new Set(types);

  let words = ALL_KANA.filter((w) => {
    const parts = w.id.split('-'); // kana-{script}-{type}-...
    return scriptSet.has(parts[1] as KanaScript) && typeSet.has(parts[2] as KanaType);
  });

  if (count > 0) {
    // Shuffle and slice for count-limited mode
    const a = [...words];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    words = a.slice(0, count);
  }

  return words;
}

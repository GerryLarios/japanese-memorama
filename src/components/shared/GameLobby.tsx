import { useEffect, useState } from "react";
import type {
  Direction,
  GameConfig,
  KanaScript,
  KanaType,
  WordType,
} from "../../data/types";
import { getAllLessons, getWords } from "../../data/vocab";
import { getKanaWords } from "../../data/kana";

interface Props {
  onStart: (config: GameConfig) => void;
  gameTitle: string;
  gameEmoji: string;
  color: string;
}

const WORD_TYPES: { value: WordType | "all"; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "noun", label: "Sustantivos" },
  { value: "verb", label: "Verbos" },
  { value: "i-adjective", label: "Adj. い" },
  { value: "na-adjective", label: "Adj. な" },
  { value: "expression", label: "Expresiones" },
  { value: "adverb", label: "Adverbios" },
];

const VOCAB_DIRECTIONS: { value: Direction; label: string }[] = [
  { value: "jp-es", label: "🇯🇵 → 🇲🇽 Japonés → Español" },
  // { value: "jp-en", label: "🇯🇵 → 🇬🇧 Japonés → Inglés" }, // NOT IMPLEMENTED YET.
  { value: "es-jp", label: "🇲🇽 → 🇯🇵 Español → Japonés" },
  // { value: "en-jp", label: "🇬🇧 → 🇯🇵 Inglés → Japonés" }, // NOT IMPLEMENTED YET.
  { value: "random", label: "🎲 Aleatorio" },
];

const KANA_DIRECTIONS: { value: Direction; label: string }[] = [
  { value: "jp-es", label: "あ → romaji (Kana → Lectura)" },
  { value: "es-jp", label: "romaji → あ (Lectura → Kana)" },
];

const KANA_SCRIPTS: { value: KanaScript; label: string; sub: string }[] = [
  { value: "hiragana", label: "Hiragana", sub: "あいう…" },
  { value: "katakana", label: "Katakana", sub: "アイウ…" },
];

const KANA_TYPES: { value: KanaType; label: string; desc: string }[] = [
  { value: "seion", label: "Seion", desc: "清音 · Básicos" },
  { value: "dakuon", label: "Dakuon", desc: "濁音 · Sonoros ga/za/da/ba/pa" },
  { value: "youon", label: "Youon", desc: "拗音 · Combinados kya/sha…" },
];

const COUNTS = [
  { value: 0, label: "Todos" },
  { value: 20, label: "20" },
  { value: 10, label: "10" },
];

function toggle<T>(arr: T[], val: T, min = 1): T[] {
  if (arr.includes(val))
    return arr.length > min ? arr.filter((x) => x !== val) : arr;
  return [...arr, val];
}

function ChipBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
        active
          ? "bg-violet-600 border-violet-500 text-white"
          : "bg-slate-700 border-slate-600 text-slate-300 hover:border-violet-500"
      }`}
    >
      {children}
    </button>
  );
}

export default function GameLobby({
  onStart,
  gameTitle,
  gameEmoji,
  color,
}: Props) {
  const lessons = getAllLessons();

  // Parse URL params once (client-only, safe for SSR hydration via lazy init)
  const [mode, setMode] = useState<"vocab" | "kana">(() => {
    if (typeof window === "undefined") return "vocab";
    return new URLSearchParams(window.location.search).get("type") === "kana"
      ? "kana"
      : "vocab";
  });

  const [selectedLessons, setSelectedLessons] = useState<number[]>(() => {
    if (typeof window === "undefined") return [lessons[0]];
    const raw = new URLSearchParams(window.location.search).get("lesson");
    if (raw) {
      const parsed = raw
        .split(",")
        .map(Number)
        .filter((n) => lessons.includes(n));
      if (parsed.length) return parsed;
    }
    return [lessons[0]];
  });

  const [wordType, setWordType] = useState<WordType | "all">(() => {
    if (typeof window === "undefined") return "all";
    const raw = new URLSearchParams(window.location.search).get("wordType") as
      | WordType
      | "all"
      | null;
    return raw && WORD_TYPES.some((t) => t.value === raw) ? raw : "all";
  });

  const [kanaScripts, setKanaScripts] = useState<KanaScript[]>(() => {
    if (typeof window === "undefined") return ["hiragana"];
    const raw = new URLSearchParams(window.location.search).get("kanaScript");
    if (raw) {
      const parsed = raw
        .split(",")
        .filter((s): s is KanaScript => s === "hiragana" || s === "katakana");
      if (parsed.length) return parsed;
    }
    return ["hiragana"];
  });

  const [kanaTypes, setKanaTypes] = useState<KanaType[]>(() => {
    if (typeof window === "undefined") return ["seion"];
    const raw = new URLSearchParams(window.location.search).get("kanaType");
    if (raw) {
      const parsed = raw
        .split(",")
        .filter(
          (s): s is KanaType =>
            s === "seion" || s === "dakuon" || s === "youon",
        );
      if (parsed.length) return parsed;
    }
    return ["seion"];
  });

  const [direction, setDirection] = useState<Direction>(() => {
    if (typeof window === "undefined") return "jp-es";
    const raw = new URLSearchParams(window.location.search).get(
      "direction",
    ) as Direction | null;
    const valid: Direction[] = ["jp-es", "jp-en", "es-jp", "en-jp", "random"];
    return raw && valid.includes(raw) ? raw : "jp-es";
  });

  const [count, setCount] = useState(() => {
    if (typeof window === "undefined") return 0;
    const raw = new URLSearchParams(window.location.search).get("count");
    const n = Number(raw);
    return COUNTS.some((c) => c.value === n) ? n : 0;
  });

  const [showVocab, setShowVocab] = useState(false);
  const [showKana, setShowKana] = useState(false);

  // Sync state → URL whenever any selection changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = new URLSearchParams();
    p.set("type", mode);
    if (mode === "vocab") {
      p.set("lesson", selectedLessons.join(","));
      if (wordType !== "all") p.set("wordType", wordType);
      p.set("direction", direction);
    } else {
      p.set("kanaScript", kanaScripts.join(","));
      p.set("kanaType", kanaTypes.join(","));
      p.set("direction", direction);
    }
    if (count !== 0) p.set("count", String(count));
    window.history.replaceState({}, "", `?${p.toString()}`);
  }, [
    mode,
    selectedLessons,
    wordType,
    kanaScripts,
    kanaTypes,
    direction,
    count,
  ]);

  const directions = mode === "kana" ? KANA_DIRECTIONS : VOCAB_DIRECTIONS;

  const handleStart = () => {
    if (mode === "kana") {
      onStart({
        lessons: [],
        wordTypes: "all",
        direction,
        count,
        kana: { script: kanaScripts, types: kanaTypes },
      });
    } else {
      onStart({
        lessons: selectedLessons,
        wordTypes: wordType === "all" ? "all" : [wordType],
        direction,
        count,
      });
    }
  };

  return (
    <div className="game-container space-y-6">
      {/* Header */}
      <div
        className={`${color} rounded-2xl p-6 text-white text-center shadow-xl`}
      >
        <div className="text-5xl mb-2">{gameEmoji}</div>
        <h1 className="text-2xl font-bold">{gameTitle}</h1>
      </div>

      {/* Mode toggle */}
      <div className="card p-1 flex gap-1">
        {(["vocab", "kana"] as const).map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m);
              setDirection("jp-es");
            }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              mode === m
                ? "bg-violet-600 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {m === "vocab" ? "📚 Vocabulario" : "あ Kana"}
          </button>
        ))}
      </div>

      {/* ── Vocab options ── */}
      {mode === "vocab" && (
        <>
          <div className="card p-5 space-y-3">
            <h2 className="font-semibold text-slate-300">📚 Lecciones</h2>
            <div className="flex flex-wrap gap-2">
              {lessons.map((l) => (
                <ChipBtn
                  key={l}
                  active={selectedLessons.includes(l)}
                  onClick={() => setSelectedLessons(toggle(selectedLessons, l))}
                >
                  Lección {l}
                </ChipBtn>
              ))}
            </div>
          </div>

          <div className="card p-5 space-y-3">
            <h2 className="font-semibold text-slate-300">🏷️ Tipo de palabra</h2>
            <div className="flex flex-wrap gap-2">
              {WORD_TYPES.map((t) => (
                <ChipBtn
                  key={t.value}
                  active={wordType === t.value}
                  onClick={() => setWordType(t.value)}
                >
                  {t.label}
                </ChipBtn>
              ))}
            </div>
          </div>
          {/* Show vocabulary button */}
          {(() => {
            const previewWords = getWords({
              lessons: selectedLessons,
              wordTypes: wordType === "all" ? "all" : [wordType],
            });
            return (
              <button
                onClick={() => setShowVocab(true)}
                className="w-full py-2.5 rounded-xl text-sm font-semibold border border-slate-600 bg-slate-700 text-slate-300 hover:border-violet-500 hover:text-violet-300 transition-all"
              >
                📖 Ver vocabulario ({previewWords.length} palabras)
              </button>
            );
          })()}
        </>
      )}

      {/* ── Kana options ── */}
      {mode === "kana" && (
        <>
          <div className="card p-5 space-y-3">
            <h2 className="font-semibold text-slate-300">✍️ Silabario</h2>
            <div className="flex gap-2">
              {KANA_SCRIPTS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setKanaScripts(toggle(kanaScripts, s.value))}
                  className={`flex-1 py-3 rounded-xl border transition-all text-center ${
                    kanaScripts.includes(s.value)
                      ? "bg-violet-600 border-violet-500 text-white"
                      : "bg-slate-700 border-slate-600 text-slate-300 hover:border-violet-500"
                  }`}
                >
                  <div className="font-bold">{s.label}</div>
                  <div className="text-xs opacity-70">{s.sub}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="card p-5 space-y-3">
            <h2 className="font-semibold text-slate-300">🔤 Tipo de kana</h2>
            <div className="space-y-2">
              <button
                onClick={() => setKanaTypes(["seion", "dakuon", "youon"])}
                className={`w-full text-left px-4 py-2.5 rounded-xl border transition-all ${
                  kanaTypes.length === 3
                    ? "bg-violet-600 border-violet-500 text-white"
                    : "bg-slate-700 border-slate-600 text-slate-300 hover:border-violet-500"
                }`}
              >
                <span className="font-semibold">Todo</span>
                <span className="text-xs opacity-70 ml-2">
                  Seion + Dakuon + Youon
                </span>
              </button>
              {KANA_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setKanaTypes(toggle(kanaTypes, t.value))}
                  className={`w-full text-left px-4 py-2.5 rounded-xl border transition-all ${
                    kanaTypes.includes(t.value)
                      ? "bg-violet-600 border-violet-500 text-white"
                      : "bg-slate-700 border-slate-600 text-slate-300 hover:border-violet-500"
                  }`}
                >
                  <span className="font-semibold">{t.label}</span>
                  <span className="text-xs opacity-70 ml-2">{t.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Kana preview button ── */}
      {mode === "kana" && (() => {
        const kanaWords = getKanaWords(kanaScripts, kanaTypes);
        return (
          <button
            onClick={() => setShowKana(true)}
            className="w-full py-2.5 rounded-xl text-sm font-semibold border border-slate-600 bg-slate-700 text-slate-300 hover:border-violet-500 hover:text-violet-300 transition-all"
          >
            あ Ver kana ({kanaWords.length} caracteres)
          </button>
        );
      })()}

      {/* Direction */}
      <div className="card p-5 space-y-3">
        <h2 className="font-semibold text-slate-300">🔄 Dirección</h2>
        <div className="space-y-2">
          {directions.map((d) => (
            <button
              key={d.value}
              onClick={() => setDirection(d.value)}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm border transition-all ${
                direction === d.value
                  ? "bg-violet-600 border-violet-500 text-white"
                  : "bg-slate-700 border-slate-600 text-slate-300 hover:border-violet-500"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <div className="card p-5 space-y-3">
        <h2 className="font-semibold text-slate-300">🔢 Cantidad</h2>
        <div className="flex gap-2">
          {COUNTS.map((c) => (
            <button
              key={c.value}
              onClick={() => setCount(c.value)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                count === c.value
                  ? "bg-violet-600 border-violet-500 text-white"
                  : "bg-slate-700 border-slate-600 text-slate-300 hover:border-violet-500"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <button onClick={handleStart} className="btn-primary w-full text-lg py-4">
        ¡Empezar!
      </button>

      {/* Vocabulary modal */}
      {showVocab &&
        (() => {
          const modalWords = getWords({
            lessons: selectedLessons,
            wordTypes: wordType === "all" ? "all" : [wordType],
          });
          return (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
              onClick={() => setShowVocab(false)}
            >
              <div
                className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-700">
                  <h2 className="font-bold text-slate-100 text-lg">
                    📖 Vocabulario — {modalWords.length} palabras
                  </h2>
                  <button
                    onClick={() => setShowVocab(false)}
                    className="text-slate-400 hover:text-white text-2xl leading-none transition-colors"
                  >
                    ✕
                  </button>
                </div>

                {/* Word table */}
                <div className="overflow-y-auto flex-1">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-slate-900">
                      <tr className="text-slate-400 text-xs uppercase tracking-wide">
                        <th className="text-left p-3">Kanji</th>
                        <th className="text-left p-3">Hiragana</th>
                        <th className="text-left p-3 hidden sm:table-cell">
                          Rōmaji
                        </th>
                        <th className="text-left p-3">Español</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modalWords.map((w, i) => (
                        <tr
                          key={w.id}
                          className={`border-t border-slate-700/50 ${i % 2 === 0 ? "bg-slate-800" : "bg-slate-800/50"}`}
                        >
                          <td className="p-3 font-medium text-white">
                            {w.japanese}
                          </td>
                          <td className="p-3 text-violet-300">{w.hiragana}</td>
                          <td className="p-3 text-slate-400 hidden sm:table-cell">
                            {w.romaji}
                          </td>
                          <td className="p-3 text-slate-300">{w.spanish}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}

      {/* Kana modal */}
      {showKana && (() => {
        const kanaWords = getKanaWords(kanaScripts, kanaTypes);
        const scriptLabel = kanaScripts.map((s) => s === "hiragana" ? "Hiragana" : "Katakana").join(" + ");
        const typeLabel = kanaTypes.map((t) => t === "seion" ? "Seion" : t === "dakuon" ? "Dakuon" : "Youon").join(" + ");
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowKana(false)}
          >
            <div
              className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-700">
                <div>
                  <h2 className="font-bold text-slate-100 text-lg">
                    あ {scriptLabel} — {kanaWords.length} caracteres
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">{typeLabel}</p>
                </div>
                <button
                  onClick={() => setShowKana(false)}
                  className="text-slate-400 hover:text-white text-2xl leading-none transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="overflow-y-auto flex-1 p-4">
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {kanaWords.map((w) => (
                    <div
                      key={w.id}
                      className="bg-slate-700 rounded-xl p-3 text-center border border-slate-600"
                    >
                      <div className="text-2xl font-medium text-white mb-1">{w.japanese}</div>
                      <div className="text-xs text-violet-300">{w.romaji}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

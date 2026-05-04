import { useCallback, useState } from "react";
import {
  getNumberWords,
  NUMBER_RANGES,
  type NumberWord,
} from "../../data/numbers";
import {
  ALL_COUNTERS,
  COUNTER_CATEGORIES,
  type CounterEntry,
} from "../../data/counters/index";
import { shuffle } from "../../data/vocab";
import { speak } from "../../utils/tts";

// ── Shared types ──────────────────────────────────────────────────────────────

interface NumOption {
  japanese: string;
  romaji: string;
}

interface NumberQuestion {
  kind: "number";
  word: NumberWord;
  options: NumOption[];
  answer: string;
}

interface CounterQuestion {
  kind: "counter";
  entry: CounterEntry;
  options: NumOption[];
  answer: string;
}

type Question = NumberQuestion | CounterQuestion;

// ── Question builders ─────────────────────────────────────────────────────────

function buildNumberQuestions(words: NumberWord[]): Question[] {
  return words.map((w) => {
    const others = shuffle(words.filter((x) => x.value !== w.value))
      .slice(0, 3)
      .map((x) => ({ japanese: x.hiragana, romaji: x.romaji }));
    return {
      kind: "number",
      word: w,
      options: shuffle([{ japanese: w.hiragana, romaji: w.romaji }, ...others]),
      answer: w.hiragana,
    };
  });
}

function buildCounterQuestions(entries: CounterEntry[]): Question[] {
  return entries.map((e) => {
    const others = shuffle(entries.filter((x) => x.id !== e.id))
      .slice(0, 3)
      .map((x) => ({ japanese: x.hiragana, romaji: x.romaji }));
    return {
      kind: "counter",
      entry: e,
      options: shuffle([{ japanese: e.hiragana, romaji: e.romaji }, ...others]),
      answer: e.hiragana,
    };
  });
}

// ── Results ───────────────────────────────────────────────────────────────────

function ResultScreen({
  score,
  total,
  onRestart,
  onHome,
}: {
  score: number;
  total: number;
  onRestart: () => void;
  onHome: () => void;
}) {
  const pct = Math.round((score / total) * 100);
  const emoji = pct === 100 ? "🏆" : pct >= 70 ? "⭐" : pct >= 40 ? "👍" : "📚";
  return (
    <div className="game-container flex flex-col items-center justify-center gap-6 text-center">
      <div className="text-7xl">{emoji}</div>
      <div>
        <p className="text-3xl font-bold">
          {score} / {total}
        </p>
        <p className="text-slate-400 mt-1">{pct}% correcto</p>
      </div>
      <div className="flex gap-3 w-full">
        <button onClick={onHome} className="flex-1 btn-secondary py-3">
          Inicio
        </button>
        <button onClick={onRestart} className="flex-1 btn-primary py-3">
          Reintentar
        </button>
      </div>
    </div>
  );
}

// ── Lobby ─────────────────────────────────────────────────────────────────────

type GameMode = "numbers" | "counters";

interface NumbersConfig {
  mode: "numbers";
  min: number;
  max: number;
  count: number;
}

interface CountersConfig {
  mode: "counters";
  counters: string[]; // selected counter kanji, [] = all
  irregularOnly: boolean;
  count: number;
  showHiragana: boolean;
  showRomaji: boolean;
}

type Config = NumbersConfig | CountersConfig;

const COUNTS = [
  { value: 0, label: "Todos" },
  { value: 20, label: "20" },
  { value: 10, label: "10" },
];

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

function Lobby({ onStart }: { onStart: (cfg: Config) => void }) {
  const [gameMode, setGameMode] = useState<GameMode>("numbers");

  // Numbers state
  const [rangeIdx, setRangeIdx] = useState(1);

  // Counters state
  const [selectedCounters, setSelectedCounters] = useState<string[]>([]);
  const [irregularOnly, setIrregularOnly] = useState(false);
  const [showHiragana, setShowHiragana] = useState(true);
  const [showRomaji, setShowRomaji] = useState(false);

  const [count, setCount] = useState(0);

  function toggleCounter(kanji: string) {
    setSelectedCounters((prev) =>
      prev.includes(kanji) ? prev.filter((c) => c !== kanji) : [...prev, kanji]
    );
  }

  const handleStart = () => {
    if (gameMode === "numbers") {
      const r = NUMBER_RANGES[rangeIdx];
      onStart({ mode: "numbers", min: r.min, max: r.max, count });
    } else {
      onStart({ mode: "counters", counters: selectedCounters, irregularOnly, count, showHiragana, showRomaji });
    }
  };

  return (
    <div className="game-container space-y-6">
      <div className="bg-teal-500 rounded-2xl p-6 text-white text-center shadow-xl">
        <div className="text-5xl mb-2">🔢</div>
        <h1 className="text-2xl font-bold">Números en Japonés</h1>
      </div>

      {/* Mode toggle */}
      <div className="card p-1 flex gap-1">
        {(["numbers", "counters"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setGameMode(m)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              gameMode === m
                ? "bg-violet-600 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {m === "numbers" ? "🔢 Números" : "🧮 Contadores"}
          </button>
        ))}
      </div>

      {gameMode === "numbers" && (
        <div className="card p-5 space-y-3">
          <h2 className="font-semibold text-slate-300">📊 Rango de números</h2>
          <div className="space-y-2">
            {NUMBER_RANGES.map((r, i) => (
              <button
                key={i}
                onClick={() => setRangeIdx(i)}
                className={`w-full text-left px-4 py-2.5 rounded-xl border transition-all ${
                  rangeIdx === i
                    ? "bg-violet-600 border-violet-500 text-white"
                    : "bg-slate-700 border-slate-600 text-slate-300 hover:border-violet-500"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {gameMode === "counters" && (
        <>
          <div className="card p-5 space-y-3">
            <h2 className="font-semibold text-slate-300">🧮 Tipo de contador</h2>
            <p className="text-xs text-slate-500">Sin selección = todos los contadores</p>
            <div className="flex flex-wrap gap-2">
              {COUNTER_CATEGORIES.map((cat) => (
                <button
                  key={cat.counter}
                  onClick={() => toggleCounter(cat.counter)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                    selectedCounters.includes(cat.counter)
                      ? "bg-violet-600 border-violet-500 text-white"
                      : "bg-slate-700 border-slate-600 text-slate-300 hover:border-violet-500"
                  }`}
                >
                  {cat.emoji} {cat.counter}
                  <span className="text-xs ml-1 opacity-70">〜{cat.category}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="card p-5 space-y-3">
            <h2 className="font-semibold text-slate-300">⚡ Filtro</h2>
            <div className="flex gap-2">
              <ChipBtn active={!irregularOnly} onClick={() => setIrregularOnly(false)}>
                Todos
              </ChipBtn>
              <ChipBtn active={irregularOnly} onClick={() => setIrregularOnly(true)}>
                Solo irregulares
              </ChipBtn>
            </div>
          </div>

          {/* Counter list */}
          {(() => {
            const filtered = (selectedCounters.length
              ? ALL_COUNTERS.filter((e) => selectedCounters.includes(e.counter))
              : [...ALL_COUNTERS]
            ).filter((e) => !irregularOnly || e.irregular);
            return filtered.length > 0 ? (
              <details className="text-xs text-slate-500">
                <summary className="cursor-pointer hover:text-slate-400 transition-colors">
                  📋 Ver contadores ({filtered.length})
                </summary>
                <div className="mt-2 bg-slate-800 rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-slate-500 border-b border-slate-700">
                        <th className="text-left px-3 py-2">Japonés</th>
                        <th className="text-left px-3 py-2">Hiragana</th>
                        <th className="text-left px-3 py-2">Romaji</th>
                        <th className="text-left px-3 py-2">Categoría</th>
                        <th className="text-left px-3 py-2">⚡</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((e) => (
                        <tr key={e.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                          <td className="px-3 py-1.5 text-white font-medium">{e.japanese}</td>
                          <td className="px-3 py-1.5 text-teal-300">{e.hiragana}</td>
                          <td className="px-3 py-1.5 text-slate-400">{e.romaji}</td>
                          <td className="px-3 py-1.5 text-slate-400">{e.categoryEmoji} {e.category}</td>
                          <td className="px-3 py-1.5 text-amber-400">{e.irregular ? "⚡" : ""}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            ) : null;
          })()}
        </>
      )}

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

      {/* Display toggles — only relevant for counters mode */}
      {gameMode === "counters" && (
        <div className="card p-5 space-y-3">
          <h2 className="font-semibold text-slate-300">👁 Mostrar en la pregunta</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setShowHiragana((v) => !v)}
              className={`py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                showHiragana
                  ? "bg-violet-600 border-violet-500 text-white"
                  : "bg-slate-700 border-slate-600 text-slate-400 hover:border-violet-500"
              }`}
            >
              {showHiragana ? "✓ " : ""}Hiragana
            </button>
            <button
              onClick={() => setShowRomaji((v) => !v)}
              className={`py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                showRomaji
                  ? "bg-violet-600 border-violet-500 text-white"
                  : "bg-slate-700 border-slate-600 text-slate-400 hover:border-violet-500"
              }`}
            >
              {showRomaji ? "✓ " : ""}Romaji
            </button>
          </div>
        </div>
      )}

      <button onClick={handleStart} className="btn-primary w-full text-lg py-4">
        ¡Empezar!
      </button>
    </div>
  );
}

// ── Main game ─────────────────────────────────────────────────────────────────

export default function Numbers() {
  const [config, setConfig] = useState<Config | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const advance = useCallback(() => {
    setIndex((i) => {
      const next = i + 1;
      if (next >= questions.length) {
        setDone(true);
        return i;
      }
      setChosen(null);
      return next;
    });
  }, [questions.length]);

  const start = useCallback(
    (cfg: Config) => {
      let qs: Question[];
      if (cfg.mode === "numbers") {
        let words = shuffle(getNumberWords(cfg.min, cfg.max));
        if (cfg.count > 0) words = words.slice(0, cfg.count);
        qs = buildNumberQuestions(words);
      } else {
        let entries = cfg.counters.length
          ? ALL_COUNTERS.filter((e) => cfg.counters.includes(e.counter))
          : [...ALL_COUNTERS];
        if (cfg.irregularOnly) entries = entries.filter((e) => e.irregular);
        entries = shuffle(entries);
        if (cfg.count > 0) entries = entries.slice(0, cfg.count);
        qs = buildCounterQuestions(entries);
      }
      setConfig(cfg);
      setQuestions(qs);
      setIndex(0);
      setScore(0);
      setChosen(null);
      setDone(false);
    },
    [],
  );

  const pick = (opt: string) => {
    if (chosen) return;
    const correct = opt === questions[index].answer;
    setChosen(opt);
    if (correct) setScore((s) => s + 1);
    setTimeout(advance, 1200);
  };

  if (!config) return <Lobby onStart={start} />;

  if (done)
    return (
      <ResultScreen
        score={score}
        total={questions.length}
        onRestart={() => start(config)}
        onHome={() => setConfig(null)}
      />
    );

  const q = questions[index];

  return (
    <div className="game-container space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between text-sm text-slate-400">
        <span>
          {index + 1} / {questions.length}
        </span>
        <span className="font-bold text-white">{score} pts</span>
        <button
          onClick={() => setConfig(null)}
          className="hover:text-rose-400 transition-colors"
        >
          ✕ Salir
        </button>
      </div>

      {/* Question card */}
      <div className="card p-8 text-center flex flex-col items-center gap-2">
        {q.kind === "number" ? (
          <>
            <p className="text-slate-400 text-sm">¿Cómo se lee este número?</p>
            <p className="text-6xl sm:text-7xl font-bold tracking-wide jp">
              {q.word.value}
            </p>
          </>
        ) : (
          <>
            <p className="text-slate-400 text-sm">
              ¿Cómo se lee este contador?
              <span className="ml-2">{q.entry.categoryEmoji}</span>
            </p>
            <p className="text-5xl sm:text-6xl font-bold tracking-wide jp">
              {q.entry.japanese}
            </p>
            {config.mode === "counters" && config.showHiragana && (
              <p className="text-lg text-teal-300 jp">{q.entry.hiragana}</p>
            )}
            {config.mode === "counters" && config.showRomaji && (
              <p className="text-slate-400 text-sm italic">{q.entry.romaji}</p>
            )}
            <p className="text-slate-500 text-xs mt-1">{q.entry.category}</p>
            <button
              onClick={() => speak(q.entry.japanese)}
              className="mt-2 p-2 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors"
              title="Escuchar pronunciación"
            >
              🔊
            </button>
          </>
        )}
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-3">
        {q.options.map((opt, i) => {
          let cls =
            "w-full p-4 rounded-2xl border text-base font-semibold transition-all text-center jp flex flex-col items-center gap-0.5";
          if (!chosen) {
            cls +=
              " bg-slate-700 border-slate-600 hover:border-violet-500 hover:bg-slate-600 cursor-pointer";
          } else if (opt.japanese === q.answer) {
            cls += " bg-emerald-600 border-emerald-500 text-white";
          } else if (opt.japanese === chosen) {
            cls += " bg-rose-600 border-rose-500 text-white";
          } else {
            cls += " bg-slate-800 border-slate-700 text-slate-500";
          }
          const showRomaji = config.mode === "counters" && (config as CountersConfig).showRomaji;
          return (
            <button key={i} className={cls} onClick={() => pick(opt.japanese)}>
              <span>{opt.japanese}</span>
              {showRomaji && (
                <span className="text-xs font-normal opacity-70">{opt.romaji}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Reveal after answer */}
      {chosen && (
        <div className="card p-4 text-center space-y-1">
          {q.kind === "number" ? (
            <>
              <p className="jp text-2xl font-bold text-emerald-400">{q.word.hiragana}</p>
              <p className="text-slate-400 text-sm italic">{q.word.romaji}</p>
              <button
                onClick={() => speak(q.word.hiragana)}
                className="mt-1 p-2 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors"
              >
                🔊
              </button>
            </>
          ) : (
            <>
              <p className="jp text-2xl font-bold text-emerald-400">{q.entry.hiragana}</p>
              <p className="text-slate-400 text-sm italic">{q.entry.romaji}</p>
              {q.entry.irregular && (
                <p className="text-amber-400 text-xs">⚡ irregular</p>
              )}
              <button
                onClick={() => speak(q.entry.hiragana)}
                className="mt-1 p-2 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors"
              >
                🔊
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}


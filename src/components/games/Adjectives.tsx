import { useCallback, useEffect, useRef, useState } from "react";
import { speak } from "../../utils/tts";
import { shuffle } from "../../data/vocab";
import {
  getAdjsByLevels,
  ADJ_FORM_LABELS,
  ADJ_LEVELS,
  type ConjugationAdj,
  type AdjForm,
  type AdjLevel,
} from "../../data/adjectives/index";

const SECONDS = 10;

const ALL_FORMS: AdjForm[] = [
  "negative",
  "past",
  "negativePast",
  "te",
  "adverb",
];

// ── Types ─────────────────────────────────────────────────────────────────────

interface AdjQuestion {
  adj: ConjugationAdj;
  targetForm: AdjForm;
  answer: string;
  options: string[];
}

// ── Question builder ──────────────────────────────────────────────────────────

function buildQuestions(
  adjs: ConjugationAdj[],
  forms: AdjForm[],
): AdjQuestion[] {
  const questions: AdjQuestion[] = [];

  for (const adj of adjs) {
    for (const form of forms) {
      const answer = adj[form];
      const otherAnswers = shuffle(
        adjs
          .filter((a) => a.id !== adj.id && a[form] !== answer)
          .map((a) => a[form]),
      ).slice(0, 3);

      questions.push({
        adj,
        targetForm: form,
        answer,
        options: shuffle([answer, ...otherAnswers]),
      });
    }
  }

  return shuffle(questions);
}

// ── Lobby ─────────────────────────────────────────────────────────────────────

function Lobby({
  onStart,
}: {
  onStart: (levels: AdjLevel[], forms: AdjForm[]) => void;
}) {
  function levelsFromParams(): AdjLevel[] {
    if (typeof window === "undefined") return ["N5"];
    const raw = new URLSearchParams(window.location.search).get("level");
    if (!raw) return ["N5"];
    const valid = ADJ_LEVELS.map((l) => l.value);
    const parsed = raw.split(",").filter((v) => valid.includes(v as AdjLevel)) as AdjLevel[];
    return parsed.length > 0 ? parsed : ["N5"];
  }

  function formsFromParams(): AdjForm[] {
    if (typeof window === "undefined") return ALL_FORMS;
    const raw = new URLSearchParams(window.location.search).get("form");
    if (!raw) return ALL_FORMS;
    const parsed = raw.split(",").filter((v) => ALL_FORMS.includes(v as AdjForm)) as AdjForm[];
    return parsed.length > 0 ? parsed : ALL_FORMS;
  }

  const [selectedLevels, setSelectedLevels] = useState<AdjLevel[]>(levelsFromParams);
  const [selectedForms, setSelectedForms] = useState<AdjForm[]>(formsFromParams);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("level", selectedLevels.join(","));
    params.set("form", selectedForms.join(","));
    window.history.replaceState(null, "", `?${params.toString()}`);
  }, [selectedLevels, selectedForms]);

  function toggleLevel(l: AdjLevel) {
    setSelectedLevels((prev) =>
      prev.includes(l)
        ? prev.length > 1
          ? prev.filter((x) => x !== l)
          : prev
        : [...prev, l],
    );
  }

  function toggleForm(f: AdjForm) {
    setSelectedForms((prev) =>
      prev.includes(f)
        ? prev.length > 1
          ? prev.filter((x) => x !== f)
          : prev
        : [...prev, f],
    );
  }

  const adjCount = getAdjsByLevels(selectedLevels).length;
  const questionCount = adjCount * selectedForms.length;

  return (
    <div className="game-container space-y-6">
      {/* Header */}
      <div className="bg-pink-500 rounded-2xl p-6 text-white text-center shadow-xl">
        <div className="text-5xl mb-2">🎨</div>
        <h1 className="text-2xl font-bold">Adjetivos</h1>
        <p className="text-pink-100 text-sm mt-1">
          Practica las formas de adjetivos い y な
        </p>
      </div>

      {/* Level selector */}
      <div className="card p-5 space-y-3">
        <h2 className="font-semibold text-slate-300">🎓 Nivel JLPT</h2>
        <div className="flex flex-wrap gap-2">
          {ADJ_LEVELS.map((l) => {
            const active = selectedLevels.includes(l.value);
            const hasAdjs = l.count > 0;
            return (
              <button
                key={l.value}
                onClick={() => hasAdjs && toggleLevel(l.value)}
                disabled={!hasAdjs}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                  !hasAdjs
                    ? "bg-slate-800 border-slate-700 text-slate-600 cursor-not-allowed"
                    : active
                      ? "bg-pink-600 border-pink-500 text-white"
                      : "bg-slate-700 border-slate-600 text-slate-300 hover:border-pink-500"
                }`}
              >
                {l.label}
                <span className="ml-1.5 text-xs opacity-70">
                  {hasAdjs ? `(${l.count})` : "pronto"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Form selector */}
      <div className="card p-5 space-y-3">
        <h2 className="font-semibold text-slate-300">📝 Formas a practicar</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedForms(ALL_FORMS)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
              selectedForms.length === ALL_FORMS.length
                ? "bg-pink-600 border-pink-500 text-white"
                : "bg-slate-700 border-slate-600 text-slate-300 hover:border-pink-500"
            }`}
          >
            Todas
          </button>
          {ALL_FORMS.map((f) => (
            <button
              key={f}
              onClick={() => toggleForm(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                selectedForms.includes(f)
                  ? "bg-pink-600 border-pink-500 text-white"
                  : "bg-slate-700 border-slate-600 text-slate-300 hover:border-pink-500"
              }`}
            >
              {ADJ_FORM_LABELS[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="text-center text-slate-400 text-sm">
        {adjCount === 0 ? (
          <span className="text-amber-400">
            No hay adjetivos disponibles para el nivel seleccionado.
          </span>
        ) : (
          <span>
            {adjCount} adjetivos × {selectedForms.length} forma(s) ={" "}
            <strong className="text-slate-200">{questionCount} preguntas</strong>
          </span>
        )}
      </div>

      <button
        onClick={() => onStart(selectedLevels, selectedForms)}
        disabled={adjCount === 0}
        className="btn-primary w-full text-lg py-4 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        ¡Empezar!
      </button>

      {/* Form reference */}
      <details className="text-xs text-slate-500">
        <summary className="cursor-pointer hover:text-slate-400 transition-colors">
          ¿Qué es cada forma?
        </summary>
        <div className="mt-2 bg-slate-800 rounded-lg p-3 space-y-2 text-slate-400">
          <div>
            <p className="text-slate-300 font-semibold mb-1">Adjetivos い</p>
            <p><strong className="text-slate-300">negativo</strong> — 大きい → 大きくない</p>
            <p><strong className="text-slate-300">pasado</strong> — 大きい → 大きかった</p>
            <p><strong className="text-slate-300">neg. pasado</strong> — 大きい → 大きくなかった</p>
            <p><strong className="text-slate-300">て形</strong> — 大きい → 大きくて</p>
            <p><strong className="text-slate-300">adverbio</strong> — 大きい → 大きく</p>
          </div>
          <div>
            <p className="text-slate-300 font-semibold mb-1">Adjetivos な</p>
            <p><strong className="text-slate-300">negativo</strong> — きれい → きれいじゃない</p>
            <p><strong className="text-slate-300">pasado</strong> — きれい → きれいだった</p>
            <p><strong className="text-slate-300">neg. pasado</strong> — きれい → きれいじゃなかった</p>
            <p><strong className="text-slate-300">て形</strong> — きれい → きれいで</p>
            <p><strong className="text-slate-300">adverbio</strong> — きれい → きれいに</p>
          </div>
        </div>
      </details>
    </div>
  );
}

// ── Result screen ─────────────────────────────────────────────────────────────

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
  const emoji =
    pct === 100 ? "🏆" : pct >= 70 ? "⭐" : pct >= 40 ? "👍" : "📚";

  return (
    <div className="game-container space-y-6 text-center">
      <div className="card p-8 space-y-4">
        <div className="text-6xl">{emoji}</div>
        <h2 className="text-2xl font-bold text-white">
          {score} / {total}
        </h2>
        <p className="text-4xl font-bold text-pink-400">{pct}%</p>
        <p className="text-slate-400">
          {pct === 100
            ? "¡Perfecto! 素晴らしい！"
            : pct >= 70
              ? "¡Muy bien! もう少し頑張って！"
              : pct >= 40
                ? "Sigue practicando 練習あるのみ！"
                : "¡No te rindas! 諦めないで！"}
        </p>
      </div>
      <div className="flex gap-3">
        <button onClick={onHome} className="flex-1 btn-secondary py-3">
          ← Volver
        </button>
        <button onClick={onRestart} className="flex-1 btn-primary py-3">
          Reintentar
        </button>
      </div>
    </div>
  );
}

// ── Main game ─────────────────────────────────────────────────────────────────

export default function Adjectives() {
  const [screen, setScreen] = useState<"lobby" | "game" | "results">("lobby");
  const [questions, setQuestions] = useState<AdjQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(SECONDS);
  const [savedLevels, setSavedLevels] = useState<AdjLevel[]>(["N5"]);
  const [savedForms, setSavedForms] = useState<AdjForm[]>(ALL_FORMS);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const current = questions[currentIdx];

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const goNext = useCallback(() => {
    stopTimer();
    setTimeout(() => {
      if (currentIdx + 1 >= questions.length) {
        setScreen("results");
      } else {
        setCurrentIdx((i) => i + 1);
        setSelected(null);
        setTimeLeft(SECONDS);
      }
    }, 900);
  }, [currentIdx, questions.length, stopTimer]);

  useEffect(() => {
    if (screen !== "game" || selected !== null) return;
    setTimeLeft(SECONDS);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          stopTimer();
          setSelected("__timeout__");
          setTimeout(() => {
            if (currentIdx + 1 >= questions.length) {
              setScreen("results");
            } else {
              setCurrentIdx((i) => i + 1);
              setSelected(null);
              setTimeLeft(SECONDS);
            }
          }, 900);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return stopTimer;
  }, [screen, currentIdx, selected, questions.length, stopTimer]);

  function handleStart(levels: AdjLevel[], forms: AdjForm[]) {
    setSavedLevels(levels);
    setSavedForms(forms);
    const adjs = getAdjsByLevels(levels);
    const qs = buildQuestions(adjs, forms);
    setQuestions(qs);
    setCurrentIdx(0);
    setScore(0);
    setSelected(null);
    setTimeLeft(SECONDS);
    setScreen("game");
  }

  function handleAnswer(opt: string) {
    if (selected !== null) return;
    stopTimer();
    setSelected(opt);
    if (opt === current.answer) setScore((s) => s + 1);
    goNext();
  }

  function handleRestart() {
    handleStart(savedLevels, savedForms);
  }

  if (screen === "lobby") {
    return <Lobby onStart={handleStart} />;
  }

  if (screen === "results") {
    return (
      <ResultScreen
        score={score}
        total={questions.length}
        onRestart={handleRestart}
        onHome={() => setScreen("lobby")}
      />
    );
  }

  if (!current) return null;

  const timerPct = (timeLeft / SECONDS) * 100;
  const timerColor =
    timeLeft > 6 ? "bg-pink-500" : timeLeft > 3 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="game-container space-y-4">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm text-slate-400">
        <span>
          {currentIdx + 1} / {questions.length}
        </span>
        <span className="font-semibold text-white">{score} ✓</span>
      </div>

      {/* Timer bar */}
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${timerColor}`}
          style={{ width: `${timerPct}%` }}
        />
      </div>

      {/* Question card */}
      <div className="card p-6 text-center space-y-3">
        <p className="text-xs text-slate-500 uppercase tracking-widest">
          ¿Cuál es la forma{" "}
          <strong className="text-pink-400">
            {ADJ_FORM_LABELS[current.targetForm]}
          </strong>
          ?
        </p>
        <div className="text-3xl font-bold text-white">
          {current.adj.dictionary}
        </div>
        <div className="flex items-center justify-center gap-2">
          <div className="text-lg text-pink-300">{current.adj.hiragana}</div>
          <button
            onClick={() => speak(current.adj.hiragana)}
            className="w-7 h-7 rounded-full bg-slate-700 hover:bg-sky-600 text-slate-300 hover:text-white flex items-center justify-center transition-all active:scale-90 text-sm"
            title="Escuchar pronunciación"
          >
            🔊
          </button>
        </div>
        <div className="text-slate-400 text-sm">{current.adj.spanish}</div>
        <div className="text-slate-600 text-xs">
          Adjetivo {current.adj.type === "i" ? "い" : "な"}
        </div>
      </div>

      {/* Timer label */}
      <div className="text-center">
        <span
          className={`text-2xl font-bold tabular-nums ${
            timeLeft <= 3 ? "text-red-400" : "text-slate-400"
          }`}
        >
          {timeLeft}
        </span>
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-3">
        {current.options.map((opt) => {
          let style =
            "bg-slate-700 border-slate-600 text-white hover:border-pink-500";
          if (selected !== null) {
            if (opt === current.answer) {
              style = "bg-emerald-700 border-emerald-500 text-white";
            } else if (opt === selected) {
              style = "bg-red-800 border-red-600 text-white";
            } else {
              style = "bg-slate-800 border-slate-700 text-slate-500";
            }
          }
          return (
            <button
              key={opt}
              onClick={() => handleAnswer(opt)}
              disabled={selected !== null}
              className={`py-4 px-3 rounded-xl border-2 text-base font-medium transition-all ${style}`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

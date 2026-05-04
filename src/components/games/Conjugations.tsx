import { useCallback, useEffect, useState } from "react";
import { speak } from "../../utils/tts";
import { shuffle } from "../../data/vocab";
import {
  getVerbsByLevels,
  VERB_FORM_LABELS,
  VERB_FORM_ROMAJI,
  VERB_LEVELS,
  type ConjugationVerb,
  type VerbForm,
  type VerbLevel,
} from "../../data/verbs/index";

const ALL_FORMS: VerbForm[] = ["masu", "nai", "te", "ta", "tara", "teiru"];

// ── Types ─────────────────────────────────────────────────────────────────────

interface ConjOption {
  japanese: string;
  romaji: string;
}

interface ConjugationQuestion {
  verb: ConjugationVerb;
  targetForm: VerbForm;
  answer: string;
  answerRomaji: string;
  options: ConjOption[];
}

// ── Question builder ──────────────────────────────────────────────────────────

function buildQuestions(
  verbs: ConjugationVerb[],
  forms: VerbForm[],
): ConjugationQuestion[] {
  const questions: ConjugationQuestion[] = [];

  for (const verb of verbs) {
    for (const form of forms) {
      const answer = verb[form];
      const answerRomaji = verb[`${form}Romaji` as keyof ConjugationVerb] as string;

      // Wrong answers: other forms of the SAME verb
      const otherForms = ALL_FORMS.filter((f) => f !== form && verb[f] !== answer);
      const wrongFromSameVerb: ConjOption[] = shuffle(
        otherForms.map((f) => ({
          japanese: verb[f],
          romaji: verb[`${f}Romaji` as keyof ConjugationVerb] as string,
        }))
      ).slice(0, 3);

      // Fallback: if fewer than 3 other forms, fill from other verbs (same form)
      const needed = 3 - wrongFromSameVerb.length;
      const fallback: ConjOption[] =
        needed > 0
          ? shuffle(
              verbs
                .filter((v) => v.id !== verb.id && v[form] !== answer)
                .map((v) => ({
                  japanese: v[form],
                  romaji: v[`${form}Romaji` as keyof ConjugationVerb] as string,
                })),
            ).slice(0, needed)
          : [];

      questions.push({
        verb,
        targetForm: form,
        answer,
        answerRomaji,
        options: shuffle([{ japanese: answer, romaji: answerRomaji }, ...wrongFromSameVerb, ...fallback]),
      });
    }
  }

  return shuffle(questions);
}

// ── Lobby ─────────────────────────────────────────────────────────────────────

function Lobby({
  onStart,
}: {
  onStart: (levels: VerbLevel[], forms: VerbForm[], showHiragana: boolean, showRomaji: boolean) => void;
}) {
  function levelsFromParams(): VerbLevel[] {
    if (typeof window === "undefined") return ["N5"];
    const raw = new URLSearchParams(window.location.search).get("level");
    if (!raw) return ["N5"];
    const valid = VERB_LEVELS.map((l) => l.value);
    const parsed = raw.split(",").filter((v) => valid.includes(v as VerbLevel)) as VerbLevel[];
    return parsed.length > 0 ? parsed : ["N5"];
  }

  function formsFromParams(): VerbForm[] {
    if (typeof window === "undefined") return ALL_FORMS;
    const raw = new URLSearchParams(window.location.search).get("form");
    if (!raw) return ALL_FORMS;
    const parsed = raw.split(",").filter((v) => ALL_FORMS.includes(v as VerbForm)) as VerbForm[];
    return parsed.length > 0 ? parsed : ALL_FORMS;
  }

  const [selectedLevels, setSelectedLevels] = useState<VerbLevel[]>(levelsFromParams);
  const [selectedForms, setSelectedForms] = useState<VerbForm[]>(formsFromParams);
  const [showHiragana, setShowHiragana] = useState(true);
  const [showRomaji, setShowRomaji] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("level", selectedLevels.join(","));
    params.set("form", selectedForms.join(","));
    window.history.replaceState(null, "", `?${params.toString()}`);
  }, [selectedLevels, selectedForms]);

  function toggleLevel(l: VerbLevel) {
    setSelectedLevels((prev) =>
      prev.includes(l)
        ? prev.length > 1
          ? prev.filter((x) => x !== l)
          : prev
        : [...prev, l],
    );
  }

  function toggleForm(f: VerbForm) {
    setSelectedForms((prev) =>
      prev.includes(f)
        ? prev.length > 1
          ? prev.filter((x) => x !== f)
          : prev
        : [...prev, f],
    );
  }

  const verbCount = getVerbsByLevels(selectedLevels).length;
  const questionCount = verbCount * selectedForms.length;

  return (
    <div className="game-container space-y-6">
      {/* Header */}
      <div className="bg-indigo-500 rounded-2xl p-6 text-white text-center shadow-xl">
        <div className="text-5xl mb-2">🔤</div>
        <h1 className="text-2xl font-bold">Conjugaciones</h1>
        <p className="text-indigo-100 text-sm mt-1">
          Practica las formas verbales del japonés
        </p>
      </div>

      {/* Level selector */}
      <div className="card p-5 space-y-3">
        <h2 className="font-semibold text-slate-300">🎓 Nivel JLPT</h2>
        <div className="flex flex-wrap gap-2">
          {VERB_LEVELS.map((l) => {
            const active = selectedLevels.includes(l.value);
            const hasVerbs = l.count > 0;
            return (
              <button
                key={l.value}
                onClick={() => hasVerbs && toggleLevel(l.value)}
                disabled={!hasVerbs}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                  !hasVerbs
                    ? "bg-slate-800 border-slate-700 text-slate-600 cursor-not-allowed"
                    : active
                      ? "bg-indigo-600 border-indigo-500 text-white"
                      : "bg-slate-700 border-slate-600 text-slate-300 hover:border-indigo-500"
                }`}
              >
                {l.label}
                <span className="ml-1.5 text-xs opacity-70">
                  {hasVerbs ? `(${l.count})` : "pronto"}
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
                ? "bg-indigo-600 border-indigo-500 text-white"
                : "bg-slate-700 border-slate-600 text-slate-300 hover:border-indigo-500"
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
                  ? "bg-indigo-600 border-indigo-500 text-white"
                  : "bg-slate-700 border-slate-600 text-slate-300 hover:border-indigo-500"
              }`}
            >
              {VERB_FORM_LABELS[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="text-center text-slate-400 text-sm">
        {verbCount === 0 ? (
          <span className="text-amber-400">
            No hay verbos disponibles para el nivel seleccionado.
          </span>
        ) : (
          <span>
            {verbCount} verbos × {selectedForms.length} forma(s) ={" "}
            <strong className="text-slate-200">{questionCount} preguntas</strong>
          </span>
        )}
      </div>

      {/* Display toggles */}
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

      <button
        onClick={() => onStart(selectedLevels, selectedForms, showHiragana, showRomaji)}
        disabled={verbCount === 0}
        className="btn-primary w-full text-lg py-4 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        ¡Empezar!
      </button>

      {/* Form reference */}
      <details className="text-xs text-slate-500">
        <summary className="cursor-pointer hover:text-slate-400 transition-colors">
          ¿Qué es cada forma?
        </summary>
        <div className="mt-2 bg-slate-800 rounded-lg p-3 space-y-1.5 text-slate-400">
          <p><strong className="text-slate-300">ます</strong> — forma cortés presente/futuro</p>
          <p><strong className="text-slate-300">ない</strong> — forma negativa llana</p>
          <p><strong className="text-slate-300">て</strong> — forma te (conexión, peticiones…)</p>
          <p><strong className="text-slate-300">た</strong> — forma pasada llana</p>
          <p><strong className="text-slate-300">たら</strong> — forma condicional (si/cuando…)</p>
          <p><strong className="text-slate-300">ています</strong> — forma progresiva cortés</p>
        </div>
      </details>

      {/* Verb list */}
      {verbCount > 0 && (
        <details className="text-xs text-slate-500">
          <summary className="cursor-pointer hover:text-slate-400 transition-colors">
            📋 Ver verbos ({verbCount})
          </summary>
          <div className="mt-2 bg-slate-800 rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-slate-700">
                  <th className="text-left px-3 py-2">Verbo</th>
                  <th className="text-left px-3 py-2">Hiragana</th>
                  <th className="text-left px-3 py-2">Romaji</th>
                  <th className="text-left px-3 py-2">Español</th>
                  <th className="text-left px-3 py-2">Grupo</th>
                </tr>
              </thead>
              <tbody>
                {getVerbsByLevels(selectedLevels).map((v) => (
                  <tr key={v.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="px-3 py-1.5 text-white font-medium">{v.dictionary}</td>
                    <td className="px-3 py-1.5 text-indigo-300">{v.hiragana}</td>
                    <td className="px-3 py-1.5 text-slate-400">{v.romaji}</td>
                    <td className="px-3 py-1.5 text-slate-400">{v.spanish}</td>
                    <td className="px-3 py-1.5 text-slate-500">
                      {v.group === 1 ? "I" : v.group === 2 ? "II" : "III"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
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
        <p className="text-4xl font-bold text-indigo-400">{pct}%</p>
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

export default function Conjugations() {
  const [screen, setScreen] = useState<"lobby" | "game" | "results">("lobby");
  const [questions, setQuestions] = useState<ConjugationQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [savedLevels, setSavedLevels] = useState<VerbLevel[]>(["N5"]);
  const [savedForms, setSavedForms] = useState<VerbForm[]>(ALL_FORMS);
  const [showHiragana, setShowHiragana] = useState(true);
  const [showRomaji, setShowRomaji] = useState(false);

  const current = questions[currentIdx];

  const goNext = useCallback(() => {
    setTimeout(() => {
      if (currentIdx + 1 >= questions.length) {
        setScreen("results");
      } else {
        setCurrentIdx((i) => i + 1);
        setSelected(null);
      }
    }, 2500);
  }, [currentIdx, questions.length]);

  function handleStart(levels: VerbLevel[], forms: VerbForm[], hiragana: boolean, romaji: boolean) {
    setSavedLevels(levels);
    setSavedForms(forms);
    setShowHiragana(hiragana);
    setShowRomaji(romaji);
    const verbs = getVerbsByLevels(levels);
    const qs = buildQuestions(verbs, forms);
    setQuestions(qs);
    setCurrentIdx(0);
    setScore(0);
    setSelected(null);
    setScreen("game");
  }

  function handleAnswer(opt: string) {
    if (selected !== null) return;
    setSelected(opt);
    if (opt === current.answer) setScore((s) => s + 1);
    goNext();
  }

  function handleRestart() {
    handleStart(savedLevels, savedForms, showHiragana, showRomaji);
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

  return (
    <div className="game-container space-y-4">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm text-slate-400">
        <span>
          {currentIdx + 1} / {questions.length}
        </span>
        <span className="font-semibold text-white">{score} ✓</span>
      </div>

      {/* Question card */}
      <div className="card p-6 text-center space-y-3">
        <p className="text-xs text-slate-500 uppercase tracking-widest">
          ¿Cuál es la forma{" "}
          <strong className="text-indigo-400">
            {VERB_FORM_LABELS[current.targetForm]}
          </strong>
          {" "}
          <span className="text-slate-500 normal-case">({VERB_FORM_ROMAJI[current.targetForm]})</span>
          ?
        </p>
        <div className="text-3xl font-bold text-white">{current.verb.dictionary}</div>
        {showHiragana && (
          <div className="flex items-center justify-center gap-2">
            <div className="text-lg text-indigo-300">{current.verb.hiragana}</div>
            <button
              onClick={() => speak(current.verb.hiragana)}
              className="w-7 h-7 rounded-full bg-slate-700 hover:bg-sky-600 text-slate-300 hover:text-white flex items-center justify-center transition-all active:scale-90 text-sm"
              title="Escuchar pronunciación"
            >
              🔊
            </button>
          </div>
        )}
        {!showHiragana && (
          <button
            onClick={() => speak(current.verb.hiragana)}
            className="mx-auto w-7 h-7 rounded-full bg-slate-700 hover:bg-sky-600 text-slate-300 hover:text-white flex items-center justify-center transition-all active:scale-90 text-sm"
            title="Escuchar pronunciación"
          >
            🔊
          </button>
        )}
        {showRomaji && (
          <div className="text-slate-400 text-sm italic">{current.verb.romaji}</div>
        )}
        <div className="text-slate-400 text-sm">{current.verb.spanish}</div>
        <div className="text-slate-600 text-xs">
          Grupo {current.verb.group === 1 ? "I (Godan)" : current.verb.group === 2 ? "II (Ichidan)" : "III (Irregular)"}
        </div>
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-3">
        {current.options.map((opt) => {
          let style =
            "bg-slate-700 border-slate-600 text-white hover:border-indigo-500";
          if (selected !== null) {
            if (opt.japanese === current.answer) {
              style = "bg-emerald-700 border-emerald-500 text-white";
            } else if (opt.japanese === selected) {
              style = "bg-red-800 border-red-600 text-white";
            } else {
              style = "bg-slate-800 border-slate-700 text-slate-500";
            }
          }
          return (
            <button
              key={opt.japanese}
              onClick={() => handleAnswer(opt.japanese)}
              disabled={selected !== null}
              className={`py-4 px-3 rounded-xl border-2 text-base font-medium transition-all flex flex-col items-center gap-0.5 ${style}`}
            >
              <span>{opt.japanese}</span>
              {showRomaji && (
                <span className="text-xs font-normal opacity-70">{opt.romaji}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Answer reveal card */}
      {selected !== null && (
        <div className="card p-4 text-center space-y-1">
          <p className="text-xs text-slate-500 uppercase tracking-widest">
            Forma {VERB_FORM_LABELS[current.targetForm]}
          </p>
          <p className="text-2xl font-bold text-emerald-400">{current.answer}</p>
          <p className="text-slate-400 text-sm italic">{current.answerRomaji}</p>
          <button
            onClick={() => speak(current.answer)}
            className="mt-1 p-2 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors"
            title="Escuchar pronunciación"
          >
            🔊
          </button>
        </div>
      )}
    </div>
  );
}

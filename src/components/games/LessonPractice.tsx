import { useCallback, useEffect, useRef, useState } from "react";
import { shuffle } from "../../data/vocab";
import {
  getLessonsWithSentences,
  getSentences,
  type Sentence,
} from "../../data/sentences/index";
import { speak } from "../../utils/tts";

const SECONDS = 10;

// ── Types ─────────────────────────────────────────────────────────────────────

type PracticeMode = "scrambled" | "missing";

interface ScrambledQuestion {
  kind: "scrambled";
  sentence: Sentence;
  tiles: string[];        // shuffled japanese tiles
  hiranaTiles: string[];  // matching hiragana tiles (same order as tiles)
  answer: string[];       // correct japanese tiles in order
}

interface MissingQuestion {
  kind: "missing";
  sentence: Sentence;
  displayTiles: string[];  // japanese tiles with one replaced by ""
  blankIdx: number;
  answer: string;
  options: string[];
}

type Question = ScrambledQuestion | MissingQuestion;

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildScrambled(sentences: Sentence[]): ScrambledQuestion[] {
  return sentences.map((s) => {
    const jpTiles = s.japanese.split(" ");
    const hiraTiles = s.hiragana.split(" ");
    const indices = shuffle(jpTiles.map((_, i) => i));
    return {
      kind: "scrambled",
      sentence: s,
      tiles: indices.map((i) => jpTiles[i]),
      hiranaTiles: indices.map((i) => hiraTiles[i]),
      answer: jpTiles,
    };
  });
}

function buildMissing(sentences: Sentence[]): MissingQuestion[] {
  return sentences.map((s) => {
    const jpTiles = s.japanese.split(" ");
    // Prefer a middle content tile (not index 0 which is often topic+は)
    const blankIdx = jpTiles.length > 2 ? 1 : 0;
    const answer = jpTiles[blankIdx];

    // Distractors: other tiles from the same sentence set
    const allTiles = sentences
      .flatMap((sent) => sent.japanese.split(" "))
      .filter((t) => t !== answer);
    const distractors = shuffle([...new Set(allTiles)]).slice(0, 3);
    // Pad with placeholders if not enough distractors
    while (distractors.length < 3) distractors.push(`？${distractors.length}`);

    const displayTiles = jpTiles.map((t, i) => (i === blankIdx ? "" : t));
    return {
      kind: "missing",
      sentence: s,
      displayTiles,
      blankIdx,
      answer,
      options: shuffle([answer, ...distractors]),
    };
  });
}

// ── Lobby ─────────────────────────────────────────────────────────────────────

function Lobby({
  onStart,
}: {
  onStart: (lesson: number, mode: PracticeMode, showTranslation: boolean) => void;
}) {
  const lessons = getLessonsWithSentences();
  const [selectedLesson, setSelectedLesson] = useState<number>(lessons[0] ?? 1);
  const [mode, setMode] = useState<PracticeMode>("scrambled");
  const [showTranslation, setShowTranslation] = useState(true);

  if (lessons.length === 0) {
    return (
      <div className="game-container space-y-6">
        <div className="card p-8 text-center space-y-3">
          <p className="text-4xl">📝</p>
          <p className="text-slate-300 font-semibold">No hay oraciones disponibles</p>
          <p className="text-sm text-slate-500">
            Agrega oraciones a <code className="text-orange-400">src/data/sentences/</code> para
            empezar a practicar.
          </p>
        </div>
        <a href="/" className="btn-secondary w-full text-center block">
          ← Inicio
        </a>
      </div>
    );
  }

  return (
    <div className="game-container space-y-6">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold text-white">📝 Practicar Lecciones</h1>
        <p className="text-slate-400 text-sm">Construye oraciones con el vocabulario de la lección</p>
      </div>

      {/* Lesson selector */}
      <div className="card p-5 space-y-3">
        <h2 className="font-semibold text-slate-300">📖 Lección</h2>
        <div className="flex flex-wrap gap-2">
          {lessons.map((l) => (
            <button
              key={l}
              onClick={() => setSelectedLesson(l)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                selectedLesson === l
                  ? "bg-orange-600 border-orange-500 text-white"
                  : "bg-slate-700 border-slate-600 text-slate-300 hover:border-orange-500"
              }`}
            >
              Lección {String(l).padStart(2, "0")}
            </button>
          ))}
        </div>
      </div>

      {/* Mode selector */}
      <div className="card p-5 space-y-3">
        <h2 className="font-semibold text-slate-300">🎮 Modo</h2>
        <div className="flex gap-3">
          <button
            onClick={() => setMode("scrambled")}
            className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
              mode === "scrambled"
                ? "bg-orange-600 border-orange-500 text-white"
                : "bg-slate-700 border-slate-600 text-slate-300 hover:border-orange-500"
            }`}
          >
            🔀 Ordenar palabras
          </button>
          <button
            onClick={() => setMode("missing")}
            className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
              mode === "missing"
                ? "bg-orange-600 border-orange-500 text-white"
                : "bg-slate-700 border-slate-600 text-slate-300 hover:border-orange-500"
            }`}
          >
            ❓ Palabra faltante
          </button>
        </div>
        <p className="text-xs text-slate-500">
          {mode === "scrambled"
            ? "Toca las palabras en el orden correcto para formar la oración."
            : "Elige la palabra que falta en la oración (10 segundos por pregunta)."}
        </p>
      </div>

      {/* Translation toggle */}
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-slate-300 text-sm">🌐 Mostrar traducción</p>
            <p className="text-xs text-slate-500 mt-0.5">Ver la traducción al español durante el juego</p>
          </div>
          <button
            onClick={() => setShowTranslation((v) => !v)}
            className={`w-12 h-6 rounded-full transition-colors relative ${
              showTranslation ? "bg-orange-500" : "bg-slate-600"
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                showTranslation ? "translate-x-6" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      </div>

      <button
        onClick={() => onStart(selectedLesson, mode, showTranslation)}
        className="btn-primary w-full text-lg py-4"
      >
        ¡Empezar!
      </button>
    </div>
  );
}

// ── Scrambled game screen ─────────────────────────────────────────────────────

function ScrambledScreen({
  question,
  questionNum,
  total,
  showTranslation,
  onCorrect,
  onWrong,
}: {
  question: ScrambledQuestion;
  questionNum: number;
  total: number;
  showTranslation: boolean;
  onCorrect: () => void;
  onWrong: () => void;
}) {
  // availableIdx tracks which shuffled tile slots are still in the pool
  const [available, setAvailable] = useState<number[]>(
    question.tiles.map((_, i) => i)
  );
  // placed is an ordered list of shuffled-tile indices
  const [placed, setPlaced] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState<"correct" | "wrong" | null>(null);
  const [showHint, setShowHint] = useState(showTranslation);

  useEffect(() => {
    setAvailable(question.tiles.map((_, i) => i));
    setPlaced([]);
    setSubmitted(null);
    setShowHint(showTranslation);
  }, [question, showTranslation]);

  const pickTile = (idx: number) => {
    if (submitted) return;
    setAvailable((a) => a.filter((i) => i !== idx));
    setPlaced((p) => [...p, idx]);
  };

  const removeTile = (pos: number) => {
    if (submitted) return;
    const idx = placed[pos];
    setPlaced((p) => p.filter((_, i) => i !== pos));
    setAvailable((a) => [...a, idx]);
  };

  const submit = () => {
    if (submitted || placed.length !== question.answer.length) return;
    const correct = placed.every((idx, pos) => question.tiles[idx] === question.answer[pos]);
    setSubmitted(correct ? "correct" : "wrong");
    setTimeout(() => {
      if (correct) onCorrect();
      else onWrong();
    }, 2500);
  };

  return (
    <div className="game-container space-y-4">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm text-slate-400">
        <span>Oración {questionNum}/{total}</span>
        <button
          onClick={() => setShowHint((v) => !v)}
          className="text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 transition-colors"
        >
          {showHint ? "🙈 Ocultar" : "🌐 Ver traducción"}
        </button>
      </div>

      {/* Translation hint */}
      {showHint && (
        <div className="card p-3 text-center text-sm text-slate-300 italic">
          {question.sentence.spanish}
        </div>
      )}

      {/* Answer area */}
      <div className="card p-4 min-h-[64px]">
        <p className="text-xs text-slate-500 mb-2">Tu respuesta:</p>
        <div className="flex flex-wrap gap-2">
          {placed.length === 0 && (
            <span className="text-slate-600 text-sm">Toca las palabras de abajo...</span>
          )}
          {placed.map((tileIdx, pos) => {
            let style = "bg-orange-600 border-orange-500";
            if (submitted === "correct") style = "bg-emerald-700 border-emerald-500";
            if (submitted === "wrong") {
              style =
                question.tiles[tileIdx] === question.answer[pos]
                  ? "bg-emerald-700 border-emerald-500"
                  : "bg-red-800 border-red-600";
            }
            return (
              <button
                key={pos}
                onClick={() => removeTile(pos)}
                disabled={submitted !== null}
                className={`px-3 py-1.5 rounded-lg border-2 text-sm font-medium text-white transition-all ${style}`}
              >
                {question.tiles[tileIdx]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Available tiles */}
      <div className="card p-4">
        <p className="text-xs text-slate-500 mb-2">Palabras disponibles:</p>
        <div className="flex flex-wrap gap-2">
          {available.map((tileIdx) => (
            <button
              key={tileIdx}
              onClick={() => pickTile(tileIdx)}
              disabled={submitted !== null}
              className="px-3 py-1.5 rounded-lg border-2 bg-slate-700 border-slate-600 text-white hover:border-orange-500 text-sm font-medium transition-all disabled:opacity-50"
            >
              {question.tiles[tileIdx]}
            </button>
          ))}
        </div>
      </div>

      {/* Submit */}
      {submitted === null && (
        <button
          onClick={submit}
          disabled={placed.length !== question.answer.length}
          className="btn-primary w-full py-3 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Comprobar
        </button>
      )}

      {/* Result reveal */}
      {submitted !== null && (
        <div className={`card p-4 text-center space-y-2 ${submitted === "correct" ? "border border-emerald-600" : "border border-red-700"}`}>
          <p className={`text-lg font-bold ${submitted === "correct" ? "text-emerald-400" : "text-red-400"}`}>
            {submitted === "correct" ? "✅ ¡Correcto!" : "❌ Incorrecto"}
          </p>
          <p className="text-white text-lg">{question.answer.join("")}</p>
          <p className="text-slate-400 text-sm italic">{question.sentence.romaji}</p>
          <button
            onClick={() => speak(question.answer.join(""))}
            className="p-2 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors"
            title="Escuchar"
          >
            🔊
          </button>
        </div>
      )}
    </div>
  );
}

// ── Missing word game screen ──────────────────────────────────────────────────

function MissingScreen({
  question,
  questionNum,
  total,
  showTranslation,
  onCorrect,
  onWrong,
}: {
  question: MissingQuestion;
  questionNum: number;
  total: number;
  showTranslation: boolean;
  onCorrect: () => void;
  onWrong: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(SECONDS);
  const [showHint, setShowHint] = useState(showTranslation);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleAnswer = useCallback(
    (opt: string) => {
      if (selected !== null) return;
      stopTimer();
      setSelected(opt);
      const correct = opt === question.answer;
      setTimeout(() => {
        if (correct) onCorrect();
        else onWrong();
      }, 2500);
    },
    [selected, question.answer, stopTimer, onCorrect, onWrong]
  );

  useEffect(() => {
    setSelected(null);
    setTimeLeft(SECONDS);
    setShowHint(showTranslation);
  }, [question, showTranslation]);

  useEffect(() => {
    if (selected !== null) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          stopTimer();
          handleAnswer("__timeout__");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return stopTimer;
  }, [question, selected, stopTimer, handleAnswer]);

  const fullJp = question.sentence.japanese.split(" ");

  return (
    <div className="game-container space-y-4">
      {/* Progress + timer */}
      <div className="flex items-center justify-between text-sm text-slate-400">
        <span>Oración {questionNum}/{total}</span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowHint((v) => !v)}
            className="text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 transition-colors"
          >
            {showHint ? "🙈 Ocultar" : "🌐 Ver traducción"}
          </button>
          <span
            className={`text-xl font-bold tabular-nums ${timeLeft <= 3 ? "text-red-400" : "text-slate-400"}`}
          >
            {timeLeft}
          </span>
        </div>
      </div>

      {/* Translation hint */}
      {showHint && (
        <div className="card p-3 text-center text-sm text-slate-300 italic">
          {question.sentence.spanish}
        </div>
      )}

      {/* Sentence with blank */}
      <div className="card p-5 text-center">
        <div className="flex flex-wrap justify-center gap-1 text-xl">
          {question.displayTiles.map((tile, i) =>
            i === question.blankIdx ? (
              <span
                key={i}
                className={`px-3 py-1 rounded-lg border-2 min-w-[60px] text-center font-bold ${
                  selected === null
                    ? "border-orange-500 text-orange-300 bg-orange-900/30"
                    : selected === question.answer
                    ? "border-emerald-500 text-emerald-300 bg-emerald-900/30"
                    : "border-red-500 text-red-300 bg-red-900/30"
                }`}
              >
                {selected !== null ? fullJp[i] : "＿＿"}
              </span>
            ) : (
              <span key={i} className="text-white">
                {tile}
              </span>
            )
          )}
        </div>
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-3">
        {question.options.map((opt) => {
          let style = "bg-slate-700 border-slate-600 text-white hover:border-orange-500";
          if (selected !== null) {
            if (opt === question.answer) style = "bg-emerald-700 border-emerald-500 text-white";
            else if (opt === selected) style = "bg-red-800 border-red-600 text-white";
            else style = "bg-slate-800 border-slate-700 text-slate-500";
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

      {/* Answer reveal */}
      {selected !== null && (
        <div className="card p-4 text-center space-y-1">
          <p className="text-white text-lg font-medium">
            {question.sentence.japanese.replace(/ /g, "")}
          </p>
          <p className="text-slate-400 text-sm italic">{question.sentence.romaji}</p>
          <button
            onClick={() => speak(question.sentence.japanese.replace(/ /g, ""))}
            className="mt-1 p-2 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors"
            title="Escuchar"
          >
            🔊
          </button>
        </div>
      )}
    </div>
  );
}

// ── Results ───────────────────────────────────────────────────────────────────

function Results({
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
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  const emoji = pct === 100 ? "🏆" : pct >= 70 ? "⭐" : pct >= 40 ? "👍" : "📚";
  return (
    <div className="game-container space-y-6 text-center">
      <div className="card p-8 space-y-4">
        <p className="text-6xl">{emoji}</p>
        <h2 className="text-2xl font-bold text-white">
          {score}/{total} correctas
        </h2>
        <p className="text-slate-400">{pct}% de precisión</p>
      </div>
      <div className="flex gap-3">
        <button onClick={onRestart} className="flex-1 btn-secondary">
          🔄 Reintentar
        </button>
        <button onClick={onHome} className="flex-1 btn-primary">
          🏠 Inicio
        </button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function LessonPractice() {
  const [screen, setScreen] = useState<"lobby" | "game" | "results">("lobby");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [mode, setMode] = useState<PracticeMode>("scrambled");
  const [showTranslation, setShowTranslation] = useState(true);

  const start = useCallback(
    (lesson: number, m: PracticeMode, hint: boolean) => {
      const sentences = getSentences(lesson);
      const qs: Question[] =
        m === "scrambled" ? buildScrambled(sentences) : buildMissing(sentences);
      setQuestions(shuffle(qs));
      setCurrentIdx(0);
      setScore(0);
      setMode(m);
      setShowTranslation(hint);
      setScreen("game");
    },
    []
  );

  const handleCorrect = useCallback(() => {
    setScore((s) => s + 1);
    if (currentIdx + 1 >= questions.length) {
      setTimeout(() => setScreen("results"), 2600);
    } else {
      setCurrentIdx((i) => i + 1);
    }
  }, [currentIdx, questions.length]);

  const handleWrong = useCallback(() => {
    if (currentIdx + 1 >= questions.length) {
      setScreen("results");
    } else {
      setCurrentIdx((i) => i + 1);
    }
  }, [currentIdx, questions.length]);

  const restart = () => setScreen("lobby");
  const home = () => { window.location.href = "/"; };

  if (screen === "lobby") return <Lobby onStart={start} />;
  if (screen === "results")
    return <Results score={score} total={questions.length} onRestart={restart} onHome={home} />;

  const q = questions[currentIdx];
  if (!q) return null;

  if (q.kind === "scrambled")
    return (
      <ScrambledScreen
        question={q}
        questionNum={currentIdx + 1}
        total={questions.length}
        showTranslation={showTranslation}
        onCorrect={handleCorrect}
        onWrong={handleWrong}
      />
    );

  return (
    <MissingScreen
      question={q}
      questionNum={currentIdx + 1}
      total={questions.length}
      showTranslation={showTranslation}
      onCorrect={handleCorrect}
      onWrong={handleWrong}
    />
  );
}

import { useEffect, useState } from "react";
import type { GameConfig, VocabWord } from "../../data/types";
import { getWords, pickWrongAnswers, shuffle } from "../../data/vocab";
import { speak } from "../../utils/tts";
import { useTimeout } from "../../utils/useTimers";
import GameLobby from "../shared/GameLobby";
import JapaneseWord from "../shared/JapaneseWord";
import ResultScreen from "../shared/ResultScreen";
import { useGameSession } from "../shared/useGameSession";

interface Round {
  word: VocabWord;
  options: string[];
  answer: string;
}

function buildRounds(cfg: GameConfig): Round[] {
  const allWords = getWords({});
  const dir = cfg.direction === "jp-en" || cfg.direction === "en-jp" ? "en" : "es";
  return getWords(cfg).map((w) => {
    const answer = dir === "es" ? w.spanish : w.english;
    const wrongs = pickWrongAnswers(w, allWords, dir === "es" ? "jp-es" : "jp-en");
    return { word: w, options: shuffle([answer, ...wrongs]), answer };
  });
}

export default function ListeningQuiz() {
  const {
    config,
    rounds,
    index,
    score,
    done,
    current,
    missed,
    start,
    restart,
    exit,
    award,
    miss,
    advance,
  } = useGameSession(buildRounds);

  const [chosen, setChosen] = useState<string | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const after = useTimeout();
  const afterFx = useTimeout();

  const leave = () => {
    after.clear();
    afterFx.clear();
    exit();
  };

  // Speak the word whenever a new round appears (including the first).
  useEffect(() => {
    if (current) after(() => speak(current.word.japanese), 300);
  }, [current, after]);

  const playWord = () => {
    if (!current) return;
    setSpeaking(true);
    speak(current.word.japanese);
    afterFx(() => setSpeaking(false), 1500);
  };

  const pick = (opt: string) => {
    if (chosen || !current) return;
    setChosen(opt);
    if (opt === current.answer) award();
    else miss(current.word.id);
    after(() => {
      setChosen(null);
      advance();
    }, 1200);
  };

  if (!config)
    return (
      <GameLobby
        onStart={start}
        gameTitle="Listening"
        gameEmoji="🔊"
        color="bg-sky-600"
      />
    );
  if (done) {
    return (
      <ResultScreen
        score={score}
        total={rounds.length}
        words={rounds.map((r) => r.word)}
        game="listening"
        missed={missed}
        onRestart={restart}
        onHome={leave}
      />
    );
  }

  if (!current) return null;

  return (
    <div className="game-container space-y-6">
      <div className="flex justify-between items-center text-sm text-slate-400">
        <span>
          {index + 1} / {rounds.length}
        </span>
        <span className="text-sky-400 font-bold" aria-live="polite">
          {score} pts
        </span>
        <button
          onClick={leave}
          className="text-slate-500 hover:text-slate-300"
        >
          ✕ Salir
        </button>
      </div>

      <div className="w-full bg-slate-700 rounded-full h-1.5">
        <div
          className="bg-sky-500 h-1.5 rounded-full transition-all"
          style={{ width: `${(index / rounds.length) * 100}%` }}
        />
      </div>

      {/* Speaker button */}
      <div className="flex flex-col items-center gap-3">
        <button
          onClick={playWord}
          aria-label="Escuchar la palabra de nuevo"
          className={`w-32 h-32 rounded-full flex items-center justify-center text-6xl
            transition-all shadow-xl active:scale-95
            ${speaking ? "bg-sky-400 shadow-sky-400/40 scale-105" : "bg-sky-600 hover:bg-sky-500 shadow-sky-900/40"}`}
        >
          🔊
        </button>
        <p className="text-slate-400 text-sm">Toca para escuchar de nuevo</p>
        {chosen && (
          <JapaneseWord
            japanese={current.word.japanese}
            hiragana={current.word.hiragana}
            romaji={current.word.romaji}
            size="md"
            className="text-sky-300"
            playable
          />
        )}
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-3">
        {current.options.map((opt, i) => {
          const isAnswer = opt === current.answer;
          const isChosen = opt === chosen;
          let cls =
            "card p-4 text-center font-semibold text-sm sm:text-base cursor-pointer border transition-all jp";
          if (chosen) {
            if (isAnswer)
              cls += " !bg-emerald-700 !border-emerald-400 text-white";
            else if (isChosen)
              cls += " !bg-rose-700 !border-rose-400 text-white";
            else cls += " opacity-40";
          } else {
            cls += " hover:border-sky-400 hover:bg-slate-700 active:scale-95";
          }
          return (
            <button key={i} className={cls} onClick={() => pick(opt)}>
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

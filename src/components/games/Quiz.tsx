import { useCallback, useEffect, useState } from "react";
import type { GameConfig, VocabWord } from "../../data/types";
import {
  getQuestion,
  getWords,
  pickWrongAnswers,
  shuffle,
} from "../../data/vocab";
import { useInterval, useTimeout } from "../../utils/useTimers";
import GameLobby from "../shared/GameLobby";
import JapaneseWord from "../shared/JapaneseWord";
import ResultScreen from "../shared/ResultScreen";
import { useGameSession } from "../shared/useGameSession";

const SECONDS = 15;

interface Question {
  word: VocabWord;
  question: string;
  options: string[];
  answer: string;
}

function buildQuestions(cfg: GameConfig): Question[] {
  const allWords = getWords(cfg.kana ? cfg : {}); // same pool for wrong answers
  return getWords(cfg).map((w) => {
    const { question, answer } = getQuestion(w, cfg.direction);
    const wrongs = pickWrongAnswers(w, allWords, cfg.direction);
    return { word: w, question, options: shuffle([answer, ...wrongs]), answer };
  });
}

export default function Quiz() {
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
  } = useGameSession(buildQuestions);

  const [chosen, setChosen] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(SECONDS);
  const { start: startTimer, stop: stopTimer } = useInterval();
  const after = useTimeout();

  const startRound = useCallback(() => {
    setChosen(null);
    setTimeLeft(SECONDS);
    startTimer(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
  }, [startTimer]);

  const next = useCallback(() => {
    advance();
    if (index + 1 >= rounds.length) stopTimer();
    else startRound();
  }, [advance, index, rounds.length, startRound, stopTimer]);

  const begin = useCallback(
    (cfg: GameConfig) => {
      start(cfg);
      startRound();
    },
    [start, startRound],
  );

  const leave = useCallback(() => {
    stopTimer();
    after.clear();
    exit();
  }, [stopTimer, after, exit]);

  const pick = (opt: string) => {
    if (chosen || !current) return;
    setChosen(opt);
    stopTimer();
    if (opt === current.answer) award();
    else miss(current.word.id);
    after(next, 1200);
  };

  // Time out → show the answer, then advance.
  useEffect(() => {
    if (timeLeft === 0 && chosen === null && current) {
      setChosen("__timeout__");
      miss(current.word.id);
      after(next, 1500);
    }
  }, [timeLeft, chosen, current, miss, after, next]);

  if (!config)
    return (
      <GameLobby
        onStart={begin}
        gameTitle="Quiz Kahoot"
        gameEmoji="🎯"
        color="bg-rose-600"
      />
    );

  if (done) {
    return (
      <ResultScreen
        score={score}
        total={rounds.length}
        words={rounds.map((q) => q.word)}
        game="quiz"
        missed={missed}
        onRestart={() => {
          after.clear();
          restart();
          startRound();
        }}
        onHome={leave}
      />
    );
  }

  if (!current) return null;

  const pct = (timeLeft / SECONDS) * 100;
  const timerColor =
    pct > 50 ? "bg-emerald-500" : pct > 25 ? "bg-amber-500" : "bg-rose-500";

  return (
    <div className="game-container space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center text-sm text-slate-400">
        <span>
          {index + 1} / {rounds.length}
        </span>
        <span className="font-bold text-white" aria-live="polite">
          {score} pts
        </span>
        <button
          onClick={leave}
          className="text-slate-500 hover:text-slate-300"
        >
          ✕ Salir
        </button>
      </div>

      {/* Timer bar */}
      <div className="w-full bg-slate-700 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-1000 ${timerColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-center text-2xl font-bold tabular-nums">
        {timeLeft}s
      </div>

      {/* Question */}
      <div className="card p-6 text-center min-h-28 flex items-center justify-center">
        {current.question === current.word.japanese ? (
          <JapaneseWord
            japanese={current.word.japanese}
            hiragana={
              config.showHiragana !== false
                ? current.word.hiragana
                : undefined
            }
            romaji={
              config.kana
                ? undefined
                : config.showRomaji !== false
                  ? current.word.romaji
                  : undefined
            }
            size="lg"
            playable
          />
        ) : (
          <p className="jp text-3xl sm:text-4xl font-bold leading-snug">
            {current.question}
          </p>
        )}
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-3">
        {current.options.map((opt, i) => {
          const isAnswer = opt === current.answer;
          const isChosen = opt === chosen;
          let cls =
            "card p-4 text-center font-semibold text-sm sm:text-base cursor-pointer border transition-all";
          if (chosen) {
            if (isAnswer)
              cls += " !bg-emerald-700 !border-emerald-400 text-white";
            else if (isChosen)
              cls += " !bg-rose-700 !border-rose-400 text-white";
            else cls += " opacity-40";
          } else {
            cls += " hover:border-rose-400 hover:bg-slate-700 active:scale-95";
          }
          return (
            <button key={i} className={cls} onClick={() => pick(opt)}>
              <span className="jp">{opt}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

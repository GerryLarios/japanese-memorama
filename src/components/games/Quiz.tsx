import { useCallback, useEffect, useRef, useState } from "react";
import type { GameConfig, VocabWord } from "../../data/types";
import {
  getQuestion,
  getWords,
  pickWrongAnswers,
  shuffle,
} from "../../data/vocab";
import GameLobby from "../shared/GameLobby";
import JapaneseWord from "../shared/JapaneseWord";
import ResultScreen from "../shared/ResultScreen";

const SECONDS = 15;

interface Question {
  word: VocabWord;
  question: string;
  options: string[];
  answer: string;
}

function buildQuestions(
  words: VocabWord[],
  config: GameConfig,
  allWords: VocabWord[],
): Question[] {
  return words.map((w) => {
    const { question, answer } = getQuestion(w, config.direction);
    const wrongs = pickWrongAnswers(w, allWords, config.direction);
    const options = shuffle([answer, ...wrongs]);
    return { word: w, question, options, answer };
  });
}

export default function Quiz() {
  const [config, setConfig] = useState<GameConfig | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(SECONDS);
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const startTimer = useCallback(() => {
    stopTimer();
    setTimeLeft(SECONDS);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          stopTimer();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    if (timeLeft === 0 && !chosen) {
      setChosen("__timeout__");
      stopTimer();
      setTimeout(() => advance(), 1500);
    }
  }, [timeLeft, chosen]);

  const advance = useCallback(() => {
    setIndex((i) => {
      const next = i + 1;
      if (next >= questions.length) {
        setDone(true);
        return i;
      }
      setChosen(null);
      startTimer();
      return next;
    });
  }, [questions.length, startTimer]);

  const start = useCallback(
    (cfg: GameConfig) => {
      const allWords = getWords(cfg.kana ? cfg : {}); // use same pool for wrong answers
      const words = getWords(cfg);
      const qs = buildQuestions(words, cfg, allWords);
      setConfig(cfg);
      setQuestions(qs);
      setIndex(0);
      setScore(0);
      setChosen(null);
      setDone(false);
      startTimer();
    },
    [startTimer],
  );

  useEffect(() => () => stopTimer(), []);

  const pick = (option: string) => {
    if (chosen) return;
    setChosen(option);
    stopTimer();
    const q = questions[index];
    if (option === q.answer) setScore((s) => s + 1);
    setTimeout(() => advance(), 1200);
  };

  if (!config)
    return (
      <GameLobby
        onStart={start}
        gameTitle="Quiz Kahoot"
        gameEmoji="🎯"
        color="bg-rose-600"
      />
    );

  if (done) {
    return (
      <ResultScreen
        score={score}
        total={questions.length}
        words={questions.map((q) => q.word)}
        onRestart={() => start(config)}
        onHome={() => {
          setConfig(null);
          stopTimer();
        }}
      />
    );
  }

  const q = questions[index];
  const pct = (timeLeft / SECONDS) * 100;
  const timerColor =
    pct > 50 ? "bg-emerald-500" : pct > 25 ? "bg-amber-500" : "bg-rose-500";

  return (
    <div className="game-container space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center text-sm text-slate-400">
        <span>
          {index + 1} / {questions.length}
        </span>
        <span className="font-bold text-white">{score} pts</span>
        <button
          onClick={() => {
            setConfig(null);
            stopTimer();
          }}
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
        {q.question === q.word.japanese ? (
          <JapaneseWord
            japanese={q.word.japanese}
            hiragana={config.showHiragana !== false ? q.word.hiragana : undefined}
            romaji={config.kana ? undefined : (config.showRomaji !== false ? q.word.romaji : undefined)}
            size="lg"
            playable
          />
        ) : (
          <p className="jp text-3xl sm:text-4xl font-bold leading-snug">
            {q.question}
          </p>
        )}
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-3">
        {q.options.map((opt, i) => {
          const isAnswer = opt === q.answer;
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

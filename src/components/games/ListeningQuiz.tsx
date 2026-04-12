import { useCallback, useState } from "react";
import type { GameConfig, VocabWord } from "../../data/types";
import { getWords, pickWrongAnswers, shuffle } from "../../data/vocab";
import { speak } from "../../utils/tts";
import GameLobby from "../shared/GameLobby";
import JapaneseWord from "../shared/JapaneseWord";
import ResultScreen from "../shared/ResultScreen";

interface Round {
  word: VocabWord;
  options: string[];
  answer: string;
}

function buildRounds(
  words: VocabWord[],
  allWords: VocabWord[],
  dir: "es" | "en",
): Round[] {
  return words.map((w) => {
    const answer = dir === "es" ? w.spanish : w.english;
    const wrongs = pickWrongAnswers(
      w,
      allWords,
      dir === "es" ? "jp-es" : "jp-en",
    );
    return { word: w, options: shuffle([answer, ...wrongs]), answer };
  });
}

export default function ListeningQuiz() {
  const [config, setConfig] = useState<GameConfig | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const start = useCallback((cfg: GameConfig) => {
    const allWords = getWords({});
    const words = getWords(cfg);
    const dir =
      cfg.direction === "jp-en" || cfg.direction === "en-jp" ? "en" : "es";
    const rs = buildRounds(words, allWords, dir);
    setConfig(cfg);
    setRounds(rs);
    setIndex(0);
    setChosen(null);
    setScore(0);
    setDone(false);
    setTimeout(() => {
      speak(rs[0].word.japanese);
    }, 300);
  }, []);

  const playWord = () => {
    if (!rounds[index]) return;
    setSpeaking(true);
    speak(rounds[index].word.japanese);
    setTimeout(() => setSpeaking(false), 1500);
  };

  const pick = (opt: string) => {
    if (chosen) return;
    setChosen(opt);
    if (opt === rounds[index].answer) setScore((s) => s + 1);
    setTimeout(() => {
      const next = index + 1;
      if (next >= rounds.length) {
        setDone(true);
        return;
      }
      setIndex(next);
      setChosen(null);
      setTimeout(() => speak(rounds[next].word.japanese), 300);
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
        onRestart={() => start(config)}
        onHome={() => setConfig(null)}
      />
    );
  }

  const round = rounds[index];
  if (!round) return null;

  return (
    <div className="game-container space-y-6">
      <div className="flex justify-between items-center text-sm text-slate-400">
        <span>
          {index + 1} / {rounds.length}
        </span>
        <span className="text-sky-400 font-bold">{score} pts</span>
        <button
          onClick={() => setConfig(null)}
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
          className={`w-32 h-32 rounded-full flex items-center justify-center text-6xl
            transition-all shadow-xl active:scale-95
            ${speaking ? "bg-sky-400 shadow-sky-400/40 scale-105" : "bg-sky-600 hover:bg-sky-500 shadow-sky-900/40"}`}
        >
          🔊
        </button>
        <p className="text-slate-400 text-sm">Toca para escuchar de nuevo</p>
        {chosen && (
          <JapaneseWord
            japanese={round.word.japanese}
            hiragana={round.word.hiragana}
            romaji={round.word.romaji}
            size="md"
            className="text-sky-300"
            playable
          />
        )}
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-3">
        {round.options.map((opt, i) => {
          const isAnswer = opt === round.answer;
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

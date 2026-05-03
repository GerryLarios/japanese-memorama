import { useCallback, useState } from "react";
import type { GameConfig, VocabWord } from "../../data/types";
import { getQuestion, getWords, shuffle } from "../../data/vocab";
import GameLobby from "../shared/GameLobby";
import JapaneseWord from "../shared/JapaneseWord";
import ResultScreen from "../shared/ResultScreen";

export default function Flashcards() {
  const [config, setConfig] = useState<GameConfig | null>(null);
  const [cards, setCards] = useState<VocabWord[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  const [done, setDone] = useState(false);

  const start = useCallback((cfg: GameConfig) => {
    setConfig(cfg);
    setCards(shuffle(getWords(cfg)));
    setIndex(0);
    setFlipped(false);
    setKnown(0);
    setDone(false);
  }, []);

  const rate = (k: boolean) => {
    if (k) setKnown((n) => n + 1);
    const next = index + 1;
    if (next >= cards.length) {
      setDone(true);
      return;
    }
    setIndex(next);
    setFlipped(false);
  };

  if (!config)
    return (
      <GameLobby
        onStart={start}
        gameTitle="Flashcards"
        gameEmoji="📖"
        color="bg-amber-500"
      />
    );

  if (done) {
    return (
      <ResultScreen
        score={known}
        total={cards.length}
        label="Palabras que sabías"
        words={cards}
        onRestart={() => start(config)}
        onHome={() => setConfig(null)}
      />
    );
  }

  const word = cards[index];
  const { question, answer } = getQuestion(word, config.direction);
  const questionIsJapanese = question === word.japanese;
  const answerIsJapanese = answer === word.japanese;

  return (
    <div className="game-container space-y-6">
      <div className="flex justify-between items-center text-sm text-slate-400">
        <span>
          {index + 1} / {cards.length}
        </span>
        <span className="text-emerald-400">✓ {known} sabía</span>
        <button
          onClick={() => setConfig(null)}
          className="text-slate-500 hover:text-slate-300"
        >
          ✕ Salir
        </button>
      </div>

      {/* Progress */}
      <div className="w-full bg-slate-700 rounded-full h-1.5">
        <div
          className="bg-amber-500 h-1.5 rounded-full transition-all"
          style={{ width: `${(index / cards.length) * 100}%` }}
        />
      </div>

      {/* Card */}
      <button
        onClick={() => setFlipped((f) => !f)}
        className="card w-full min-h-56 flex flex-col items-center justify-center gap-4 p-8 cursor-pointer
                   hover:border-amber-500 transition-all active:scale-98"
      >
        {!flipped ? (
          <>
            {questionIsJapanese ? (
              <JapaneseWord
                japanese={word.japanese}
                hiragana={config.showHiragana !== false ? word.hiragana : undefined}
                romaji={config.kana ? undefined : (config.showRomaji !== false ? word.romaji : undefined)}
                size="xl"
                playable
              />
            ) : (
              <p className="jp text-4xl sm:text-5xl font-bold text-center">
                {question}
              </p>
            )}
            <p className="text-slate-500 text-sm mt-2">
              Toca para ver la respuesta
            </p>
          </>
        ) : (
          <>
            {questionIsJapanese ? (
              <JapaneseWord
                japanese={word.japanese}
                hiragana={word.hiragana}
                romaji={word.romaji}
                size="md"
                className="text-slate-400"
              />
            ) : (
              <p className="jp text-2xl text-slate-400 font-medium">
                {question}
              </p>
            )}
            <div className="w-12 border-t border-amber-500" />
            {answerIsJapanese ? (
              <JapaneseWord
                japanese={word.japanese}
                hiragana={word.hiragana}
                romaji={word.romaji}
                size="lg"
                className="text-amber-400"
                playable
              />
            ) : (
              <p className="jp text-3xl sm:text-4xl font-bold text-amber-400 text-center">
                {answer}
              </p>
            )}
          </>
        )}
      </button>

      {flipped && (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => rate(false)}
            className="btn bg-rose-600 hover:bg-rose-500 text-white py-4 text-base"
          >
            😅 Estudiar más
          </button>
          <button
            onClick={() => rate(true)}
            className="btn bg-emerald-600 hover:bg-emerald-500 text-white py-4 text-base"
          >
            ✅ ¡Lo sabía!
          </button>
        </div>
      )}

      {!flipped && (
        <button
          onClick={() => setFlipped(true)}
          className="btn-secondary w-full py-4"
        >
          Revelar respuesta
        </button>
      )}
    </div>
  );
}

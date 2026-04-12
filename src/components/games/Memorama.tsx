import { useCallback, useState } from "react";
import type { GameConfig, VocabWord } from "../../data/types";
import { getWords, shuffle } from "../../data/vocab";
import GameLobby from "../shared/GameLobby";
import JapaneseWord from "../shared/JapaneseWord";
import ResultScreen from "../shared/ResultScreen";

interface Card {
  id: string;
  content: string;
  hiragana?: string;
  romaji?: string;
  wordId: string;
  side: "front" | "back";
  isJapanese: boolean;
  pairNumber: number;
  matched: boolean;
  flipped: boolean;
}

function buildCards(words: VocabWord[], config: GameConfig): Card[] {
  const dir = config.direction === "random" ? "jp-es" : config.direction;
  const jpOnFront = dir === "jp-es" || dir === "jp-en";

  const cards: Card[] = [];
  words.forEach((w, i) => {
    const frontContent = jpOnFront
      ? w.japanese
      : dir === "es-jp"
        ? w.spanish
        : w.english;
    const backContent = jpOnFront
      ? dir === "jp-es"
        ? w.spanish
        : w.english
      : w.japanese;

    cards.push({
      id: `${w.id}-f`,
      content: frontContent,
      wordId: w.id,
      side: "front",
      isJapanese: jpOnFront,
      hiragana: jpOnFront ? w.hiragana : undefined,
      romaji: jpOnFront ? w.romaji : undefined,
      pairNumber: i + 1,
      matched: false,
      flipped: false,
    });
    cards.push({
      id: `${w.id}-b`,
      content: backContent,
      wordId: w.id,
      side: "back",
      isJapanese: !jpOnFront,
      hiragana: !jpOnFront ? w.hiragana : undefined,
      romaji: !jpOnFront ? w.romaji : undefined,
      pairNumber: i + 1,
      matched: false,
      flipped: false,
    });
  });
  return shuffle(cards);
}

export default function Memorama() {
  const [config, setConfig] = useState<GameConfig | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [playedWords, setPlayedWords] = useState<VocabWord[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [done, setDone] = useState(false);
  const [locked, setLocked] = useState(false);

  const start = useCallback((cfg: GameConfig) => {
    const words = getWords(cfg);
    setConfig(cfg);
    setCards(buildCards(words, cfg));
    setPlayedWords(words);
    setSelected([]);
    setMoves(0);
    setMatches(0);
    setDone(false);
    setLocked(false);
  }, []);

  const flip = (id: string) => {
    if (locked) return;
    const card = cards.find((c) => c.id === id);
    if (!card || card.matched || card.flipped) return;
    if (selected.includes(id)) return;

    const newSelected = [...selected, id];
    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, flipped: true } : c)),
    );

    if (newSelected.length < 2) {
      setSelected(newSelected);
      return;
    }

    setSelected([]);
    setMoves((m) => m + 1);
    setLocked(true);

    const [a, b] = newSelected;
    const cardA = cards.find((c) => c.id === a)!;
    const cardB = { ...card };

    if (cardA.wordId === cardB.wordId && cardA.side !== cardB.side) {
      setCards((prev) =>
        prev.map((c) =>
          newSelected.includes(c.id)
            ? { ...c, flipped: true, matched: true }
            : c,
        ),
      );
      const newMatches = matches + 1;
      setMatches(newMatches);
      if (newMatches === cards.length / 2) setDone(true);
      setLocked(false);
    } else {
      setTimeout(() => {
        setCards((prev) =>
          prev.map((c) =>
            newSelected.includes(c.id) ? { ...c, flipped: false } : c,
          ),
        );
        setLocked(false);
      }, 1000);
    }
  };

  if (!config) {
    return (
      <GameLobby
        onStart={start}
        gameTitle="Memorama"
        gameEmoji="🃏"
        color="bg-violet-600"
      />
    );
  }

  if (done) {
    return (
      <ResultScreen
        score={matches}
        total={cards.length / 2}
        label="Pares encontrados"
        words={playedWords}
        onRestart={() => start(config)}
        onHome={() => setConfig(null)}
      >
        <div className="card p-4 text-slate-300 text-sm">
          Movimientos:{" "}
          <span className="font-bold text-violet-400">{moves}</span>
        </div>
      </ResultScreen>
    );
  }

  const pairs = cards.length / 2;
  const cols =
    pairs <= 6
      ? "grid-cols-3"
      : pairs <= 12
        ? "grid-cols-4"
        : pairs <= 20
          ? "grid-cols-5"
          : "grid-cols-5 sm:grid-cols-6";

  return (
    <div className="game-container">
      <div className="flex justify-between items-center mb-4 text-sm text-slate-400">
        <span>
          Pares: {matches}/{cards.length / 2}
        </span>
        <span>Movimientos: {moves}</span>
        <button
          onClick={() => setConfig(null)}
          className="text-slate-500 hover:text-slate-300"
        >
          ✕ Salir
        </button>
      </div>

      <div className={`grid ${cols} gap-2`}>
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={() => flip(card.id)}
            className={`relative aspect-square rounded-xl text-center flex items-center justify-center text-sm font-medium p-3
              transition-all duration-300 border select-none
              ${
                card.matched
                  ? "bg-emerald-700 border-emerald-500 text-emerald-100"
                  : card.flipped
                    ? "bg-violet-700 border-violet-400 text-white"
                    : "bg-slate-700 border-slate-600 hover:border-violet-400 cursor-pointer text-slate-700"
              }`}
          >
            {card.matched && (
              <span className="absolute top-1.5 left-1.5 min-w-6 h-6 px-1 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center">
                {card.pairNumber}
              </span>
            )}
            <span
              className={`leading-tight w-full ${card.flipped || card.matched ? "opacity-100" : "opacity-0"}`}
            >
              {card.isJapanese ? (
                <JapaneseWord
                  japanese={card.content}
                  hiragana={card.hiragana}
                  romaji={config.kana ? undefined : card.romaji}
                  size="md"
                />
              ) : (
                <span className="jp text-xs sm:text-sm">{card.content}</span>
              )}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

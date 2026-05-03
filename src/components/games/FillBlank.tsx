import { useCallback, useRef, useState } from "react";
import type { GameConfig, VocabWord } from "../../data/types";
import { getQuestion, getWords, shuffle } from "../../data/vocab";
import { speak } from "../../utils/tts";
import GameLobby from "../shared/GameLobby";
import JapaneseWord from "../shared/JapaneseWord";
import ResultScreen from "../shared/ResultScreen";

export default function FillBlank() {
  const [config, setConfig] = useState<GameConfig | null>(null);
  const [words, setWords] = useState<VocabWord[]>([]);
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const start = useCallback((cfg: GameConfig) => {
    setConfig(cfg);
    setWords(shuffle(getWords(cfg)));
    setIndex(0);
    setInput("");
    setResult(null);
    setScore(0);
    setDone(false);
  }, []);

  const word = words[index];

  const normalize = (s: string) =>
    s
      .trim()
      .toLowerCase()
      .replace(/[ー〜～\s]/g, "")
      .replace(/[。、！？]/g, "");

  const check = () => {
    if (!word || result) return;
    const { answer } = getQuestion(word, config!.direction);
    const correct =
      normalize(input) === normalize(answer) ||
      normalize(input) === normalize(word.romaji) ||
      normalize(input) === normalize(word.hiragana) ||
      normalize(input) === normalize(word.japanese);

    setResult(correct ? "correct" : "wrong");
    if (correct) setScore((s) => s + 1);
  };

  const next = () => {
    const nextIndex = index + 1;
    if (nextIndex >= words.length) {
      setDone(true);
      return;
    }
    setIndex(nextIndex);
    setInput("");
    setResult(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  if (!config)
    return (
      <GameLobby
        onStart={start}
        gameTitle="Llena el Espacio"
        gameEmoji="✍️"
        color="bg-emerald-600"
      />
    );
  if (done) {
    return (
      <ResultScreen
        score={score}
        total={words.length}
        words={words}
        onRestart={() => start(config)}
        onHome={() => setConfig(null)}
      />
    );
  }
  if (!word) return null;

  const { question, answer } = getQuestion(word, config.direction);
  const isJpAnswer =
    config.direction === "es-jp" || config.direction === "en-jp";

  return (
    <div className="game-container space-y-5">
      <div className="flex justify-between items-center text-sm text-slate-400">
        <span>
          {index + 1} / {words.length}
        </span>
        <span className="text-emerald-400">✓ {score}</span>
        <button
          onClick={() => setConfig(null)}
          className="text-slate-500 hover:text-slate-300"
        >
          ✕ Salir
        </button>
      </div>

      <div className="w-full bg-slate-700 rounded-full h-1.5">
        <div
          className="bg-emerald-500 h-1.5 rounded-full transition-all"
          style={{ width: `${(index / words.length) * 100}%` }}
        />
      </div>

      {/* Prompt */}
      <div className="card p-6 text-center">
        {!isJpAnswer ? (
          <JapaneseWord
            japanese={word.japanese}
            hiragana={config.showHiragana !== false ? word.hiragana : undefined}
            romaji={config.kana ? undefined : (config.showRomaji !== false ? word.romaji : undefined)}
            size="lg"
            playable
          />
        ) : (
          <div className="flex items-center justify-center gap-2">
            <p className="jp text-3xl sm:text-4xl font-bold">{question}</p>
            <button
              onClick={() => speak(question)}
              className="shrink-0 w-8 h-8 rounded-full bg-slate-700 hover:bg-sky-600 text-slate-300 hover:text-white
                         flex items-center justify-center transition-all active:scale-90 text-base"
              title="Escuchar pronunciación"
            >
              🔊
            </button>
          </div>
        )}
        {isJpAnswer && (
          <p className="text-slate-500 text-xs mt-2">
            Puedes escribir en romaji, hiragana o kanji
          </p>
        )}
      </div>

      {/* Input */}
      <div className="space-y-3">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") result ? next() : check();
          }}
          disabled={!!result}
          placeholder={
            isJpAnswer ? "Escribe en romaji o japonés" : "Escribe la traducción"
          }
          className={`w-full bg-slate-800 border rounded-xl px-4 py-3 text-lg jp outline-none
            transition-all focus:ring-2 focus:ring-emerald-500
            ${result === "correct" ? "border-emerald-500 bg-emerald-900/30" : result === "wrong" ? "border-rose-500 bg-rose-900/30" : "border-slate-600"}`}
          autoFocus
        />

        {result && (
          <div
            className={`card p-4 text-center ${result === "correct" ? "border-emerald-500" : "border-rose-500"}`}
          >
            {result === "correct" ? (
              <div className="space-y-2">
                <p className="text-emerald-400 font-semibold">✅ ¡Correcto!</p>
                {isJpAnswer && (
                  <JapaneseWord
                    japanese={word.japanese}
                    hiragana={word.hiragana}
                    romaji={word.romaji}
                    size="md"
                    playable
                  />
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-rose-400 font-semibold">❌ Incorrecto</p>
                {isJpAnswer ? (
                  <JapaneseWord
                    japanese={word.japanese}
                    hiragana={word.hiragana}
                    romaji={word.romaji}
                    size="md"
                    playable
                  />
                ) : (
                  <p className="text-slate-300 jp text-lg">
                    Respuesta:{" "}
                    <span className="font-bold text-white">{answer}</span>
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {!result ? (
        <button
          onClick={check}
          disabled={!input.trim()}
          className="btn-primary w-full py-4"
        >
          Verificar
        </button>
      ) : (
        <button onClick={next} className="btn-primary w-full py-4">
          {index + 1 < words.length ? "Siguiente →" : "Ver resultados"}
        </button>
      )}
    </div>
  );
}

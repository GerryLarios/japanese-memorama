import type { VocabWord } from "../../data/types";
import JapaneseWord from "./JapaneseWord";

interface Props {
  score: number;
  total: number;
  onRestart: () => void;
  onHome: () => void;
  children?: React.ReactNode;
  label?: string;
  words?: VocabWord[];
}

export default function ResultScreen({
  score,
  total,
  onRestart,
  onHome,
  children,
  label = "Correctas",
  words,
}: Props) {
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  const emoji = pct >= 80 ? "🎉" : pct >= 50 ? "😊" : "💪";
  const msg =
    pct >= 80
      ? "¡Excelente!"
      : pct >= 50
        ? "¡Bien hecho!"
        : "¡Sigue practicando!";

  return (
    <div className="game-container flex flex-col items-center gap-6 text-center">
      <div className="text-7xl mt-6">{emoji}</div>
      <h2 className="text-3xl font-bold">{msg}</h2>

      <div className="card p-6 w-full space-y-3">
        <div className="text-5xl font-bold text-violet-400">{pct}%</div>
        <div className="text-slate-400 text-sm">
          {label}: {score} / {total}
        </div>

        <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
          <div
            className={`h-3 rounded-full transition-all duration-700 ${pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-rose-500"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {children}

      {words && words.length > 0 && (
        <div className="card w-full overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-700 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">
            📋 Vocabulario practicado
          </div>
          <ul className="divide-y divide-slate-700/50">
            {words.map((w) => (
              <li
                key={w.id}
                className="flex items-center gap-3 px-4 py-3 text-left"
              >
                <div className="flex-1 min-w-0">
                  <JapaneseWord
                    japanese={w.japanese}
                    hiragana={w.hiragana}
                    romaji={w.romaji}
                    size="sm"
                    className="items-start"
                    playable
                  />
                </div>
                <div className="text-right text-sm shrink-0">
                  <div className="text-slate-300">{w.spanish}</div>
                  <div className="text-slate-500 text-xs">{w.english}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-3 w-full pb-6">
        <button onClick={onRestart} className="btn-primary flex-1">
          🔄 Otra vez
        </button>
        <button onClick={onHome} className="btn-secondary flex-1">
          🏠 Inicio
        </button>
      </div>
    </div>
  );
}

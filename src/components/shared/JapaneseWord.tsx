import { speak } from "../../utils/tts";

interface Props {
  japanese: string;
  hiragana?: string;
  romaji?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  playable?: boolean;
}

const sizeMap = {
  sm: { kanji: "text-xl", hira: "text-sm", romaji: "text-xs" },
  md: { kanji: "text-2xl", hira: "text-base", romaji: "text-xs" },
  lg: { kanji: "text-3xl sm:text-4xl", hira: "text-lg", romaji: "text-sm" },
  xl: { kanji: "text-4xl sm:text-5xl", hira: "text-xl", romaji: "text-sm" },
};

export default function JapaneseWord({
  japanese,
  hiragana,
  romaji,
  size = "lg",
  className = "",
  playable = false,
}: Props) {
  const s = sizeMap[size];
  const showHira = hiragana && hiragana !== japanese;

  return (
    <div className={`flex flex-col items-center gap-0.5 ${className}`}>
      <div className="flex items-center gap-2">
        <p className={`jp font-bold leading-snug text-center ${s.kanji}`}>
          {japanese}
        </p>
      </div>
      {showHira && (
        <p className={`jp text-slate-300 leading-tight ${s.hira}`}>
          {hiragana}
        </p>
      )}
      {romaji && (
        <p className={`text-slate-300 italic ${s.romaji}`}>{romaji}</p>
      )}
      {playable && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            speak(japanese);
          }}
          className="mt-2 shrink-0 w-7 h-7 rounded-full bg-slate-700 hover:bg-sky-600 text-slate-300 hover:text-white
                       flex items-center justify-center transition-all active:scale-90 text-sm"
          title="Escuchar pronunciación"
        >
          🔊
        </button>
      )}
    </div>
  );
}

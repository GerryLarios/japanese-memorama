import { useRef, useState } from "react";
import type { VocabWord, WordType } from "../../data/types";

interface Props {
  onImport: (words: VocabWord[]) => void;
}

const VALID_TYPES: WordType[] = [
  "noun", "verb", "i-adjective", "na-adjective",
  "expression", "counter", "adverb", "particle", "conjunction",
];

function generateId(): string {
  return "custom-" + Math.random().toString(36).slice(2, 10);
}

function parseLesson(raw: string | number | undefined): number {
  if (raw === undefined || raw === null || raw === "" || raw === "game") return 0;
  const n = Number(raw);
  return isNaN(n) ? 0 : n;
}

interface ParseResult {
  words: VocabWord[];
  errors: string[];
}

function parseJSON(text: string): ParseResult {
  const errors: string[] = [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { words: [], errors: ["JSON inválido: no se pudo parsear el archivo."] };
  }

  if (!Array.isArray(parsed)) {
    return { words: [], errors: ["El JSON debe ser un arreglo de objetos."] };
  }

  const words: VocabWord[] = [];
  (parsed as Record<string, unknown>[]).forEach((row, i) => {
    const errs = validateRow(row, i + 1);
    if (errs.length) {
      errors.push(...errs);
    } else {
      words.push(rowToWord(row));
    }
  });
  return { words, errors };
}

function parseCSV(text: string): ParseResult {
  const errors: string[] = [];
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) {
    return { words: [], errors: ["El CSV debe tener encabezados y al menos una fila de datos."] };
  }

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const words: VocabWord[] = [];

  lines.slice(1).forEach((line, i) => {
    if (!line.trim()) return;
    const cols = line.split(",").map((c) => c.trim());
    const row: Record<string, unknown> = {};
    headers.forEach((h, idx) => {
      row[h] = cols[idx] ?? "";
    });

    const errs = validateRow(row, i + 2);
    if (errs.length) {
      errors.push(...errs);
    } else {
      words.push(rowToWord(row));
    }
  });

  return { words, errors };
}

function validateRow(row: Record<string, unknown>, lineNum: number): string[] {
  const errs: string[] = [];
  const prefix = `Fila ${lineNum}`;

  if (!row.japanese) errs.push(`${prefix}: falta el campo "japanese".`);
  if (!row.hiragana) errs.push(`${prefix}: falta el campo "hiragana".`);
  if (!row.romaji) errs.push(`${prefix}: falta el campo "romaji".`);
  if (!row.spanish && !row.english)
    errs.push(`${prefix}: falta al menos "spanish" o "english".`);

  const type = String(row.type ?? "");
  if (!VALID_TYPES.includes(type as WordType)) {
    errs.push(
      `${prefix}: tipo inválido "${type}". Válidos: ${VALID_TYPES.join(", ")}.`,
    );
  }

  return errs;
}

function rowToWord(row: Record<string, unknown>): VocabWord {
  return {
    id: String(row.id || "").trim() || generateId(),
    japanese: String(row.japanese),
    hiragana: String(row.hiragana),
    romaji: String(row.romaji),
    spanish: String(row.spanish ?? row.english ?? ""),
    english: String(row.english ?? row.spanish ?? ""),
    type: String(row.type) as WordType,
    lesson: parseLesson(row.lesson as string | number | undefined),
  };
}

export default function CustomVocabImport({ onImport }: Props) {
  const [words, setWords] = useState<VocabWord[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function processFile(file: File) {
    setFileName(file.name);
    setWords([]);
    setErrors([]);

    const ext = file.name.split(".").pop()?.toLowerCase();
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      let result: ParseResult;
      if (ext === "json") {
        result = parseJSON(text);
      } else if (ext === "csv") {
        result = parseCSV(text);
      } else {
        setErrors(["Formato no soportado. Usa .json o .csv."]);
        return;
      }
      setWords(result.words);
      setErrors(result.errors);
      if (result.words.length > 0) {
        onImport(result.words);
      }
    };
    reader.readAsText(file);
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        className={`rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
          isDragging
            ? "border-violet-400 bg-violet-900/20 text-violet-300"
            : "border-slate-600 text-slate-400 hover:border-violet-500 hover:text-slate-300"
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
      >
        <div className="text-3xl mb-2">📂</div>
        <p className="text-sm font-medium">
          {fileName
            ? fileName
            : "Arrastra un archivo o haz clic para elegir"}
        </p>
        <p className="text-xs mt-1 text-slate-500">Formatos: .json · .csv</p>
        <input
          ref={inputRef}
          type="file"
          accept=".json,.csv"
          className="hidden"
          onChange={onFileChange}
        />
      </div>

      {/* Success state */}
      {words.length > 0 && errors.length === 0 && (
        <div className="rounded-xl bg-emerald-900/30 border border-emerald-700 px-4 py-3 text-sm text-emerald-300">
          ✅ {words.length} {words.length === 1 ? "palabra importada" : "palabras importadas"}
        </div>
      )}

      {/* Partial success */}
      {words.length > 0 && errors.length > 0 && (
        <div className="rounded-xl bg-amber-900/30 border border-amber-700 px-4 py-3 text-sm text-amber-300">
          ⚠️ {words.length} palabras importadas con {errors.length} advertencia(s)
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="rounded-xl bg-red-900/20 border border-red-700 px-4 py-3 space-y-1 max-h-40 overflow-y-auto">
          {errors.map((e, i) => (
            <p key={i} className="text-xs text-red-400">{e}</p>
          ))}
        </div>
      )}

      {/* Format help */}
      <details className="text-xs text-slate-500">
        <summary className="cursor-pointer hover:text-slate-400 transition-colors">
          ¿Cómo formatear el archivo?
        </summary>
        <div className="mt-2 space-y-2 bg-slate-800 rounded-lg p-3 text-slate-400">
          <p className="font-semibold text-slate-300">JSON — arreglo de objetos:</p>
          <pre className="overflow-x-auto text-xs leading-relaxed">{`[
  {
    "japanese": "ごはん",
    "hiragana": "ごはん",
    "romaji": "gohan",
    "type": "noun",
    "spanish": "arroz",
    "english": "rice"
  }
]`}</pre>
          <p className="font-semibold text-slate-300 mt-2">CSV — con encabezados:</p>
          <pre className="overflow-x-auto text-xs leading-relaxed">
            {`japanese,hiragana,romaji,type,spanish,english\nごはん,ごはん,gohan,noun,arroz,rice`}
          </pre>
          <p className="text-slate-500 mt-1">
            Tipos válidos: {VALID_TYPES.join(", ")}
          </p>
          <p className="text-slate-500">
            Los campos <code>id</code> y <code>lesson</code> son opcionales.
          </p>
        </div>
      </details>
    </div>
  );
}

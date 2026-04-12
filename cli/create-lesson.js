#!/usr/bin/env node
/**
 * create-lesson.js
 * Interactive CLI to scaffold a new lesson JSON template.
 * Usage: node cli/create-lesson.js
 */

import fs from "fs";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VOCAB_DIR = path.resolve(__dirname, "../src/data/vocabulary");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((res) => rl.question(q, res));

async function main() {
  console.log("\n📝  Generador de plantilla de lección\n");

  // Ask for lesson number
  let lessonNum;
  while (true) {
    const raw = await ask("¿Número de lección? (ej. 3): ");
    const n = parseInt(raw.trim(), 10);
    if (!isNaN(n) && n > 0 && n <= 99) {
      lessonNum = n;
      break;
    }
    console.log("  ⚠️  Ingresa un número válido entre 1 y 99.\n");
  }

  // Ask for entry count
  let count = 40;
  const rawCount = await ask(`¿Cuántas entradas? (por defecto: 40): `);
  if (rawCount.trim() !== "") {
    const n = parseInt(rawCount.trim(), 10);
    if (!isNaN(n) && n > 0) count = n;
  }

  rl.close();

  const padded    = String(lessonNum).padStart(2, "0");   // "03"
  const prefix    = `L${padded}`;                          // "L03"
  const filename  = `lesson-${padded}.json`;
  const outPath   = path.join(VOCAB_DIR, filename);

  // Warn if file already exists
  if (fs.existsSync(outPath)) {
    console.error(`\n❌  El archivo ya existe: ${outPath}`);
    console.error("    Borra o renombra el archivo existente antes de continuar.");
    process.exit(1);
  }

  // Build entries
  const entries = Array.from({ length: count }, (_, i) => {
    const seq = String(i + 1).padStart(3, "0");   // "001"
    return {
      id:       `${prefix}-${seq}`,
      japanese: "",
      hiragana: "",
      romaji:   "",
      spanish:  "",
      english:  "",
      type:     "",
      lesson:   lessonNum,
    };
  });

  fs.writeFileSync(outPath, JSON.stringify(entries, null, 2) + "\n", "utf8");

  console.log(`\n✅  Plantilla creada: ${outPath}`);
  console.log(`    ${count} entradas con IDs ${prefix}-001 … ${prefix}-${String(count).padStart(3, "0")}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

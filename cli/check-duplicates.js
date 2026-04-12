#!/usr/bin/env node
/**
 * check-duplicates.js
 * Scans all vocabulary JSON files in src/data/vocabulary/ and reports
 * duplicate entries by id, japanese character, and romaji.
 *
 * Usage:
 *   node cli/check-duplicates.js
 */

import { readFileSync, readdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const vocabDir = join(__dirname, '../src/data/vocabulary');
const files = readdirSync(vocabDir).filter((f) => f.endsWith('.json'));

if (files.length === 0) {
  console.log('No vocabulary JSON files found in', vocabDir);
  process.exit(0);
}

let totalEntries = 0;
let totalDuplicates = 0;

for (const file of files) {
  const filePath = join(vocabDir, file);
  const data = JSON.parse(readFileSync(filePath, 'utf-8'));

  totalEntries += data.length;

  const checkField = (field) => {
    const values = data.map((w) => w[field]);
    const seen = new Set();
    const dups = [];
    for (const v of values) {
      if (seen.has(v)) dups.push(v);
      seen.add(v);
    }
    return dups;
  };

  const dupIds     = checkField('id');
  const dupJp      = checkField('japanese');
  const dupRomaji  = checkField('romaji');

  const hasDups = dupIds.length || dupJp.length || dupRomaji.length;
  totalDuplicates += dupIds.length + dupJp.length + dupRomaji.length;

  console.log(`\n📄 ${file}  (${data.length} entries)`);

  if (!hasDups) {
    console.log('  ✅ No duplicates found');
    continue;
  }

  const printDups = (label, dups, field) => {
    if (!dups.length) return;
    console.log(`  ⚠️  Duplicate ${label}:`);
    dups.forEach((val) => {
      const matches = data.filter((w) => w[field] === val);
      matches.forEach((m) =>
        console.log(`     ${m.id}  ${m.japanese}  (${m.romaji})  —  ${m.spanish}`)
      );
    });
  };

  printDups('IDs',    dupIds,    'id');
  printDups('Japanese', dupJp,   'japanese');
  printDups('Romaji', dupRomaji, 'romaji');
}

console.log(`\n────────────────────────────────`);
console.log(`Total entries:    ${totalEntries}`);
console.log(`Total duplicates: ${totalDuplicates}`);
console.log(totalDuplicates === 0 ? '✅ All clean!' : '❌ Fix the duplicates above.');

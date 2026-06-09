import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const csvPath = process.argv[2] ?? path.join(__dirname, '../public/cards-round2-source.csv');
const outPath = path.join(__dirname, '../public/cards-round2.xlsx');

const csv = fs.readFileSync(csvPath, 'utf8');
const rows = csv
  .trim()
  .split(/\r?\n/)
  .map((line) => line.split(',').map((cell) => cell.trim()));

const ws = XLSX.utils.aoa_to_sheet(rows);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Round2');
XLSX.writeFile(wb, outPath);

console.log(`Wrote ${outPath} with ${rows.length - 1} data rows`);

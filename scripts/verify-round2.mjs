import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Inline minimal test of loader logic via dynamic import won't work easily;
// read xlsx and print card count using same parsing as app would.

const buffer = fs.readFileSync(path.join(__dirname, '../public/cards-round2.xlsx'));
const workbook = XLSX.read(buffer);
const sheet = workbook.Sheets['Round2'];
const table = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
console.log('Rows:', table.length - 1);
console.log('Headers:', table[0]);

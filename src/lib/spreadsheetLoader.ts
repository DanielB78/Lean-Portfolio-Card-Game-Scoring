import * as XLSX from 'xlsx';
import { buildColumnMapping, mapRowsToCards } from './columnMapping';
import type { CardDefinition, ColumnMappingEntry } from '../types/card';

export interface SpreadsheetLoadResult {
  cards: CardDefinition[];
  columnMapping: ColumnMappingEntry[];
  sheetName: string;
}

export function parseWorkbook(buffer: ArrayBuffer): SpreadsheetLoadResult {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const table = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: null,
  });

  if (table.length === 0) {
    return { cards: [], columnMapping: [], sheetName };
  }

  const headers = (table[0] ?? []).map((cell) => String(cell ?? ''));
  const dataRows = table.slice(1).filter((row) => row.some((cell) => cell !== null && cell !== ''));
  const columnMapping = buildColumnMapping(headers);
  const cards = mapRowsToCards(dataRows, headers);

  return { cards, columnMapping, sheetName };
}

export async function loadCardsFromUrl(url: string): Promise<SpreadsheetLoadResult> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load spreadsheet (${response.status})`);
  }
  const buffer = await response.arrayBuffer();
  return parseWorkbook(buffer);
}

export async function loadCardsFromFile(file: File): Promise<SpreadsheetLoadResult> {
  const buffer = await file.arrayBuffer();
  return parseWorkbook(buffer);
}

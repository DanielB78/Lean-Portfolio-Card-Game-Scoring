import * as XLSX from 'xlsx';
import type { Round2CardDefinition, Round2Threshold } from './types';

function normalizeHeader(header: unknown): string {
  return String(header ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function parseNumber(value: unknown, fallback = 0): number {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function findColumnIndex(headers: string[], aliases: string[]): number {
  return headers.findIndex((header) => aliases.includes(normalizeHeader(header)));
}

type ParsedPoints =
  | { kind: 'threshold'; completionValue: number; isRecurring: boolean }
  | { kind: 'penalty'; penaltyValue: number; deadlineRound: number };

function parsePointsCell(raw: unknown): ParsedPoints | null {
  const text = String(raw ?? '').trim();
  if (!text) return null;

  const recurringMatch = text.match(/^(-?\d+(?:\.\d+)?)\s+(?:Recurring|Reccuring)/i);
  if (recurringMatch) {
    return {
      kind: 'threshold',
      completionValue: Number(recurringMatch[1]),
      isRecurring: true,
    };
  }

  const penaltyMatch = text.match(/^(-?\d+(?:\.\d+)?)\s+By\s+(?:Quarter|quarter)\s+(\d+)/i);
  if (penaltyMatch) {
    return {
      kind: 'penalty',
      penaltyValue: Number(penaltyMatch[1]),
      deadlineRound: Number(penaltyMatch[2]),
    };
  }

  const numeric = Number(text);
  if (Number.isFinite(numeric)) {
    return { kind: 'threshold', completionValue: numeric, isRecurring: false };
  }

  return null;
}

interface RowMapping {
  cardId: string;
  effort: number;
  threshold: Round2Threshold | null;
  penalty: { penaltyValue: number; deadlineRound: number } | null;
}

function mapRound2Row(row: unknown[], headers: string[]): RowMapping | null {
  const cardIdx = findColumnIndex(headers, ['card', 'card id', 'id']);
  const effortIdx = findColumnIndex(headers, [
    'effort',
    'effort threshold',
    'effort thresholds',
  ]);
  const pointsIdx = findColumnIndex(headers, [
    'points',
    'value',
    'completion value',
    'completion',
  ]);
  const valueIdx = findColumnIndex(headers, ['value', 'completion value', 'completion']);
  const recurringIdx = findColumnIndex(headers, [
    'recurring value',
    'recurring value / turn',
    'recurring',
  ]);
  const deadlineIdx = findColumnIndex(headers, [
    'deadline_turns',
    'deadline turn',
    'deadline round',
    'deadline',
  ]);
  const penaltyIdx = findColumnIndex(headers, ['penalty value', 'penalty']);

  if (cardIdx < 0) return null;

  const cardId = String(row[cardIdx] ?? '').trim();
  if (!cardId) return null;

  const effort = effortIdx >= 0 ? parseNumber(row[effortIdx]) : 0;

  const pointsColumn = pointsIdx >= 0 ? row[pointsIdx] : null;
  if (pointsColumn !== null && pointsColumn !== '') {
    const parsed = parsePointsCell(pointsColumn);
    if (!parsed) return null;

    if (parsed.kind === 'penalty') {
      return {
        cardId,
        effort,
        threshold: null,
        penalty: parsed,
      };
    }

    return {
      cardId,
      effort,
      threshold: {
        effortThreshold: effort,
        completionValue: parsed.completionValue,
        isRecurring: parsed.isRecurring,
      },
      penalty: null,
    };
  }

  const rawValue = valueIdx >= 0 ? parseNumber(row[valueIdx]) : 0;
  const deadlineRound = deadlineIdx >= 0 ? parseNumber(row[deadlineIdx], NaN) : NaN;
  const explicitPenalty = penaltyIdx >= 0 ? parseNumber(row[penaltyIdx], NaN) : NaN;
  const recurringValue = recurringIdx >= 0 ? parseNumber(row[recurringIdx]) : 0;

  if (Number.isFinite(explicitPenalty) && explicitPenalty < 0 && Number.isFinite(deadlineRound)) {
    return {
      cardId,
      effort,
      threshold: null,
      penalty: { penaltyValue: explicitPenalty, deadlineRound },
    };
  }

  if (effort > 0 && rawValue > 0) {
    return {
      cardId,
      effort,
      threshold: {
        effortThreshold: effort,
        completionValue: rawValue,
        isRecurring: recurringValue > 0,
      },
      penalty: null,
    };
  }

  return null;
}

function groupRound2Rows(rows: unknown[][], headers: string[]): Round2CardDefinition[] {
  const grouped = new Map<string, Round2CardDefinition>();

  for (const row of rows) {
    const mapped = mapRound2Row(row, headers);
    if (!mapped) continue;

    const existing = grouped.get(mapped.cardId) ?? {
      cardId: mapped.cardId,
      thresholds: [],
      deadlineRound: null,
      penaltyValue: 0,
      requiredEffort: null,
    };

    if (mapped.threshold) {
      existing.thresholds.push(mapped.threshold);
    }

    if (mapped.penalty) {
      existing.deadlineRound = mapped.penalty.deadlineRound;
      existing.penaltyValue = mapped.penalty.penaltyValue;
      existing.requiredEffort = mapped.effort > 0 ? mapped.effort : existing.requiredEffort;
    }

    grouped.set(mapped.cardId, existing);
  }

  return Array.from(grouped.values())
    .map((card) => ({
      ...card,
      thresholds: [...card.thresholds].sort(
        (left, right) => left.effortThreshold - right.effortThreshold,
      ),
    }))
    .sort((left, right) => left.cardId.localeCompare(right.cardId, undefined, { numeric: true }));
}

export async function loadRound2CardsFromUrl(url: string): Promise<Round2CardDefinition[]> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load Round 2 spreadsheet (${response.status})`);
  }

  const buffer = await response.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName =
    workbook.SheetNames.find((name) => normalizeHeader(name) === 'round2') ??
    workbook.SheetNames.find((name) => normalizeHeader(name) === 'sheet1') ??
    workbook.SheetNames.find((name) => normalizeHeader(name) === 'cards') ??
    workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const table = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null });

  if (table.length === 0) return [];

  const headers = (table[0] ?? []).map((cell) => String(cell ?? ''));
  const dataRows = table.slice(1).filter((row) => row.some((cell) => cell !== null && cell !== ''));

  return groupRound2Rows(dataRows, headers);
}

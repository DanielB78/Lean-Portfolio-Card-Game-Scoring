import type { CardDefinition, CardType, ColumnMappingEntry } from '../types/card';

export const EXPECTED_FIELDS = [
  'Card ID',
  'Effort (Turns Required)',
  'Completion Value',
  'Recurring Value / Turn',
  'Deadline Turn',
  'Penalty Value',
  'Card Type',
] as const;

const COLUMN_ALIASES: Record<string, string[]> = {
  cardId: ['card id', 'card', 'id', 'card_id', 'name'],
  effort: ['effort', 'effort (turns required)', 'turns required', 'turns'],
  completionValue: ['completion value', 'value', 'completion', 'points'],
  recurringValue: ['recurring value / turn', 'recurring value', 'recurring', 'recurring per turn'],
  deadlineTurn: ['deadline turn', 'deadline_turn', 'deadline_turns', 'deadline', 'deadline turns'],
  penaltyValue: ['penalty value', 'penalty', 'penalty points'],
  cardType: ['card type', 'type'],
};

function normalizeHeader(header: unknown): string {
  return String(header ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function findColumnIndex(headers: string[], field: keyof typeof COLUMN_ALIASES): number {
  const aliases = COLUMN_ALIASES[field];
  return headers.findIndex((header) => aliases.includes(normalizeHeader(header)));
}

function inferCardType(
  recurringValue: number,
  deadlineTurn: number | null,
  penaltyValue: number,
): CardType {
  const hasDeadline = deadlineTurn !== null;
  const hasRecurring = recurringValue > 0;
  const hasPenalty = penaltyValue !== 0;

  if (hasDeadline && hasRecurring) return 'Mixed';
  if (hasDeadline || hasPenalty) return 'Deadline';
  if (hasRecurring) return 'Recurring';
  return 'Normal';
}

function parseNumber(value: unknown, fallback = 0): number {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseOptionalTurn(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function buildColumnMapping(headers: string[]): ColumnMappingEntry[] {
  const cardIdIdx = findColumnIndex(headers, 'cardId');
  const effortIdx = findColumnIndex(headers, 'effort');
  const completionIdx = findColumnIndex(headers, 'completionValue');
  const recurringIdx = findColumnIndex(headers, 'recurringValue');
  const deadlineIdx = findColumnIndex(headers, 'deadlineTurn');
  const penaltyIdx = findColumnIndex(headers, 'penaltyValue');
  const typeIdx = findColumnIndex(headers, 'cardType');

  const source = (idx: number) => (idx >= 0 ? headers[idx] : null);

  const mapping: ColumnMappingEntry[] = [
    { expectedField: 'Card ID', sourceColumn: source(cardIdIdx) },
    { expectedField: 'Effort (Turns Required)', sourceColumn: source(effortIdx) },
    {
      expectedField: 'Completion Value',
      sourceColumn: source(completionIdx),
      notes:
        penaltyIdx < 0 && completionIdx >= 0
          ? 'Negative values with a deadline are treated as Penalty Value; completion is set to 0.'
          : undefined,
    },
    { expectedField: 'Recurring Value / Turn', sourceColumn: source(recurringIdx) },
    { expectedField: 'Deadline Turn', sourceColumn: source(deadlineIdx) },
    {
      expectedField: 'Penalty Value',
      sourceColumn: source(penaltyIdx) ?? (completionIdx >= 0 ? headers[completionIdx] : null),
      notes:
        penaltyIdx < 0
          ? 'No dedicated penalty column; inferred from negative Completion Value when a deadline exists.'
          : undefined,
    },
    {
      expectedField: 'Card Type',
      sourceColumn: source(typeIdx),
      notes: typeIdx < 0 ? 'Inferred from recurring value, deadline, and penalty fields.' : undefined,
    },
  ];

  return mapping;
}

export function mapRowToCard(
  row: unknown[],
  headers: string[],
): CardDefinition | null {
  const cardIdIdx = findColumnIndex(headers, 'cardId');
  const effortIdx = findColumnIndex(headers, 'effort');
  const completionIdx = findColumnIndex(headers, 'completionValue');
  const recurringIdx = findColumnIndex(headers, 'recurringValue');
  const deadlineIdx = findColumnIndex(headers, 'deadlineTurn');
  const penaltyIdx = findColumnIndex(headers, 'penaltyValue');
  const typeIdx = findColumnIndex(headers, 'cardType');

  if (cardIdIdx < 0 || effortIdx < 0) return null;

  const cardId = String(row[cardIdIdx] ?? '').trim();
  if (!cardId) return null;

  const rawValue = completionIdx >= 0 ? parseNumber(row[completionIdx]) : 0;
  const deadlineTurn = deadlineIdx >= 0 ? parseOptionalTurn(row[deadlineIdx]) : null;
  const explicitPenalty = penaltyIdx >= 0 ? parseNumber(row[penaltyIdx]) : null;
  const recurringValue = recurringIdx >= 0 ? parseNumber(row[recurringIdx]) : 0;

  let completionValue = rawValue;
  let penaltyValue = explicitPenalty ?? 0;

  if (rawValue < 0) {
    completionValue = 0;
    if (explicitPenalty === null) {
      penaltyValue = rawValue;
    }
  } else if (explicitPenalty !== null) {
    penaltyValue = explicitPenalty;
  }

  const explicitType =
    typeIdx >= 0 ? String(row[typeIdx] ?? '').trim() : '';

  const cardType = (['Normal', 'Recurring', 'Deadline', 'Mixed'] as CardType[]).includes(
    explicitType as CardType,
  )
    ? (explicitType as CardType)
    : inferCardType(recurringValue, deadlineTurn, penaltyValue);

  return {
    cardId,
    effort: parseNumber(row[effortIdx]),
    completionValue,
    recurringValue,
    deadlineTurn,
    penaltyValue,
    cardType,
  };
}

export function mapRowsToCards(rows: unknown[][], headers: string[]): CardDefinition[] {
  return rows
    .map((row) => mapRowToCard(row, headers))
    .filter((card): card is CardDefinition => card !== null);
}

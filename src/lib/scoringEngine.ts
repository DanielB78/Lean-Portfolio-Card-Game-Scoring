import type {
  CardDefinition,
  CardSchedule,
  CardStatus,
  GameConfig,
  ScoringResult,
  TurnResult,
} from '../types/card';
import { DEFAULT_GAME_CONFIG } from '../types/card';
import { riskValueForCard } from './deliveryRisk';

function getCardStatus(turn: number, schedule: CardSchedule): CardStatus {
  const { startTurn, finishTurn } = schedule;

  if (startTurn === null || turn < startTurn) {
    return 'not_started';
  }

  if (finishTurn !== null && turn >= finishTurn) {
    return 'completed';
  }

  return 'in_progress';
}

function isCompletedByTurn(schedule: CardSchedule, turn: number): boolean {
  return schedule.finishTurn !== null && schedule.finishTurn <= turn;
}

/** Positive completion points only — negative spreadsheet values are deadline penalties. */
function completionPointsForCard(card: CardDefinition): number {
  return Math.max(0, card.completionValue);
}

/** In-progress chart value: completion value, recurring value, or |penalty| for deadline cards. */
function inProgressValueForCard(card: CardDefinition): number {
  return riskValueForCard(card);
}

export function calculateScoring(
  cards: CardDefinition[],
  schedules: Record<string, CardSchedule>,
  config: GameConfig = DEFAULT_GAME_CONFIG,
): ScoringResult {
  const penaltyApplied = new Set<string>();

  let cumulative = 0;
  const turnResults: TurnResult[] = [];

  for (let turn = 1; turn <= config.totalTurns; turn += 1) {
    let completionPoints = 0;
    let recurringPoints = 0;
    let penaltyPoints = 0;

    let notStarted = 0;
    let inProgress = 0;
    let completed = 0;
    let inProgressValue = 0;

    for (const card of cards) {
      const schedule = schedules[card.cardId] ?? {
        cardId: card.cardId,
        startTurn: null,
        finishTurn: null,
      };
      const status = getCardStatus(turn, schedule);

      if (status === 'not_started') notStarted += 1;
      if (status === 'in_progress') {
        inProgress += 1;
        inProgressValue += inProgressValueForCard(card);
      }
      if (status === 'completed') completed += 1;

      if (schedule.finishTurn === turn) {
        completionPoints += completionPointsForCard(card);
      }

      if (
        schedule.finishTurn !== null &&
        turn > schedule.finishTurn &&
        card.recurringValue > 0
      ) {
        recurringPoints += card.recurringValue;
      }

      if (
        card.deadlineTurn !== null &&
        card.penaltyValue < 0 &&
        turn === card.deadlineTurn &&
        !penaltyApplied.has(card.cardId)
      ) {
        const metDeadline = isCompletedByTurn(schedule, card.deadlineTurn);
        if (!metDeadline) {
          penaltyPoints += card.penaltyValue;
          penaltyApplied.add(card.cardId);
        }
      }
    }

    const pointsThisTurn = completionPoints + recurringPoints + penaltyPoints;
    cumulative += pointsThisTurn;

    turnResults.push({
      turn,
      pointsThisTurn,
      cumulativePoints: cumulative,
      notStarted,
      inProgress,
      completed,
      inProgressValue,
      completionPoints,
      recurringPoints,
      penaltyPoints,
    });
  }

  return {
    finalScore: cumulative,
    turnResults,
  };
}

export function exportTurnResultsCsv(turnResults: TurnResult[]): string {
  const headers = [
    'Turn',
    'Points This Turn',
    'Cumulative Points',
    'Cards Not Started',
    'Cards In Progress',
    'Cards Completed',
    'In Progress Value',
    'Completion Points',
    'Recurring Points',
    'Penalty Points',
  ];

  const rows = turnResults.map((row) =>
    [
      row.turn,
      row.pointsThisTurn,
      row.cumulativePoints,
      row.notStarted,
      row.inProgress,
      row.completed,
      row.inProgressValue,
      row.completionPoints,
      row.recurringPoints,
      row.penaltyPoints,
    ].join(','),
  );

  return [headers.join(','), ...rows].join('\n');
}

export function downloadCsv(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

import type { CardDefinition } from '../types/card';
import { TOTAL_TURNS } from '../types/card';

export interface RecurringValuePoint {
  turn: number;
  possibleValue: number;
}

/**
 * Cumulative recurring points if every recurring card was completed before turn 1.
 * At turn t each recurring card contributes recurringValue × t.
 */
export function calculatePossibleRecurringByTurn(
  cards: CardDefinition[],
  totalTurns: number = TOTAL_TURNS,
): RecurringValuePoint[] {
  const recurringCards = cards.filter((card) => card.recurringValue > 0);

  return Array.from({ length: totalTurns }, (_, index) => {
    const turn = index + 1;
    const possibleValue = recurringCards.reduce(
      (sum, card) => sum + card.recurringValue * turn,
      0,
    );
    return { turn, possibleValue };
  });
}

/**
 * Cumulative recurring points actually earned from completed recurring cards.
 * Uses per-turn recurring points from the scoring engine (turn after completion only).
 */
export function calculateAchievedRecurringByTurn(turnResults: { recurringPoints: number }[]): number[] {
  let cumulative = 0;
  return turnResults.map((row) => {
    cumulative += row.recurringPoints;
    return cumulative;
  });
}

import type { CardDefinition, CardSchedule, GameConfig, TurnResult } from '../types/card';
import { DEFAULT_GAME_CONFIG } from '../types/card';

/** Value at risk for a card while it is in progress. Penalties use absolute exposure. */
export function riskValueForCard(card: CardDefinition): number {
  if (card.penaltyValue < 0) {
    return Math.abs(card.penaltyValue);
  }

  if (card.completionValue > 0) {
    return card.completionValue;
  }

  if (card.recurringValue > 0) {
    return card.recurringValue;
  }

  return 0;
}

export function isCardInProgress(turn: number, schedule: CardSchedule): boolean {
  const { startTurn, finishTurn } = schedule;

  if (startTurn === null || turn < startTurn) {
    return false;
  }

  if (finishTurn !== null && turn >= finishTurn) {
    return false;
  }

  return true;
}

/** Delivery Risk Profile: sum of in-progress card values per turn. */
export function calculateDeliveryRiskByTurn(
  cards: CardDefinition[],
  schedules: Record<string, CardSchedule>,
  config: GameConfig = DEFAULT_GAME_CONFIG,
): { turn: number; value: number }[] {
  const results: { turn: number; value: number }[] = [];

  for (let turn = 1; turn <= config.totalTurns; turn += 1) {
    let value = 0;

    for (const card of cards) {
      const schedule = schedules[card.cardId] ?? {
        cardId: card.cardId,
        startTurn: null,
        finishTurn: null,
      };

      if (isCardInProgress(turn, schedule)) {
        value += riskValueForCard(card);
      }
    }

    results.push({ turn, value });
  }

  return results;
}

export function deliveryRiskFromTurnResults(
  turnResults: TurnResult[],
): { turn: number; value: number }[] {
  return turnResults.map((row) => ({
    turn: row.turn,
    value: row.inProgressValue,
  }));
}

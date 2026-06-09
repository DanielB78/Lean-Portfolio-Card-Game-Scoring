import type { CardDefinition, CardSchedule } from '../types/card';
import {
  cardHasRecurringThresholds,
  getPenaltyRequirementMetRound,
  isPenaltyOnlyCard,
  type Round2CardDefinition,
  type Round2Inputs,
} from './types';

export function round2CardsToChartDefinitions(cards: Round2CardDefinition[]): CardDefinition[] {
  return cards.map((card) => {
    const recurringThresholds = card.thresholds.filter((threshold) => threshold.isRecurring);
    const maxRecurring = recurringThresholds.length
      ? Math.max(...recurringThresholds.map((threshold) => threshold.completionValue))
      : 0;

    return {
      cardId: card.cardId,
      effort: card.thresholds.length
        ? Math.min(...card.thresholds.map((threshold) => threshold.effortThreshold))
        : card.requiredEffort ?? 0,
      completionValue: card.thresholds.length
        ? Math.max(...card.thresholds.map((threshold) => threshold.completionValue))
        : 0,
      recurringValue: maxRecurring,
      deadlineTurn: card.deadlineRound,
      penaltyValue: card.penaltyValue,
      cardType: inferRound2CardType(card),
    };
  });
}

function inferRound2CardType(card: Round2CardDefinition): CardDefinition['cardType'] {
  const hasDeadline = card.deadlineRound !== null;
  const hasRecurring = cardHasRecurringThresholds(card);
  const hasPenalty = card.penaltyValue !== 0;

  if (hasDeadline && hasRecurring) return 'Mixed';
  if (hasDeadline || hasPenalty) return 'Deadline';
  if (hasRecurring) return 'Recurring';
  return 'Normal';
}

export function round2InputsToSchedules(
  cards: Round2CardDefinition[],
  inputs: Round2Inputs,
): Record<string, CardSchedule> {
  const schedules: Record<string, CardSchedule> = {};

  for (const card of cards) {
    const input = inputs[card.cardId];
    let startTurn: number | null = null;

    if (input) {
      for (let round = 1; round <= input.effortByRound.length; round += 1) {
        if (input.effortByRound[round - 1] > 0) {
          startTurn = round;
          break;
        }
      }
    }

    let finishTurn = input?.completedRound ?? null;

    if (finishTurn === null && isPenaltyOnlyCard(card)) {
      finishTurn = getPenaltyRequirementMetRound(card, input);

      if (
        finishTurn === null &&
        startTurn !== null &&
        card.deadlineRound !== null &&
        startTurn <= card.deadlineRound
      ) {
        finishTurn = card.deadlineRound;
      }
    }

    schedules[card.cardId] = {
      cardId: card.cardId,
      startTurn,
      finishTurn,
    };
  }

  return schedules;
}

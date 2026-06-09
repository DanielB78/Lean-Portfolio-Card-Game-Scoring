import type { CardDefinition, CardSchedule } from '../types/card';
import { TOTAL_TURNS } from '../types/card';
import {
  getQuarterAssignedEffort,
  MAX_QUARTER_EFFORT,
  TOTAL_QUARTER_STEPS,
  type QuarterStage,
} from './quarterFlow';
export interface Round1CardInput {
  effortByRound: number[];
  completedRound: number | null;
}

export type Round1Inputs = Record<string, Round1CardInput>;

export type Round1Stage = QuarterStage;

export const TOTAL_ROUND1_STEPS = TOTAL_QUARTER_STEPS;

export {
  MAX_CARD_QUARTER_EFFORT,
  MAX_QUARTER_EFFORT,
  getCardQuarterEffort,
  getQuarterAssignedEffort,
  isCardQuarterEffortWithinCap,
  isQuarterEffortWithinCap,
  stepToQuarterStage,
} from './quarterFlow';

export function isRound1QuarterEffortWithinCap(
  cards: CardDefinition[],
  inputs: Round1Inputs,
  quarter: number,
): boolean {
  return getQuarterAssignedEffort(cards, inputs, quarter) <= MAX_QUARTER_EFFORT;
}

export function createEmptyRound1Inputs(cards: CardDefinition[]): Round1Inputs {
  return Object.fromEntries(
    cards.map((card) => [
      card.cardId,
      {
        effortByRound: Array.from({ length: TOTAL_TURNS }, () => 0),
        completedRound: null,
      },
    ]),
  );
}

export function getCumulativeEffort(input: Round1CardInput, throughRound: number): number {
  return input.effortByRound
    .slice(0, throughRound)
    .reduce((sum, effort) => sum + effort, 0);
}

export function getFirstCompletionQuarter(
  card: CardDefinition,
  input: Round1CardInput,
): number | null {
  if (card.effort <= 0) return null;

  for (let quarter = 1; quarter <= TOTAL_TURNS; quarter += 1) {
    if (getCumulativeEffort(input, quarter) >= card.effort) {
      return quarter;
    }
  }

  return null;
}

export function recalculateCardCompletion(
  card: CardDefinition,
  input: Round1CardInput,
): Round1CardInput {
  return {
    ...input,
    completedRound: getFirstCompletionQuarter(card, input),
  };
}

export function recalculateAllRound1Completions(
  cards: CardDefinition[],
  inputs: Round1Inputs,
): Round1Inputs {
  return Object.fromEntries(
    cards.map((card) => [
      card.cardId,
      recalculateCardCompletion(card, inputs[card.cardId]),
    ]),
  );
}

export function applyReviewCompletion(
  cards: CardDefinition[],
  inputs: Round1Inputs,
  _quarter: number,
): Round1Inputs {
  return recalculateAllRound1Completions(cards, inputs);
}

export function effortToSchedules(
  cards: CardDefinition[],
  inputs: Round1Inputs,
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

    schedules[card.cardId] = {
      cardId: card.cardId,
      startTurn,
      finishTurn: input?.completedRound ?? null,
    };
  }

  return schedules;
}

export function getRound1CardStatus(
  input: Round1CardInput,
  quarter: number,
): string {
  if (input.completedRound !== null && input.completedRound <= quarter) {
    return `Completed Q${input.completedRound}`;
  }

  const cumulative = getCumulativeEffort(input, quarter);
  if (cumulative > 0) {
    return 'In progress';
  }

  return 'Not started';
}

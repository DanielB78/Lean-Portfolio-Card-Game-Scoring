import type { CardDefinition, CardSchedule } from '../types/card';
import { TOTAL_TURNS } from '../types/card';
import { TOTAL_QUARTER_STEPS, type QuarterStage } from './quarterFlow';

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

export function reconcileCardCompletion(
  card: CardDefinition,
  input: Round1CardInput,
): Round1CardInput {
  if (input.completedRound === null) return input;

  const cumulative = getCumulativeEffort(input, input.completedRound);
  if (card.effort > 0 && cumulative < card.effort) {
    return { ...input, completedRound: null };
  }

  return input;
}

export function applyReviewCompletion(
  cards: CardDefinition[],
  inputs: Round1Inputs,
  quarter: number,
): Round1Inputs {
  const next = { ...inputs };

  for (const card of cards) {
    const input = next[card.cardId];
    if (!input || input.completedRound !== null) continue;

    const cumulative = getCumulativeEffort(input, quarter);
    if (card.effort > 0 && cumulative >= card.effort) {
      next[card.cardId] = { ...input, completedRound: quarter };
    }
  }

  return next;
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

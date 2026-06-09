import { TOTAL_TURNS } from '../types/card';

export type QuarterStage = 'prep' | 'review';

export const TOTAL_QUARTER_STEPS = TOTAL_TURNS * 2;

export const MAX_QUARTER_EFFORT = 16;

export const MAX_CARD_QUARTER_EFFORT = 4;

export interface EffortByRoundInput {
  effortByRound: number[];
}

export function stepToQuarterStage(step: number): { quarter: number; stage: QuarterStage } {
  return {
    quarter: Math.floor(step / 2) + 1,
    stage: step % 2 === 0 ? 'prep' : 'review',
  };
}

export function getCardQuarterEffort(input: EffortByRoundInput, quarter: number): number {
  return input.effortByRound[quarter - 1] ?? 0;
}

export function isCardQuarterEffortWithinCap(effort: number): boolean {
  return effort <= MAX_CARD_QUARTER_EFFORT;
}

export function areAllCardsQuarterEffortWithinCap(
  cards: Array<{ cardId: string }>,
  inputs: Record<string, EffortByRoundInput>,
  quarter: number,
): boolean {
  return cards.every((card) => {
    const input = inputs[card.cardId];
    if (!input) return true;
    return isCardQuarterEffortWithinCap(getCardQuarterEffort(input, quarter));
  });
}

export function getQuarterAssignedEffort(
  cards: Array<{ cardId: string }>,
  inputs: Record<string, EffortByRoundInput>,
  quarter: number,
): number {
  return cards.reduce((sum, card) => {
    const input = inputs[card.cardId];
    if (!input) return sum;
    return sum + (input.effortByRound[quarter - 1] ?? 0);
  }, 0);
}

export function isQuarterEffortWithinCap(
  cards: Array<{ cardId: string }>,
  inputs: Record<string, EffortByRoundInput>,
  quarter: number,
): boolean {
  return (
    getQuarterAssignedEffort(cards, inputs, quarter) <= MAX_QUARTER_EFFORT &&
    areAllCardsQuarterEffortWithinCap(cards, inputs, quarter)
  );
}

import { TOTAL_TURNS } from '../types/card';

export interface Round2Threshold {
  effortThreshold: number;
  completionValue: number;
  isRecurring: boolean;
}

export interface Round2CardDefinition {
  cardId: string;
  thresholds: Round2Threshold[];
  deadlineRound: number | null;
  penaltyValue: number;
  requiredEffort: number | null;
}

export interface Round2CardInput {
  effortByRound: number[];
  completedRound: number | null;
  recurringPerTurn: number | null;
}

export type Round2Inputs = Record<string, Round2CardInput>;

export function createEmptyRound2Inputs(cards: Round2CardDefinition[]): Round2Inputs {
  return Object.fromEntries(
    cards.map((card) => [
      card.cardId,
      {
        effortByRound: Array.from({ length: TOTAL_TURNS }, () => 0),
        completedRound: null,
        recurringPerTurn: null,
      },
    ]),
  );
}

export function cardHasRecurringThresholds(card: Round2CardDefinition): boolean {
  return card.thresholds.some((threshold) => threshold.isRecurring);
}

export function getMinimumThreshold(card: Round2CardDefinition): number | null {
  if (card.thresholds.length === 0) return null;
  return Math.min(...card.thresholds.map((threshold) => threshold.effortThreshold));
}

export function getCumulativeEffort(input: Round2CardInput, throughRound: number): number {
  return input.effortByRound
    .slice(0, throughRound)
    .reduce((sum, effort) => sum + effort, 0);
}

export function getMatchingThreshold(
  card: Round2CardDefinition,
  cumulativeEffort: number,
): Round2Threshold | null {
  const sorted = [...card.thresholds].sort(
    (left, right) => right.effortThreshold - left.effortThreshold,
  );

  return sorted.find((threshold) => cumulativeEffort >= threshold.effortThreshold) ?? null;
}

export function canCompleteCard(card: Round2CardDefinition, cumulativeEffort: number): boolean {
  const minimum = getMinimumThreshold(card);
  return minimum !== null && cumulativeEffort >= minimum;
}

export function getInProgressValue(
  card: Round2CardDefinition,
  cumulativeEffort: number,
): number {
  const matched = getMatchingThreshold(card, cumulativeEffort);
  if (matched) return matched.completionValue;
  if (card.penaltyValue < 0) return Math.abs(card.penaltyValue);
  return 0;
}

export function formatThresholdLabel(threshold: Round2Threshold): string {
  const suffix = threshold.isRecurring ? ' recurring' : '';
  return `${threshold.effortThreshold}→${threshold.completionValue}${suffix}`;
}

export function isPenaltyOnlyCard(card: Round2CardDefinition): boolean {
  return card.thresholds.length === 0 && card.deadlineRound !== null;
}

export function getPenaltyRequirementMetRound(
  card: Round2CardDefinition,
  input: Round2CardInput,
): number | null {
  if (!isPenaltyOnlyCard(card)) return null;

  const required = card.requiredEffort ?? 0;
  if (required <= 0) return null;

  for (let round = 1; round <= input.effortByRound.length; round += 1) {
    if (getCumulativeEffort(input, round) >= required) {
      return round;
    }
  }

  return null;
}

export function isPenaltyRequirementMet(
  card: Round2CardDefinition,
  input: Round2CardInput,
  throughRound: number,
): boolean {
  const metRound = getPenaltyRequirementMetRound(card, input);
  return metRound !== null && metRound <= throughRound;
}

export function isRound2CardCompleted(
  card: Round2CardDefinition,
  input: Round2CardInput,
  throughRound: number,
): boolean {
  if (input.completedRound !== null && input.completedRound <= throughRound) {
    return true;
  }

  return isPenaltyRequirementMet(card, input, throughRound);
}

export function getRound2CardCompletedRound(
  card: Round2CardDefinition,
  input: Round2CardInput,
): number | null {
  if (input.completedRound !== null) {
    return input.completedRound;
  }

  return getPenaltyRequirementMetRound(card, input);
}

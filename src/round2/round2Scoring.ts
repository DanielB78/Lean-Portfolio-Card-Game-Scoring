/**
 * Round 2 scoring engine — threshold-based completion, recurring, and deadline penalties.
 * See CODE_STRUCTURE.md for Round 2 card loading and chart adapter details.
 */
import type { GameConfig, ScoringResult, TurnResult } from '../types/card';
import { DEFAULT_GAME_CONFIG } from '../types/card';
import {
  canCompleteCard,
  getCumulativeEffort,
  getInProgressValue,
  getMatchingThreshold,
  isRound2CardCompleted,
  type Round2CardDefinition,
  type Round2CardInput,
  type Round2Inputs,
} from './types';

function cumulativeAtTurn(input: Round2CardInput, turn: number): number {
  return getCumulativeEffort(input, turn);
}

export function calculateRound2Scoring(
  cards: Round2CardDefinition[],
  inputs: Round2Inputs,
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
      const input = inputs[card.cardId];
      const cumulativeEffort = cumulativeAtTurn(input, turn);

      if (isRound2CardCompleted(card, input, turn)) {
        completed += 1;
      } else if (cumulativeEffort > 0) {
        inProgress += 1;
        inProgressValue += getInProgressValue(card, cumulativeEffort);
      } else {
        notStarted += 1;
      }

      if (input.completedRound === turn) {
        const matched = getMatchingThreshold(card, cumulativeEffort);
        if (matched) {
          completionPoints += matched.completionValue;
        }
      }

      if (input.completedRound !== null && turn > input.completedRound) {
        const recurring = input.recurringPerTurn ?? 0;
        if (recurring > 0) {
          recurringPoints += recurring;
        }
      }

      if (
        card.deadlineRound !== null &&
        card.penaltyValue < 0 &&
        turn === card.deadlineRound &&
        !penaltyApplied.has(card.cardId)
      ) {
        const required = card.requiredEffort ?? 0;
        if (cumulativeEffort < required) {
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

export function completeRound2Card(
  card: Round2CardDefinition,
  input: Round2CardInput,
  round: number,
): Round2CardInput | null {
  if (input.completedRound !== null) return null;

  const cumulativeEffort = cumulativeAtTurn(input, round);
  if (!canCompleteCard(card, cumulativeEffort)) return null;

  const matched = getMatchingThreshold(card, cumulativeEffort);
  if (!matched) return null;

  return {
    ...input,
    completedRound: round,
    recurringPerTurn: matched.isRecurring ? matched.completionValue : null,
  };
}

export function undoRound2CardCompletion(input: Round2CardInput): Round2CardInput | null {
  if (input.completedRound === null) return null;

  return {
    ...input,
    completedRound: null,
    recurringPerTurn: null,
  };
}

export function toggleRound2CardCompletion(
  card: Round2CardDefinition,
  input: Round2CardInput,
  round: number,
): Round2CardInput | null {
  if (input.completedRound !== null) {
    return undoRound2CardCompletion(input);
  }

  return completeRound2Card(card, input, round);
}

export { canCompleteCard, getCumulativeEffort, getMatchingThreshold, getMinimumThreshold } from './types';

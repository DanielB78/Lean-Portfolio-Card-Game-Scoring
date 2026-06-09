import type { CardDefinition, CardSchedule } from '../types/card';
import { TOTAL_TURNS } from '../types/card';

export interface QuarterAction {
  started: string[];
  finished: string[];
}

export function createEmptyQuarterSelections(): QuarterAction[] {
  return Array.from({ length: TOTAL_TURNS }, () => ({
    started: [],
    finished: [],
  }));
}

export function getStartQuarter(
  selections: QuarterAction[],
  cardId: string,
): number | null {
  for (let index = 0; index < selections.length; index += 1) {
    if (selections[index].started.includes(cardId)) {
      return index + 1;
    }
  }
  return null;
}

export function getFinishQuarter(
  selections: QuarterAction[],
  cardId: string,
): number | null {
  for (let index = 0; index < selections.length; index += 1) {
    if (selections[index].finished.includes(cardId)) {
      return index + 1;
    }
  }
  return null;
}

export function selectionsToSchedules(
  cards: CardDefinition[],
  selections: QuarterAction[],
): Record<string, CardSchedule> {
  const schedules: Record<string, CardSchedule> = Object.fromEntries(
    cards.map((card) => [card.cardId, { cardId: card.cardId, startTurn: null, finishTurn: null }]),
  );

  selections.forEach((quarter, index) => {
    const turn = index + 1;
    quarter.started.forEach((cardId) => {
      if (schedules[cardId]) {
        schedules[cardId].startTurn = turn;
      }
    });
    quarter.finished.forEach((cardId) => {
      if (schedules[cardId]) {
        schedules[cardId].finishTurn = turn;
      }
    });
  });

  return schedules;
}

export function cardsAvailableToStart(
  cards: CardDefinition[],
  selections: QuarterAction[],
  quarterNumber: number,
): CardDefinition[] {
  return cards.filter((card) => {
    const startQuarter = getStartQuarter(selections, card.cardId);
    return startQuarter === null || startQuarter === quarterNumber;
  });
}

export function cardsAvailableToFinish(
  cards: CardDefinition[],
  selections: QuarterAction[],
  quarterNumber: number,
): CardDefinition[] {
  return cards.filter((card) => {
    const startQuarter = getStartQuarter(selections, card.cardId);
    const finishQuarter = getFinishQuarter(selections, card.cardId);

    if (startQuarter === null || startQuarter >= quarterNumber) {
      return false;
    }

    return finishQuarter === null || finishQuarter === quarterNumber;
  });
}

export function toggleCardStart(
  selections: QuarterAction[],
  quarterIndex: number,
  cardId: string,
): QuarterAction[] {
  const next = selections.map((quarter) => ({
    started: [...quarter.started],
    finished: [...quarter.finished],
  }));
  const quarter = next[quarterIndex];
  const quarterNumber = quarterIndex + 1;
  const isSelected = quarter.started.includes(cardId);

  if (isSelected) {
    quarter.started = quarter.started.filter((id) => id !== cardId);
    for (let index = quarterIndex; index < TOTAL_TURNS; index += 1) {
      next[index].finished = next[index].finished.filter((id) => id !== cardId);
    }
    return next;
  }

  next.forEach((entry) => {
    entry.started = entry.started.filter((id) => id !== cardId);
  });
  quarter.started = [...quarter.started, cardId];

  next.forEach((entry, index) => {
    if (index + 1 <= quarterNumber) {
      entry.finished = entry.finished.filter((id) => id !== cardId);
    }
  });

  return next;
}

export function toggleCardFinish(
  selections: QuarterAction[],
  quarterIndex: number,
  cardId: string,
): QuarterAction[] {
  const next = selections.map((quarter) => ({
    started: [...quarter.started],
    finished: [...quarter.finished],
  }));
  const quarter = next[quarterIndex];
  const isSelected = quarter.finished.includes(cardId);

  if (isSelected) {
    quarter.finished = quarter.finished.filter((id) => id !== cardId);
    return next;
  }

  next.forEach((entry) => {
    entry.finished = entry.finished.filter((id) => id !== cardId);
  });
  quarter.finished = [...quarter.finished, cardId];

  return next;
}

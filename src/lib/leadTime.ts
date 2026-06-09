import type { CardDefinition, CardSchedule } from '../types/card';

export interface LeadTimeBucket {
  leadTime: number;
  count: number;
}

export interface CumulativeValueByLeadTime {
  leadTime: number;
  cumulativeValue: number;
}

function cardValueField(card: CardDefinition): number {
  return Math.max(0, card.completionValue);
}

function completedCardsWithLeadTime(
  cards: CardDefinition[],
  schedules: Record<string, CardSchedule>,
): { leadTime: number; value: number }[] {
  const results: { leadTime: number; value: number }[] = [];

  for (const card of cards) {
    const schedule = schedules[card.cardId];
    const { startTurn, finishTurn } = schedule ?? {};

    if (startTurn === null || startTurn === undefined) continue;
    if (finishTurn === null || finishTurn === undefined) continue;

    results.push({
      leadTime: finishTurn - startTurn + 1,
      value: cardValueField(card),
    });
  }

  return results;
}

/** Count completed cards grouped by lead time (finish − start + 1). */
export function calculateLeadTimeHistogram(
  cards: CardDefinition[],
  schedules: Record<string, CardSchedule>,
): LeadTimeBucket[] {
  const counts = new Map<number, number>();

  for (const { leadTime } of completedCardsWithLeadTime(cards, schedules)) {
    counts.set(leadTime, (counts.get(leadTime) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .sort(([a], [b]) => a - b)
    .map(([leadTime, count]) => ({ leadTime, count }));
}

/**
 * Cumulative card value delivered within N turns of lead time.
 * CumulativeValue(T) = sum of card values for all completed cards with lead time ≤ T.
 */
export function calculateCumulativeValueByLeadTime(
  cards: CardDefinition[],
  schedules: Record<string, CardSchedule>,
): CumulativeValueByLeadTime[] {
  const completed = completedCardsWithLeadTime(cards, schedules);
  if (completed.length === 0) return [];

  const maxLeadTime = Math.max(...completed.map((entry) => entry.leadTime));
  const results: CumulativeValueByLeadTime[] = [];

  for (let leadTime = 1; leadTime <= maxLeadTime; leadTime += 1) {
    const cumulativeValue = completed
      .filter((entry) => entry.leadTime <= leadTime)
      .reduce((sum, entry) => sum + entry.value, 0);

    results.push({ leadTime, cumulativeValue });
  }

  return results;
}

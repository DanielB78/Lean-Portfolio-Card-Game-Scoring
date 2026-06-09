import { useMemo } from 'react';
import type { CardDefinition, TurnResult } from '../types/card';
import {
  calculateAchievedRecurringByTurn,
  calculatePossibleRecurringByTurn,
} from '../lib/possibleValue';

interface ScoreSummaryProps {
  finalScore: number;
  turnResults: TurnResult[];
  cards: CardDefinition[];
}

export function ScoreSummary({ finalScore, turnResults, cards }: ScoreSummaryProps) {
  const totals = useMemo(() => {
    let completionPoints = 0;
    let recurringPoints = 0;
    let penaltyPoints = 0;

    for (const row of turnResults) {
      completionPoints += row.completionPoints;
      recurringPoints += row.recurringPoints;
      penaltyPoints += row.penaltyPoints;
    }

    return { completionPoints, recurringPoints, penaltyPoints };
  }, [turnResults]);

  const achievedRecurring = useMemo(
    () => calculateAchievedRecurringByTurn(turnResults),
    [turnResults],
  );
  const possibleByTurn = useMemo(() => calculatePossibleRecurringByTurn(cards), [cards]);

  const achievedRecurringFinal = achievedRecurring[achievedRecurring.length - 1] ?? 0;
  const possibleRecurringFinal = possibleByTurn[possibleByTurn.length - 1]?.possibleValue ?? 0;

  return (
    <div className="score-summary">
      <div className="score-display score-summary-hero">
        <span className="score-label">Final score</span>
        <span className="score-value">{finalScore}</span>
      </div>

      <dl className="score-summary-grid">
        <div className="score-summary-item">
          <dt>Completion points</dt>
          <dd>{totals.completionPoints}</dd>
        </div>
        <div className="score-summary-item">
          <dt>Recurring points</dt>
          <dd>{totals.recurringPoints}</dd>
        </div>
        <div className="score-summary-item">
          <dt>Penalties</dt>
          <dd className={totals.penaltyPoints < 0 ? 'negative' : undefined}>
            {totals.penaltyPoints}
          </dd>
        </div>
        <div className="score-summary-item">
          <dt>Achieved recurring (end)</dt>
          <dd>{achievedRecurringFinal}</dd>
        </div>
        <div className="score-summary-item">
          <dt>Possible recurring (end)</dt>
          <dd>{possibleRecurringFinal}</dd>
        </div>
      </dl>
    </div>
  );
}

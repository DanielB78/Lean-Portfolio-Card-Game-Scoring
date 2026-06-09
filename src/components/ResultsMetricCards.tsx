import type { ScoringResult } from '../types/card';

interface ResultsMetricCardsProps {
  scoring: ScoringResult;
}

export function ResultsMetricCards({ scoring }: ResultsMetricCardsProps) {
  const lastTurn = scoring.turnResults[scoring.turnResults.length - 1];
  const totalPenalties = scoring.turnResults.reduce((sum, turn) => sum + turn.penaltyPoints, 0);

  return (
    <div className="metric-cards">
      <article className="metric-card">
        <p className="metric-card-label">Final Score</p>
        <p className="metric-card-value">{scoring.finalScore}</p>
      </article>
      <article className="metric-card">
        <p className="metric-card-label">Completed Cards</p>
        <p className="metric-card-value">{lastTurn?.completed ?? 0}</p>
      </article>
      <article className="metric-card">
        <p className="metric-card-label">Active Cards</p>
        <p className="metric-card-value">{lastTurn?.inProgress ?? 0}</p>
      </article>
      <article className="metric-card">
        <p className="metric-card-label">Total Penalties</p>
        <p className={`metric-card-value${totalPenalties < 0 ? ' metric-card-value-negative' : ''}`}>
          {totalPenalties}
        </p>
      </article>
    </div>
  );
}

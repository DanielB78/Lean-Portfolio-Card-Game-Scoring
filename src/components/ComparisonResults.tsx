import { Charts } from './Charts';
import { SubmitTeamScore } from './SubmitTeamScore';
import type { ComparisonRoundData } from '../types/comparison';

interface ComparisonResultsProps {
  round1: ComparisonRoundData | null;
  round2: ComparisonRoundData | null;
  onGoToRound1Results: () => void;
  onGoToRound2Results: () => void;
  onGoHome: () => void;
}

function ComparisonColumn({
  roundLabel,
  data,
}: {
  roundLabel: string;
  data: ComparisonRoundData | null;
}) {
  return (
    <section className="comparison-column" aria-labelledby={`comparison-heading-${roundLabel}`}>
      <h2 id={`comparison-heading-${roundLabel}`} className="comparison-round-heading">
        {roundLabel}
      </h2>

      <p className="comparison-final-score">
        Final Score:{' '}
        <strong>{data?.scoring.finalScore ?? '—'}</strong>
      </p>

      {data ? (
        <div className="comparison-column-charts">
          <Charts
            turnResults={data.scoring.turnResults}
            cards={data.cards}
            schedules={data.schedules}
            useEffortBasedDeliveryRisk={data.useEffortBasedDeliveryRisk}
          />
        </div>
      ) : (
        <p className="muted comparison-empty">No results available for this round yet.</p>
      )}
    </section>
  );
}

export function ComparisonResults({
  round1,
  round2,
  onGoToRound1Results,
  onGoToRound2Results,
  onGoHome,
}: ComparisonResultsProps) {
  return (
    <div className="comparison-results">
      <header className="comparison-header">
        <div className="comparison-header-text">
          <h1 className="comparison-title">Results Comparison</h1>
          <p className="comparison-subtitle">
            Compare final scores and performance charts from Round 1 and Round 2 side by side.
          </p>
        </div>

        <nav className="comparison-nav" aria-label="Comparison navigation">
          <button type="button" className="btn btn-secondary" onClick={onGoToRound1Results}>
            Round 1 Results
          </button>
          <button type="button" className="btn btn-secondary" onClick={onGoToRound2Results}>
            Round 2 Results
          </button>
          <button type="button" className="btn btn-ghost" onClick={onGoHome}>
            Home
          </button>
        </nav>
      </header>

      <div className="comparison-columns">
        <ComparisonColumn roundLabel="ROUND 1" data={round1} />
        <ComparisonColumn roundLabel="ROUND 2" data={round2} />
      </div>

      <SubmitTeamScore
        round1FinalScore={round1?.scoring.finalScore ?? null}
        round2FinalScore={round2?.scoring.finalScore ?? null}
      />
    </div>
  );
}

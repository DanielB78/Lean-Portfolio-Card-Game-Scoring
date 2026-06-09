import type { CardDefinition, CardSchedule } from '../types/card';
import type { ScoringResult } from '../types/card';
import { downloadCsv, exportTurnResultsCsv } from '../lib/scoringEngine';
import { Charts } from './Charts';
import { ResultsAccordion } from './ResultsAccordion';
import { ResultsMetricCards } from './ResultsMetricCards';
import { ScoreSummary } from './ScoreSummary';
import { ScoreBreakdownTable, TurnResultsTable } from './TurnResultsTable';

interface ResultsDashboardProps {
  scoring: ScoringResult;
  cards: CardDefinition[];
  schedules: Record<string, CardSchedule>;
  useEffortBasedDeliveryRisk?: boolean;
}

export function ResultsDashboard({
  scoring,
  cards,
  schedules,
  useEffortBasedDeliveryRisk = false,
}: ResultsDashboardProps) {
  const { turnResults, finalScore } = scoring;

  const handleDownload = () => {
    downloadCsv(exportTurnResultsCsv(turnResults), 'turn-results.csv');
  };

  return (
    <div className="results-dashboard">
      <ResultsMetricCards scoring={scoring} />

      <ResultsAccordion
        title="Score Summary"
        summary={`Final score: ${finalScore}`}
        defaultOpen
      >
        <ScoreSummary finalScore={finalScore} turnResults={turnResults} cards={cards} />
      </ResultsAccordion>

      <ResultsAccordion title="Graphs" summary="All charts" defaultOpen>
        <Charts
          turnResults={turnResults}
          cards={cards}
          schedules={schedules}
          useEffortBasedDeliveryRisk={useEffortBasedDeliveryRisk}
        />
      </ResultsAccordion>

      <ResultsAccordion title="Detailed Results / Tables" defaultOpen>
        <div className="detailed-results">
          <div className="detailed-results-toolbar row-between">
            <p className="muted detailed-results-note">
              Turn-by-turn activity and score breakdown after Quarter 8.
            </p>
            <button type="button" className="btn" onClick={handleDownload}>
              Download CSV
            </button>
          </div>

          <h4 className="detailed-table-heading">Turn-by-turn results</h4>
          <TurnResultsTable turnResults={turnResults} />

          <h4 className="detailed-table-heading">Score breakdown</h4>
          <ScoreBreakdownTable turnResults={turnResults} />
        </div>
      </ResultsAccordion>
    </div>
  );
}

/**
 * Builds Supabase graph_data_points rows from scoring results. Logic mirrors Charts.tsx
 * so saved graphs match what users see on the Compare page.
 */
import { calculateAchievedRecurringByTurn, calculatePossibleRecurringByTurn } from './possibleValue';
import { calculateDeliveryRiskByTurn, deliveryRiskFromTurnResults } from './deliveryRisk';
import { calculateLeadTimeHistogram } from './leadTime';
import type { ComparisonRoundData } from '../types/comparison';
import type { GraphDataPointInsert, GraphType, RoundMode } from '../types/savedGraphData';

export function buildGraphDataPoints(
  teamName: string,
  roundMode: RoundMode,
  data: ComparisonRoundData,
  submissionId: string,
  createdAt: string,
): GraphDataPointInsert[] {
  const { cards, schedules, scoring, useEffortBasedDeliveryRisk = false } = data;
  const { turnResults } = scoring;
  const rows: GraphDataPointInsert[] = [];

  const pushRow = (
    graphType: GraphType,
    turnNumber: number | null,
    values: Record<string, number>,
  ) => {
    rows.push({
      submission_id: submissionId,
      team_name: teamName,
      round_mode: roundMode,
      graph_type: graphType,
      turn_number: turnNumber,
      values,
      created_at: createdAt,
    });
  };

  const possibleByTurn = calculatePossibleRecurringByTurn(cards);
  const achievedRecurring = calculateAchievedRecurringByTurn(turnResults);

  for (const row of turnResults) {
    const index = row.turn - 1;
    pushRow('delay_cost_repeatable', row.turn, {
      'Achieved Value': achievedRecurring[index] ?? 0,
      'Possible Value': possibleByTurn[index]?.possibleValue ?? 0,
    });

    pushRow('cumulative_value', row.turn, {
      cumulative: row.cumulativePoints,
    });

    pushRow('cumulative_flow', row.turn, {
      'Not started': row.notStarted,
      'In progress': row.inProgress,
      Completed: row.completed,
    });

    let completionCumulative = 0;
    let recurringCumulative = 0;
    let penaltyCumulative = 0;

    for (const turn of turnResults) {
      if (turn.turn <= row.turn) {
        completionCumulative += turn.completionPoints;
        recurringCumulative += turn.recurringPoints;
        penaltyCumulative += turn.penaltyPoints;
      }
    }

    pushRow('score_breakdown', row.turn, {
      'Completion points': completionCumulative,
      'Recurring points': recurringCumulative,
      Penalties: penaltyCumulative,
    });
  }

  const deliveryRiskData = useEffortBasedDeliveryRisk
    ? deliveryRiskFromTurnResults(turnResults)
    : calculateDeliveryRiskByTurn(cards, schedules);

  for (const point of deliveryRiskData) {
    pushRow('delivery_risk', point.turn, {
      value: point.value,
    });
  }

  const leadTimeHistogramData = calculateLeadTimeHistogram(cards, schedules);
  for (const bucket of leadTimeHistogramData) {
    pushRow('lead_time_histogram', null, {
      leadTime: bucket.leadTime,
      count: bucket.count,
    });
  }

  return rows;
}

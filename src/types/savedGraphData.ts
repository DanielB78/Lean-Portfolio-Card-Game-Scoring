export type RoundMode = 'round1' | 'round2';

export type GraphType =
  | 'delay_cost_repeatable'
  | 'cumulative_value'
  | 'cumulative_flow'
  | 'lead_time_histogram'
  | 'delivery_risk'
  | 'score_breakdown';

export interface GraphDataPointRow {
  id?: number;
  submission_id: string;
  team_name: string;
  round_mode: RoundMode;
  graph_type: GraphType;
  turn_number: number | null;
  values: Record<string, number>;
  created_at: string;
}

export interface GraphDataPointInsert {
  submission_id: string;
  team_name: string;
  round_mode: RoundMode;
  graph_type: GraphType;
  turn_number: number | null;
  values: Record<string, number>;
  created_at: string;
}

export const GRAPH_TYPE_LABELS: Record<GraphType, string> = {
  delay_cost_repeatable: 'Delay Cost for Repeatable Value',
  cumulative_value: 'Cumulative Value',
  cumulative_flow: 'Cumulative Flow Diagram',
  lead_time_histogram: 'Lead Time Histogram',
  delivery_risk: 'Delivery Risk Profile',
  score_breakdown: 'Score breakdown (cumulative)',
};

export interface SavedChartBundle {
  roundMode: RoundMode;
  teamName: string;
  createdAt: string;
  delayCostRepeatable: Array<Record<string, number>>;
  cumulativeValue: Array<Record<string, number>>;
  cumulativeFlow: Array<Record<string, number>>;
  leadTimeHistogram: Array<Record<string, number>>;
  deliveryRisk: Array<Record<string, number>>;
  scoreBreakdown: Array<Record<string, number>>;
}

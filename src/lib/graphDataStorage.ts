import { getSupabaseClient } from './supabase';
import { buildGraphDataPoints } from './graphDataBuilder';
import type { ComparisonRoundData } from '../types/comparison';
import type { GraphDataPointRow, RoundMode, SavedChartBundle } from '../types/savedGraphData';

export async function saveGraphDataForSubmission(
  teamName: string,
  round1Data: ComparisonRoundData,
  round2Data: ComparisonRoundData,
): Promise<{ error: Error | null }> {
  const supabase = getSupabaseClient();
  const createdAt = new Date().toISOString();

  const { data: submission, error: submissionError } = await supabase
    .from('graph_submissions')
    .insert([{ team_name: teamName, created_at: createdAt }])
    .select('id')
    .single();

  if (submissionError || !submission) {
    console.error('Error creating graph submission:', submissionError);
    return { error: submissionError ?? new Error('Failed to create graph submission') };
  }

  const submissionId = submission.id as string;
  const round1Points = buildGraphDataPoints(teamName, 'round1', round1Data, submissionId, createdAt);
  const round2Points = buildGraphDataPoints(teamName, 'round2', round2Data, submissionId, createdAt);
  const allPoints = [...round1Points, ...round2Points];

  const { error: pointsError } = await supabase.from('graph_data_points').insert(allPoints);

  if (pointsError) {
    console.error('Error saving graph data points:', pointsError);
    return { error: pointsError };
  }

  return { error: null };
}

export async function fetchSavedTeamNames(): Promise<{ teams: string[]; error: Error | null }> {
  const supabase = getSupabaseClient();

  const [graphResult, scoresResult] = await Promise.all([
    supabase.from('graph_data_points').select('team_name'),
    supabase.from('scores').select('team_name'),
  ]);

  if (graphResult.error) {
    console.error('Error fetching graph team names:', graphResult.error);
  }

  if (scoresResult.error) {
    console.error('Error fetching score team names:', scoresResult.error);
  }

  if (graphResult.error && scoresResult.error) {
    return { teams: [], error: graphResult.error ?? scoresResult.error };
  }

  const teams = new Set<string>();

  for (const row of graphResult.data ?? []) {
    if (row.team_name) {
      teams.add(row.team_name as string);
    }
  }

  for (const row of scoresResult.data ?? []) {
    if (row.team_name) {
      teams.add(row.team_name as string);
    }
  }

  return { teams: [...teams].sort(), error: null };
}

export async function loadSavedGraphData(
  teamName: string,
  roundMode: RoundMode,
): Promise<{ bundle: SavedChartBundle | null; error: Error | null }> {
  const supabase = getSupabaseClient();

  const { data: latestRow, error: latestError } = await supabase
    .from('graph_data_points')
    .select('created_at')
    .eq('team_name', teamName)
    .eq('round_mode', roundMode)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestError) {
    console.error('Error loading latest graph dataset:', latestError);
    return { bundle: null, error: latestError };
  }

  if (!latestRow) {
    return { bundle: null, error: null };
  }

  const createdAt = latestRow.created_at as string;

  const { data, error } = await supabase
    .from('graph_data_points')
    .select('submission_id, team_name, round_mode, graph_type, turn_number, values, created_at')
    .eq('team_name', teamName)
    .eq('round_mode', roundMode)
    .eq('created_at', createdAt);

  if (error) {
    console.error('Error loading graph data points:', error);
    return { bundle: null, error };
  }

  if (!data || data.length === 0) {
    return { bundle: null, error: null };
  }

  return {
    bundle: bundleFromRows(data as GraphDataPointRow[], teamName, roundMode, createdAt),
    error: null,
  };
}

function bundleFromRows(
  rows: GraphDataPointRow[],
  teamName: string,
  roundMode: RoundMode,
  createdAt: string,
): SavedChartBundle {
  const byType = new Map<string, GraphDataPointRow[]>();

  for (const row of rows) {
    const existing = byType.get(row.graph_type) ?? [];
    existing.push(row);
    byType.set(row.graph_type, existing);
  }

  const sortByTurn = (items: GraphDataPointRow[]) =>
    [...items].sort((left, right) => {
      if (left.turn_number === null) return 1;
      if (right.turn_number === null) return -1;
      return left.turn_number - right.turn_number;
    });

  const toTurnSeries = (items: GraphDataPointRow[]) =>
    sortByTurn(items).map((row) => ({
      turn: row.turn_number ?? 0,
      ...row.values,
    }));

  const leadTimeRows = byType.get('lead_time_histogram') ?? [];
  const leadTimeHistogram = leadTimeRows
    .map((row) => ({
      leadTime: row.values.leadTime ?? 0,
      count: row.values.count ?? 0,
    }))
    .sort((left, right) => left.leadTime - right.leadTime);

  return {
    roundMode,
    teamName,
    createdAt,
    delayCostRepeatable: toTurnSeries(byType.get('delay_cost_repeatable') ?? []),
    cumulativeValue: toTurnSeries(byType.get('cumulative_value') ?? []),
    cumulativeFlow: toTurnSeries(byType.get('cumulative_flow') ?? []),
    leadTimeHistogram,
    deliveryRisk: toTurnSeries(byType.get('delivery_risk') ?? []),
    scoreBreakdown: toTurnSeries(byType.get('score_breakdown') ?? []),
  };
}

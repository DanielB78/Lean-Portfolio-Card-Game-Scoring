import type { CardDefinition, CardSchedule, ScoringResult } from './card';

export interface ComparisonRoundData {
  scoring: ScoringResult;
  cards: CardDefinition[];
  schedules: Record<string, CardSchedule>;
  useEffortBasedDeliveryRisk?: boolean;
}

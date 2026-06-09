export const TOTAL_TURNS = 8;

export type CardType = 'Normal' | 'Recurring' | 'Deadline' | 'Mixed';

export interface CardDefinition {
  cardId: string;
  effort: number;
  completionValue: number;
  recurringValue: number;
  deadlineTurn: number | null;
  penaltyValue: number;
  cardType: CardType;
}

export interface CardSchedule {
  cardId: string;
  startTurn: number | null;
  finishTurn: number | null;
}

export type CardStatus = 'not_started' | 'in_progress' | 'completed';

export interface ColumnMappingEntry {
  expectedField: string;
  sourceColumn: string | null;
  notes?: string;
}

export interface TurnResult {
  turn: number;
  pointsThisTurn: number;
  cumulativePoints: number;
  notStarted: number;
  inProgress: number;
  completed: number;
  inProgressValue: number;
  completionPoints: number;
  recurringPoints: number;
  penaltyPoints: number;
}

export interface ScoringResult {
  finalScore: number;
  turnResults: TurnResult[];
}

export interface GameConfig {
  totalTurns: number;
}

export const DEFAULT_GAME_CONFIG: GameConfig = {
  totalTurns: TOTAL_TURNS,
};

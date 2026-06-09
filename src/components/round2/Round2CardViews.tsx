import type { Round2CardDefinition, Round2CardInput } from '../../round2/types';
import {
  canCompleteCard,
  getCumulativeEffort,
  getRound2CardCompletedRound,
  isPenaltyOnlyCard,
  isRound2CardCompleted,
} from '../../round2/types';
import {
  isCardQuarterEffortWithinCap,
  MAX_CARD_QUARTER_EFFORT,
} from '../../lib/quarterFlow';

const CARD_EFFORT_VALIDATION_MESSAGE = `Maximum effort per card is ${MAX_CARD_QUARTER_EFFORT} per quarter.`;

export interface Round2CardUiState {
  cumulativeEffort: number;
  isCompleted: boolean;
  isEffortLocked: boolean;
  isPenaltyOnly: boolean;
  eligible: boolean;
  canToggleComplete: boolean;
  status: string;
  effortThisQuarter: number;
}

export function getRound2CardUiState(
  card: Round2CardDefinition,
  input: Round2CardInput,
  activeQuarter: number,
): Round2CardUiState {
  const cumulativeEffort = getCumulativeEffort(input, activeQuarter);
  const isPenaltyOnly = isPenaltyOnlyCard(card);
  const isCompleted = isRound2CardCompleted(card, input, activeQuarter);
  const isEffortLocked = input.completedRound !== null;
  const completedRound = getRound2CardCompletedRound(card, input);
  const eligible = canCompleteCard(card, cumulativeEffort) && !isCompleted;
  const status = isCompleted && completedRound !== null
    ? `Completed Q${completedRound}`
    : cumulativeEffort > 0
      ? 'In progress'
      : 'Not started';

  return {
    cumulativeEffort,
    isCompleted,
    isEffortLocked,
    isPenaltyOnly,
    eligible,
    canToggleComplete: isCompleted || eligible,
    status,
    effortThisQuarter: input.effortByRound[activeQuarter - 1] || 0,
  };
}

interface Round2PrepItemProps {
  card: Round2CardDefinition;
  input: Round2CardInput;
  activeQuarter: number;
  onUpdateEffort: (cardId: string, effort: number) => void;
}

interface Round2ReviewItemProps {
  card: Round2CardDefinition;
  input: Round2CardInput;
  activeQuarter: number;
  onToggleComplete: (cardId: string) => void;
}

function Round2CompleteControl({
  cardId,
  state,
  onToggleComplete,
  mobile = false,
}: {
  cardId: string;
  state: Round2CardUiState;
  onToggleComplete: (cardId: string) => void;
  mobile?: boolean;
}) {
  if (state.isPenaltyOnly) {
    return mobile ? (
      <span className="muted round2-mobile-penalty">Penalty only</span>
    ) : (
      <span className="muted">Penalty only</span>
    );
  }

  if (!state.isCompleted && !state.eligible) {
    return mobile ? null : <span className="muted">—</span>;
  }

  return (
    <button
      type="button"
      className={`btn btn-secondary round2-complete-btn${mobile ? ' round2-complete-btn-mobile' : ''}${
        state.isCompleted ? ' round2-complete-btn-undo' : ''
      }`}
      aria-pressed={state.isCompleted}
      onClick={() => onToggleComplete(cardId)}
    >
      {state.isCompleted ? 'Undo Complete' : 'Complete'}
    </button>
  );
}

export function Round2TableRow({
  card,
  input,
  activeQuarter,
  onUpdateEffort,
}: Round2PrepItemProps) {
  const state = getRound2CardUiState(card, input, activeQuarter);
  const isEffortOverCardCap = !isCardQuarterEffortWithinCap(state.effortThisQuarter);

  return (
    <tr>
      <td className="mono">{card.cardId}</td>
      <td>
        <div className="card-effort-cell">
          <input
            type="number"
            min={0}
            className="turn-input round2-effort-input"
            value={state.effortThisQuarter || ''}
            disabled={state.isEffortLocked}
            onChange={(event) => onUpdateEffort(card.cardId, Number(event.target.value) || 0)}
          />
          {isEffortOverCardCap && (
            <p className="status error card-effort-validation">{CARD_EFFORT_VALIDATION_MESSAGE}</p>
          )}
        </div>
      </td>
      <td>{state.cumulativeEffort}</td>
      <td>{state.status}</td>
    </tr>
  );
}

export function Round2MobileCard({
  card,
  input,
  activeQuarter,
  onUpdateEffort,
}: Round2PrepItemProps) {
  const state = getRound2CardUiState(card, input, activeQuarter);
  const isEffortOverCardCap = !isCardQuarterEffortWithinCap(state.effortThisQuarter);

  return (
    <article className="round2-mobile-card">
      <h3 className="round2-mobile-card-id mono">{card.cardId}</h3>

      <div className="round2-mobile-fields">
        <div className="round2-mobile-field">
          <label htmlFor={`round2-effort-${card.cardId}`}>Effort this quarter</label>
          <input
            id={`round2-effort-${card.cardId}`}
            type="number"
            min={0}
            inputMode="numeric"
            className="turn-input round2-effort-input round2-effort-input-mobile"
            value={state.effortThisQuarter || ''}
            disabled={state.isEffortLocked}
            onChange={(event) => onUpdateEffort(card.cardId, Number(event.target.value) || 0)}
          />
          {isEffortOverCardCap && (
            <p className="status error card-effort-validation">{CARD_EFFORT_VALIDATION_MESSAGE}</p>
          )}
        </div>

        <div className="round2-mobile-field">
          <span className="round2-mobile-label">Cumulative effort</span>
          <span className="round2-mobile-value">{state.cumulativeEffort}</span>
        </div>

        <div className="round2-mobile-field">
          <span className="round2-mobile-label">Status</span>
          <span className="round2-mobile-value">{state.status}</span>
        </div>
      </div>
    </article>
  );
}

export function Round2ReviewTableRow({
  card,
  input,
  activeQuarter,
  onToggleComplete,
}: Round2ReviewItemProps) {
  const state = getRound2CardUiState(card, input, activeQuarter);

  return (
    <tr>
      <td className="mono">{card.cardId}</td>
      <td>{state.effortThisQuarter || '—'}</td>
      <td>{state.cumulativeEffort}</td>
      <td>{state.status}</td>
      <td>
        <Round2CompleteControl
          cardId={card.cardId}
          state={state}
          onToggleComplete={onToggleComplete}
        />
      </td>
    </tr>
  );
}

export function Round2ReviewMobileCard({
  card,
  input,
  activeQuarter,
  onToggleComplete,
}: Round2ReviewItemProps) {
  const state = getRound2CardUiState(card, input, activeQuarter);

  return (
    <article className="round2-mobile-card">
      <h3 className="round2-mobile-card-id mono">{card.cardId}</h3>
      <div className="round2-mobile-fields">
        <div className="round2-mobile-field">
          <span className="round2-mobile-label">Effort this quarter</span>
          <span className="round2-mobile-value">{state.effortThisQuarter || '—'}</span>
        </div>
        <div className="round2-mobile-field">
          <span className="round2-mobile-label">Cumulative effort</span>
          <span className="round2-mobile-value">{state.cumulativeEffort}</span>
        </div>
        <div className="round2-mobile-field">
          <span className="round2-mobile-label">Status</span>
          <span className="round2-mobile-value">{state.status}</span>
        </div>
      </div>

      <div className="round2-mobile-actions">
        {(state.isPenaltyOnly || state.isCompleted || state.eligible) && (
          <Round2CompleteControl
            cardId={card.cardId}
            state={state}
            onToggleComplete={onToggleComplete}
            mobile
          />
        )}
      </div>
    </article>
  );
}

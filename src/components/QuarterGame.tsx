import { useMemo, useState } from 'react';
import type { CardDefinition } from '../types/card';
import { TOTAL_TURNS } from '../types/card';
import {
  getCumulativeEffort,
  getQuarterAssignedEffort,
  getRound1CardStatus,
  isCardQuarterEffortWithinCap,
  isQuarterEffortWithinCap,
  MAX_CARD_QUARTER_EFFORT,
  MAX_QUARTER_EFFORT,
  stepToQuarterStage,
  type Round1CardInput,
  type Round1Inputs,
} from '../lib/round1Effort';
import { filterByCardIdSearch } from '../lib/cardIdSearch';
import { CardIdSearch } from './CardIdSearch';
import { QuarterProgress } from './QuarterProgress';

interface QuarterGameProps {
  cards: CardDefinition[];
  inputs: Round1Inputs;
  gameStep: number;
  onGameStepChange: (step: number) => void;
  onInputsChange: (inputs: Round1Inputs) => void;
  onRestart: () => void;
  onViewResults: () => void;
}

function getReviewResult(input: Round1CardInput, activeQuarter: number, cumulativeEffort: number): string {
  const completedThisQuarter = input.completedRound === activeQuarter;
  const alreadyCompleted =
    input.completedRound !== null && input.completedRound < activeQuarter;

  if (completedThisQuarter) return 'Completed this quarter';
  if (alreadyCompleted) return `Completed Q${input.completedRound}`;
  if (cumulativeEffort > 0) return 'Still in progress';
  return 'No effort assigned';
}

export function QuarterGame({
  cards,
  inputs,
  gameStep,
  onGameStepChange,
  onInputsChange,
  onRestart,
  onViewResults,
}: QuarterGameProps) {
  const { quarter: activeQuarter, stage } = stepToQuarterStage(gameStep);
  const [searchQuery, setSearchQuery] = useState('');
  const filteredCards = useMemo(
    () => filterByCardIdSearch(cards, searchQuery),
    [cards, searchQuery],
  );
  const searchMatchCount = searchQuery.trim()
    ? filterByCardIdSearch(cards, searchQuery).length
    : cards.length;

  const isFirstStep = gameStep === 0;
  const isFinalReview = activeQuarter === TOTAL_TURNS && stage === 'review';
  const assignedQuarterEffort = useMemo(
    () => getQuarterAssignedEffort(cards, inputs, activeQuarter),
    [cards, inputs, activeQuarter],
  );
  const isPrepEffortOverCap =
    stage === 'prep' && !isQuarterEffortWithinCap(cards, inputs, activeQuarter);
  const isNextDisabled = isPrepEffortOverCap;

  const updateEffort = (cardId: string, effort: number) => {
    const current = inputs[cardId];
    if (!current || current.completedRound !== null) return;

    const effortByRound = [...current.effortByRound];
    effortByRound[activeQuarter - 1] = Math.max(0, effort);

    onInputsChange({
      ...inputs,
      [cardId]: {
        ...current,
        effortByRound,
      },
    });
  };

  const stageLabel = stage === 'prep' ? 'Prep' : 'Review';

  return (
    <section className="panel quarter-game">
      <div className="panel-header row-between quarter-game-toolbar">
        <div className="round2-score-chip quarter-score-chip">
          <span className="muted">Current quarter</span>
          <strong>Q{activeQuarter} · {stageLabel}</strong>
        </div>
        <button type="button" className="btn btn-danger quarter-restart-btn" onClick={onRestart}>
          Restart Game
        </button>
      </div>

      <QuarterProgress currentStep={gameStep} totalSteps={TOTAL_TURNS * 2} />

      <div className="round1-step-nav">
        <button
          type="button"
          className="btn btn-secondary round1-step-btn"
          disabled={isFirstStep}
          onClick={() => onGameStepChange(gameStep - 1)}
        >
          Previous
        </button>
        <p className="round1-step-label">
          Quarter {activeQuarter} · {stageLabel}
        </p>
        {isFinalReview ? (
          <button
            type="button"
            className="btn btn-primary round1-step-btn"
            onClick={onViewResults}
          >
            View Results
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-primary round1-step-btn"
            disabled={isNextDisabled}
            onClick={() => onGameStepChange(gameStep + 1)}
          >
            Next
          </button>
        )}
      </div>

      <div
        id="quarter-panel"
        role="tabpanel"
        className={`quarter-panel${isPrepEffortOverCap ? ' quarter-panel-invalid' : ''}`}
      >
        <header className="quarter-panel-header">
          <h3>
            Quarter {activeQuarter} — {stageLabel}
            {activeQuarter === TOTAL_TURNS && stage === 'review' && (
              <span className="quarter-complete-badge">Final</span>
            )}
          </h3>
          <p className="muted quarter-panel-meta">
            {stage === 'prep'
              ? 'Enter effort for each card this quarter.'
              : 'Cards meeting required effort are completed automatically.'}
          </p>
        </header>

        {stage === 'prep' && (
          <div className="round1-effort-budget" aria-live="polite">
            <p className="round1-effort-usage">
              Assigned Effort: {assignedQuarterEffort} / {MAX_QUARTER_EFFORT}
            </p>
            {isPrepEffortOverCap && (
              <p className="status error round1-effort-validation">
                Total assigned effort exceeds the maximum allowed effort of {MAX_QUARTER_EFFORT}.
                Reduce the assigned effort before continuing.
              </p>
            )}
          </div>
        )}

        <div className="card-table-search-sticky">
          <CardIdSearch
            id="round1-card-search"
            value={searchQuery}
            onChange={setSearchQuery}
            totalCount={cards.length}
            matchCount={searchMatchCount}
          />
        </div>

        {stage === 'prep' ? (
          <Round1PrepViews
            cards={filteredCards}
            inputs={inputs}
            activeQuarter={activeQuarter}
            onUpdateEffort={updateEffort}
          />
        ) : (
          <Round1ReviewViews
            cards={filteredCards}
            inputs={inputs}
            activeQuarter={activeQuarter}
          />
        )}
      </div>

      {isFinalReview && (
        <p className="muted quarter-game-footer">
          Game complete. Use View Results to see scores and charts, or Previous to revisit earlier
          quarters.
        </p>
      )}
    </section>
  );
}

function Round1PrepViews({
  cards,
  inputs,
  activeQuarter,
  onUpdateEffort,
}: {
  cards: CardDefinition[];
  inputs: Round1Inputs;
  activeQuarter: number;
  onUpdateEffort: (cardId: string, effort: number) => void;
}) {
  return (
    <>
      <div className="round1-desktop-table table-scroll card-table-scroll">
        <table className="results-table card-data-table">
          <thead>
            <tr>
              <th>Card ID</th>
              <th>Required effort</th>
              <th>Effort this quarter</th>
              <th>Cumulative effort</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {cards.map((card) => (
              <Round1PrepTableRow
                key={card.cardId}
                card={card}
                input={inputs[card.cardId]}
                activeQuarter={activeQuarter}
                onUpdateEffort={onUpdateEffort}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="round1-mobile-cards">
        {cards.map((card) => (
          <Round1PrepMobileCard
            key={card.cardId}
            card={card}
            input={inputs[card.cardId]}
            activeQuarter={activeQuarter}
            onUpdateEffort={onUpdateEffort}
          />
        ))}
      </div>
    </>
  );
}

function Round1ReviewViews({
  cards,
  inputs,
  activeQuarter,
}: {
  cards: CardDefinition[];
  inputs: Round1Inputs;
  activeQuarter: number;
}) {
  return (
    <>
      <div className="round1-desktop-table table-scroll card-table-scroll">
        <table className="results-table card-data-table">
          <thead>
            <tr>
              <th>Card ID</th>
              <th>Required effort</th>
              <th>Cumulative effort</th>
              <th>Status</th>
              <th>Review result</th>
            </tr>
          </thead>
          <tbody>
            {cards.map((card) => (
              <Round1ReviewTableRow
                key={card.cardId}
                card={card}
                input={inputs[card.cardId]}
                activeQuarter={activeQuarter}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="round1-mobile-cards">
        {cards.map((card) => (
          <Round1ReviewMobileCard
            key={card.cardId}
            card={card}
            input={inputs[card.cardId]}
            activeQuarter={activeQuarter}
          />
        ))}
      </div>
    </>
  );
}

const CARD_EFFORT_VALIDATION_MESSAGE = `Maximum effort per card is ${MAX_CARD_QUARTER_EFFORT} per quarter.`;

function Round1PrepTableRow({
  card,
  input,
  activeQuarter,
  onUpdateEffort,
}: {
  card: CardDefinition;
  input: Round1CardInput;
  activeQuarter: number;
  onUpdateEffort: (cardId: string, effort: number) => void;
}) {
  const cumulativeEffort = getCumulativeEffort(input, activeQuarter);
  const isCompleted = input.completedRound !== null;
  const effortThisQuarter = input.effortByRound[activeQuarter - 1] ?? 0;
  const isEffortOverCardCap = !isCardQuarterEffortWithinCap(effortThisQuarter);

  return (
    <tr>
      <td className="mono">{card.cardId}</td>
      <td>{card.effort}</td>
      <td>
        <div className="card-effort-cell">
          <input
            type="number"
            min={0}
            className="turn-input card-effort-input"
            value={effortThisQuarter || ''}
            disabled={isCompleted}
            onChange={(event) => onUpdateEffort(card.cardId, Number(event.target.value) || 0)}
          />
          {isEffortOverCardCap && (
            <p className="status error card-effort-validation">{CARD_EFFORT_VALIDATION_MESSAGE}</p>
          )}
        </div>
      </td>
      <td>{cumulativeEffort}</td>
      <td>{getRound1CardStatus(input, activeQuarter)}</td>
    </tr>
  );
}

function Round1PrepMobileCard({
  card,
  input,
  activeQuarter,
  onUpdateEffort,
}: {
  card: CardDefinition;
  input: Round1CardInput;
  activeQuarter: number;
  onUpdateEffort: (cardId: string, effort: number) => void;
}) {
  const cumulativeEffort = getCumulativeEffort(input, activeQuarter);
  const isCompleted = input.completedRound !== null;
  const effortThisQuarter = input.effortByRound[activeQuarter - 1] ?? 0;
  const isEffortOverCardCap = !isCardQuarterEffortWithinCap(effortThisQuarter);

  return (
    <article className="card-mobile-panel">
      <h3 className="card-mobile-id mono">{card.cardId}</h3>
      <div className="card-mobile-fields">
        <div className="card-mobile-field">
          <span className="card-mobile-label">Required effort</span>
          <span className="card-mobile-value">{card.effort}</span>
        </div>
        <div className="card-mobile-field">
          <label htmlFor={`round1-effort-${card.cardId}`}>Effort this quarter</label>
          <input
            id={`round1-effort-${card.cardId}`}
            type="number"
            min={0}
            inputMode="numeric"
            className="turn-input card-effort-input card-effort-input-mobile"
            value={effortThisQuarter || ''}
            disabled={isCompleted}
            onChange={(event) => onUpdateEffort(card.cardId, Number(event.target.value) || 0)}
          />
          {isEffortOverCardCap && (
            <p className="status error card-effort-validation">{CARD_EFFORT_VALIDATION_MESSAGE}</p>
          )}
        </div>
        <div className="card-mobile-field">
          <span className="card-mobile-label">Cumulative effort</span>
          <span className="card-mobile-value">{cumulativeEffort}</span>
        </div>
        <div className="card-mobile-field">
          <span className="card-mobile-label">Status</span>
          <span className="card-mobile-value">{getRound1CardStatus(input, activeQuarter)}</span>
        </div>
      </div>
    </article>
  );
}

function Round1ReviewTableRow({
  card,
  input,
  activeQuarter,
}: {
  card: CardDefinition;
  input: Round1CardInput;
  activeQuarter: number;
}) {
  const cumulativeEffort = getCumulativeEffort(input, activeQuarter);
  const status = getRound1CardStatus(input, activeQuarter);
  const reviewResult = getReviewResult(input, activeQuarter, cumulativeEffort);

  return (
    <tr>
      <td className="mono">{card.cardId}</td>
      <td>{card.effort}</td>
      <td>{cumulativeEffort}</td>
      <td>{status}</td>
      <td>{reviewResult}</td>
    </tr>
  );
}

function Round1ReviewMobileCard({
  card,
  input,
  activeQuarter,
}: {
  card: CardDefinition;
  input: Round1CardInput;
  activeQuarter: number;
}) {
  const cumulativeEffort = getCumulativeEffort(input, activeQuarter);
  const status = getRound1CardStatus(input, activeQuarter);
  const reviewResult = getReviewResult(input, activeQuarter, cumulativeEffort);

  return (
    <article className="card-mobile-panel">
      <h3 className="card-mobile-id mono">{card.cardId}</h3>
      <div className="card-mobile-fields">
        <div className="card-mobile-field">
          <span className="card-mobile-label">Required effort</span>
          <span className="card-mobile-value">{card.effort}</span>
        </div>
        <div className="card-mobile-field">
          <span className="card-mobile-label">Cumulative effort</span>
          <span className="card-mobile-value">{cumulativeEffort}</span>
        </div>
        <div className="card-mobile-field">
          <span className="card-mobile-label">Status</span>
          <span className="card-mobile-value">{status}</span>
        </div>
        <div className="card-mobile-field">
          <span className="card-mobile-label">Review result</span>
          <span className="card-mobile-value">{reviewResult}</span>
        </div>
      </div>
    </article>
  );
}

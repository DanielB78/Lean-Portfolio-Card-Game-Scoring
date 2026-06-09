import { useMemo } from 'react';
import type { Round2CardDefinition, Round2Inputs } from '../../round2/types';
import { calculateRound2Scoring, toggleRound2CardCompletion } from '../../round2/round2Scoring';
import { TOTAL_TURNS } from '../../types/card';
import {
  getQuarterAssignedEffort,
  isQuarterEffortWithinCap,
  MAX_QUARTER_EFFORT,
  stepToQuarterStage,
  TOTAL_QUARTER_STEPS,
} from '../../lib/quarterFlow';
import { CardIdSearch, useCardIdSearch } from '../CardIdSearch';
import { QuarterProgress } from '../QuarterProgress';
import {
  Round2MobileCard,
  Round2ReviewMobileCard,
  Round2ReviewTableRow,
  Round2TableRow,
} from './Round2CardViews';

interface Round2GameProps {
  cards: Round2CardDefinition[];
  inputs: Round2Inputs;
  gameStep: number;
  onGameStepChange: (step: number) => void;
  onInputsChange: (inputs: Round2Inputs) => void;
  onRestart: () => void;
  onViewResults: () => void;
}

export function Round2Game({
  cards,
  inputs,
  gameStep,
  onGameStepChange,
  onInputsChange,
  onRestart,
  onViewResults,
}: Round2GameProps) {
  const { quarter: activeQuarter, stage } = stepToQuarterStage(gameStep);
  const scoring = useMemo(() => calculateRound2Scoring(cards, inputs), [cards, inputs]);
  const cumulativeScoreForQuarter =
    scoring.turnResults[activeQuarter - 1]?.cumulativePoints ?? 0;
  const quarterTurnResult = scoring.turnResults[activeQuarter - 1];
  const {
    query: searchQuery,
    setQuery: setSearchQuery,
    filtered: filteredCards,
    totalCount,
    matchCount,
  } = useCardIdSearch(cards);

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

  const handleToggleComplete = (cardId: string) => {
    const card = cards.find((entry) => entry.cardId === cardId);
    const current = inputs[cardId];
    if (!card || !current) return;

    const updated = toggleRound2CardCompletion(card, current, activeQuarter);
    if (!updated) return;

    onInputsChange({
      ...inputs,
      [cardId]: updated,
    });
  };

  const prepCardProps = {
    activeQuarter,
    onUpdateEffort: updateEffort,
  };

  const reviewCardProps = {
    activeQuarter,
    onToggleComplete: handleToggleComplete,
  };

  const stageLabel = stage === 'prep' ? 'Prep' : 'Review';

  return (
    <section className="panel quarter-game">
      <div className="panel-header row-between quarter-game-toolbar">
        <div className="round2-score-chip quarter-score-chip">
          <span className="muted">Q{activeQuarter} cumulative</span>
          <strong>{cumulativeScoreForQuarter}</strong>
        </div>
        <button type="button" className="btn btn-danger quarter-restart-btn" onClick={onRestart}>
          Restart Game
        </button>
      </div>

      <QuarterProgress currentStep={gameStep} totalSteps={TOTAL_QUARTER_STEPS} />

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
        id="round2-quarter-panel"
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
              : 'Review quarter results and complete eligible cards before advancing.'}
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

        {stage === 'review' && quarterTurnResult && (
          <div className="round2-review-summary">
            <p className="round2-review-summary-item">
              Points this quarter: <strong>{quarterTurnResult.pointsThisTurn}</strong>
            </p>
            <p className="round2-review-summary-item">
              Cumulative score: <strong>{quarterTurnResult.cumulativePoints}</strong>
            </p>
          </div>
        )}

        <div className="card-table-search-sticky">
          <CardIdSearch
            id="round2-card-search"
            value={searchQuery}
            onChange={setSearchQuery}
            totalCount={totalCount}
            matchCount={matchCount}
          />
        </div>

        {stage === 'prep' ? (
          <>
            <div className="round2-desktop-table table-scroll card-table-scroll">
              <table className="results-table card-data-table">
                <thead>
                  <tr>
                    <th>Card ID</th>
                    <th>Effort this quarter</th>
                    <th>Cumulative effort</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCards.map((card) => (
                    <Round2TableRow
                      key={card.cardId}
                      card={card}
                      input={inputs[card.cardId]}
                      {...prepCardProps}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="round2-mobile-cards">
              {filteredCards.map((card) => (
                <Round2MobileCard
                  key={card.cardId}
                  card={card}
                  input={inputs[card.cardId]}
                  {...prepCardProps}
                />
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="round2-desktop-table table-scroll card-table-scroll">
              <table className="results-table card-data-table">
                <thead>
                  <tr>
                    <th>Card ID</th>
                    <th>Effort this quarter</th>
                    <th>Cumulative effort</th>
                    <th>Status</th>
                    <th>Completion</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCards.map((card) => (
                    <Round2ReviewTableRow
                      key={card.cardId}
                      card={card}
                      input={inputs[card.cardId]}
                      {...reviewCardProps}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="round2-mobile-cards">
              {filteredCards.map((card) => (
                <Round2ReviewMobileCard
                  key={card.cardId}
                  card={card}
                  input={inputs[card.cardId]}
                  {...reviewCardProps}
                />
              ))}
            </div>
          </>
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

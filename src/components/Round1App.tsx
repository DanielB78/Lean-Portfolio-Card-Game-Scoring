import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CardDefinition } from '../types/card';
import { calculateScoring } from '../lib/scoringEngine';
import { loadCardsFromUrl } from '../lib/spreadsheetLoader';
import {
  applyReviewCompletion,
  createEmptyRound1Inputs,
  effortToSchedules,
  isQuarterEffortWithinCap,
  reconcileCardCompletion,
  stepToQuarterStage,
  TOTAL_ROUND1_STEPS,
  type Round1Inputs,
} from '../lib/round1Effort';
import { QuarterGame } from './QuarterGame';
import { ResultsDashboard } from './ResultsDashboard';
import type { ComparisonRoundData } from '../types/comparison';
import { scrollToTopAfterRender } from '../lib/scrollToTop';

type Round1Tab = 'game' | 'results';

interface Round1AppProps {
  onContinueToRound2?: () => void;
  onComparisonDataChange?: (data: ComparisonRoundData) => void;
  showResultsTabRequest?: number;
}

export function Round1App({
  onContinueToRound2,
  onComparisonDataChange,
  showResultsTabRequest = 0,
}: Round1AppProps) {
  const [cards, setCards] = useState<CardDefinition[]>([]);
  const [inputs, setInputs] = useState<Round1Inputs>({});
  const [gameSessionKey, setGameSessionKey] = useState(0);
  const [gameStep, setGameStep] = useState(0);
  const [activeTab, setActiveTab] = useState<Round1Tab>('game');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const schedules = useMemo(() => effortToSchedules(cards, inputs), [cards, inputs]);

  const applyLoadResult = useCallback((result: Awaited<ReturnType<typeof loadCardsFromUrl>>) => {
    setCards(result.cards);
    setInputs(createEmptyRound1Inputs(result.cards));
    setGameStep(0);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadDefaultSpreadsheet() {
      try {
        const result = await loadCardsFromUrl('/cards.xlsx');
        if (!cancelled) {
          applyLoadResult(result);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load spreadsheet');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDefaultSpreadsheet();
    return () => {
      cancelled = true;
    };
  }, [applyLoadResult]);

  const scoring = useMemo(() => calculateScoring(cards, schedules), [cards, schedules]);

  useEffect(() => {
    if (loading || error || !onComparisonDataChange) return;

    onComparisonDataChange({
      scoring,
      cards,
      schedules,
      useEffortBasedDeliveryRisk: false,
    });
  }, [loading, error, scoring, cards, schedules, onComparisonDataChange]);

  useEffect(() => {
    if (showResultsTabRequest > 0) {
      setActiveTab('results');
    }
  }, [showResultsTabRequest]);

  useEffect(() => {
    scrollToTopAfterRender();
  }, [activeTab]);

  const handleInputsChange = (nextInputs: Round1Inputs) => {
    const reconciled = Object.fromEntries(
      cards.map((card) => [
        card.cardId,
        reconcileCardCompletion(card, nextInputs[card.cardId]),
      ]),
    );
    setInputs(reconciled);
  };

  const handleGameStepChange = (nextStep: number) => {
    if (nextStep < 0 || nextStep >= TOTAL_ROUND1_STEPS) return;

    const { quarter, stage } = stepToQuarterStage(gameStep);

    if (nextStep === gameStep + 1 && stage === 'prep') {
      if (!isQuarterEffortWithinCap(cards, inputs, quarter)) {
        return;
      }

      setInputs((current) => applyReviewCompletion(cards, current, quarter));
    }

    setGameStep(nextStep);
  };

  const handleRestart = () => {
    setInputs(createEmptyRound1Inputs(cards));
    setGameStep(0);
    setGameSessionKey((key) => key + 1);
  };

  return (
    <>
      <header className="round-page-header">
        <div className="round-page-header-text">
          <h1 className="round-page-title">Round 1 Scoring</h1>
          <p className="round-page-subtitle">
            Manage effort allocation, review completions, and track portfolio performance.
          </p>
        </div>

        {!loading && !error && (
          <nav className="section-tabs" role="tablist" aria-label="Round 1 sections">
            <button
              type="button"
              role="tab"
              id="round1-tab-game"
              aria-selected={activeTab === 'game'}
              aria-controls="round1-tabpanel-game"
              className={`section-tab${activeTab === 'game' ? ' section-tab-active' : ''}`}
              onClick={() => setActiveTab('game')}
            >
              Game
            </button>
            <button
              type="button"
              role="tab"
              id="round1-tab-results"
              aria-selected={activeTab === 'results'}
              aria-controls="round1-tabpanel-results"
              className={`section-tab${activeTab === 'results' ? ' section-tab-active' : ''}`}
              onClick={() => setActiveTab('results')}
            >
              Results
            </button>
          </nav>
        )}
      </header>

      {loading && <p className="status">Loading card database…</p>}
      {error && <p className="status error">{error}</p>}

      {!loading && !error && (
        <>
          <div
            id="round1-tabpanel-game"
            role="tabpanel"
            aria-labelledby="round1-tab-game"
            hidden={activeTab !== 'game'}
            className="tab-panel"
          >
            <QuarterGame
              key={gameSessionKey}
              cards={cards}
              inputs={inputs}
              gameStep={gameStep}
              onGameStepChange={handleGameStepChange}
              onInputsChange={handleInputsChange}
              onRestart={handleRestart}
              onViewResults={() => setActiveTab('results')}
            />
          </div>

          <div
            id="round1-tabpanel-results"
            role="tabpanel"
            aria-labelledby="round1-tab-results"
            hidden={activeTab !== 'results'}
            className="tab-panel"
          >
            <ResultsDashboard scoring={scoring} cards={cards} schedules={schedules} />
            {onContinueToRound2 && (
              <div className="results-continue-footer">
                <button
                  type="button"
                  className="btn btn-primary results-continue-btn"
                  onClick={onContinueToRound2}
                >
                  Continue to Round 2
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}

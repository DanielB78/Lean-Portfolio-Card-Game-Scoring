import { useCallback, useEffect, useMemo, useState } from 'react';
import { ResultsDashboard } from '../ResultsDashboard';
import { Round2Game } from './Round2Game';
import { round2CardsToChartDefinitions, round2InputsToSchedules } from '../../round2/chartAdapter';
import { loadRound2CardsFromUrl } from '../../round2/loadRound2Cards';
import { calculateRound2Scoring } from '../../round2/round2Scoring';
import { createEmptyRound2Inputs, type Round2CardDefinition, type Round2Inputs } from '../../round2/types';
import {
  isQuarterEffortWithinCap,
  stepToQuarterStage,
  TOTAL_QUARTER_STEPS,
} from '../../lib/quarterFlow';
import type { ComparisonRoundData } from '../../types/comparison';
import { scrollToTopAfterRender } from '../../lib/scrollToTop';

type Round2Tab = 'game' | 'results';

interface Round2AppProps {
  showGameTabRequest?: number;
  showResultsTabRequest?: number;
  onComparisonDataChange?: (data: ComparisonRoundData) => void;
  onCompareRounds?: () => void;
}

export function Round2App({
  showGameTabRequest = 0,
  showResultsTabRequest = 0,
  onComparisonDataChange,
  onCompareRounds,
}: Round2AppProps) {
  const [cards, setCards] = useState<Round2CardDefinition[]>([]);
  const [inputs, setInputs] = useState<Round2Inputs>({});
  const [gameStep, setGameStep] = useState(0);
  const [activeTab, setActiveTab] = useState<Round2Tab>('game');
  const [gameSessionKey, setGameSessionKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (showGameTabRequest > 0) {
      setActiveTab('game');
    }
  }, [showGameTabRequest]);

  useEffect(() => {
    if (showResultsTabRequest > 0) {
      setActiveTab('results');
    }
  }, [showResultsTabRequest]);

  useEffect(() => {
    scrollToTopAfterRender();
  }, [activeTab]);

  const applyLoadedCards = useCallback((loadedCards: Round2CardDefinition[]) => {
    setCards(loadedCards);
    setInputs(createEmptyRound2Inputs(loadedCards));
    setGameStep(0);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadRound2Spreadsheet() {
      try {
        const loadedCards = await loadRound2CardsFromUrl('/cards-round2.xlsx');
        if (!cancelled) {
          applyLoadedCards(loadedCards);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load Round 2 spreadsheet');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadRound2Spreadsheet();
    return () => {
      cancelled = true;
    };
  }, [applyLoadedCards]);

  const scoring = useMemo(() => calculateRound2Scoring(cards, inputs), [cards, inputs]);
  const chartCards = useMemo(() => round2CardsToChartDefinitions(cards), [cards]);
  const schedules = useMemo(() => round2InputsToSchedules(cards, inputs), [cards, inputs]);

  useEffect(() => {
    if (loading || error || !onComparisonDataChange) return;

    onComparisonDataChange({
      scoring,
      cards: chartCards,
      schedules,
      useEffortBasedDeliveryRisk: true,
    });
  }, [loading, error, scoring, chartCards, schedules, onComparisonDataChange]);

  const handleGameStepChange = (nextStep: number) => {
    if (nextStep < 0 || nextStep >= TOTAL_QUARTER_STEPS) return;

    const { quarter, stage } = stepToQuarterStage(gameStep);

    if (nextStep === gameStep + 1 && stage === 'prep') {
      if (!isQuarterEffortWithinCap(cards, inputs, quarter)) {
        return;
      }
    }

    setGameStep(nextStep);
  };

  const handleRestart = () => {
    setInputs(createEmptyRound2Inputs(cards));
    setGameStep(0);
    setGameSessionKey((key) => key + 1);
  };

  return (
    <>
      <header className="round-page-header">
        <div className="round-page-header-text">
          <h1 className="round-page-title">Round 2 Scoring</h1>
          <p className="round-page-subtitle">
            Manage effort allocation, review completions, and track portfolio performance.
          </p>
        </div>

        {!loading && !error && (
          <nav className="section-tabs" role="tablist" aria-label="Round 2 sections">
            <button
              type="button"
              role="tab"
              id="round2-tab-game"
              aria-selected={activeTab === 'game'}
              aria-controls="round2-tabpanel-game"
              className={`section-tab${activeTab === 'game' ? ' section-tab-active' : ''}`}
              onClick={() => setActiveTab('game')}
            >
              Game
            </button>
            <button
              type="button"
              role="tab"
              id="round2-tab-results"
              aria-selected={activeTab === 'results'}
              aria-controls="round2-tabpanel-results"
              className={`section-tab${activeTab === 'results' ? ' section-tab-active' : ''}`}
              onClick={() => setActiveTab('results')}
            >
              Results
            </button>
          </nav>
        )}
      </header>

      {loading && <p className="status">Loading Round 2 card database…</p>}
      {error && <p className="status error">{error}</p>}

      {!loading && !error && (
        <>
          <div
            id="round2-tabpanel-game"
            role="tabpanel"
            aria-labelledby="round2-tab-game"
            hidden={activeTab !== 'game'}
            className="tab-panel"
          >
            <Round2Game
              key={gameSessionKey}
              cards={cards}
              inputs={inputs}
              gameStep={gameStep}
              onGameStepChange={handleGameStepChange}
              onInputsChange={setInputs}
              onRestart={handleRestart}
              onViewResults={() => setActiveTab('results')}
            />
          </div>

          <div
            id="round2-tabpanel-results"
            role="tabpanel"
            aria-labelledby="round2-tab-results"
            hidden={activeTab !== 'results'}
            className="tab-panel"
          >
            <ResultsDashboard
              scoring={scoring}
              cards={chartCards}
              schedules={schedules}
              useEffortBasedDeliveryRisk
            />
            {onCompareRounds && (
              <div className="results-continue-footer">
                <button
                  type="button"
                  className="btn btn-primary results-continue-btn"
                  onClick={onCompareRounds}
                >
                  Compare Round 1 and Round 2
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}

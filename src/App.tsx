import { useEffect, useState } from 'react';
import { ComparisonResults } from './components/ComparisonResults';
import { LoadGraphDataPage } from './components/LoadGraphDataPage';
import { LandingPage } from './components/LandingPage';
import { Round1App } from './components/Round1App';
import { Round2App } from './components/round2/Round2App';
import { scrollToTopAfterRender } from './lib/scrollToTop';
import type { ComparisonRoundData } from './types/comparison';
import './App.css';
type AppView = 'landing' | 'game' | 'load-graphs';
type GameSection = 'round1' | 'round2' | 'comparison';

export default function App() {
  const [view, setView] = useState<AppView>('landing');
  const [activeSection, setActiveSection] = useState<GameSection>('round1');
  const [round1ComparisonData, setRound1ComparisonData] = useState<ComparisonRoundData | null>(null);
  const [round2ComparisonData, setRound2ComparisonData] = useState<ComparisonRoundData | null>(null);
  const [round2GameTabRequest, setRound2GameTabRequest] = useState(0);
  const [round1ResultsTabRequest, setRound1ResultsTabRequest] = useState(0);
  const [round2ResultsTabRequest, setRound2ResultsTabRequest] = useState(0);

  const handleStart = () => {
    setActiveSection('round1');
    setView('game');
  };

  const handleContinueToRound2 = () => {
    setRound2GameTabRequest((request) => request + 1);
    setActiveSection('round2');
  };

  const handleCompareRounds = () => {
    setActiveSection('comparison');
  };

  const handleGoToRound1Results = () => {
    setRound1ResultsTabRequest((request) => request + 1);
    setActiveSection('round1');
  };

  const handleGoToRound2Results = () => {
    setRound2ResultsTabRequest((request) => request + 1);
    setActiveSection('round2');
  };

  useEffect(() => {
    scrollToTopAfterRender();
  }, [
    view,
    activeSection,
    round1ResultsTabRequest,
    round2ResultsTabRequest,
    round2GameTabRequest,
  ]);

  return (
    <div className="app">
      <div hidden={view !== 'landing'} className="landing-page-shell">
        <LandingPage onStart={handleStart} onLoadGraphData={() => setView('load-graphs')} />
      </div>

      <div hidden={view !== 'load-graphs'} className="load-graph-page-shell">
        <LoadGraphDataPage onGoHome={() => setView('landing')} />
      </div>

      <div hidden={view !== 'game'} className="game-shell">
        <header className="global-header">
          <div className="global-header-brand">
            <span className="global-header-title">Lean Portfolio Game Scoring</span>
          </div>

          <nav className="global-header-nav" aria-label="Application navigation">
            <button
              type="button"
              className="btn btn-ghost global-nav-link"
              onClick={() => setView('landing')}
            >
              Home
            </button>

            <div className="round-mode-tabs" role="tablist" aria-label="Game rounds">
              <button
                type="button"
                role="tab"
                id="round-tab-1"
                aria-selected={activeSection === 'round1'}
                aria-controls="round-panel-1"
                className={`round-mode-tab${activeSection === 'round1' ? ' round-mode-tab-active' : ''}`}
                onClick={() => setActiveSection('round1')}
              >
                Round 1
              </button>
              <button
                type="button"
                role="tab"
                id="round-tab-2"
                aria-selected={activeSection === 'round2'}
                aria-controls="round-panel-2"
                className={`round-mode-tab${activeSection === 'round2' ? ' round-mode-tab-active' : ''}`}
                onClick={() => setActiveSection('round2')}
              >
                Round 2
              </button>
              <button
                type="button"
                role="tab"
                id="round-tab-compare"
                aria-selected={activeSection === 'comparison'}
                aria-controls="round-panel-compare"
                className={`round-mode-tab${activeSection === 'comparison' ? ' round-mode-tab-active' : ''}`}
                onClick={() => setActiveSection('comparison')}
              >
                Compare
              </button>
            </div>
          </nav>
        </header>

        <div
          id="round-panel-1"
          role="tabpanel"
          aria-labelledby="round-tab-1"
          hidden={activeSection !== 'round1'}
          className="round-mode-panel"
        >
          <Round1App
            onContinueToRound2={handleContinueToRound2}
            onComparisonDataChange={setRound1ComparisonData}
            showResultsTabRequest={round1ResultsTabRequest}
          />
        </div>

        <div
          id="round-panel-2"
          role="tabpanel"
          aria-labelledby="round-tab-2"
          hidden={activeSection !== 'round2'}
          className="round-mode-panel"
        >
          <Round2App
            showGameTabRequest={round2GameTabRequest}
            showResultsTabRequest={round2ResultsTabRequest}
            onComparisonDataChange={setRound2ComparisonData}
            onCompareRounds={handleCompareRounds}
          />
        </div>

        <div
          id="round-panel-compare"
          role="tabpanel"
          aria-labelledby="round-tab-compare"
          hidden={activeSection !== 'comparison'}
          className="round-mode-panel"
        >
          <ComparisonResults
            round1={round1ComparisonData}
            round2={round2ComparisonData}
            onGoToRound1Results={handleGoToRound1Results}
            onGoToRound2Results={handleGoToRound2Results}
            onGoHome={() => setView('landing')}
          />
        </div>
      </div>
    </div>
  );
}

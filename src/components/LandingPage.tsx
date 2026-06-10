import { Leaderboard } from './Leaderboard';

interface LandingPageProps {
  onStart: () => void;
  onLoadGraphData: () => void;
}

export function LandingPage({ onStart, onLoadGraphData }: LandingPageProps) {
  return (
    <main className="landing-page">
      <div className="landing-page-topbar">
        <button type="button" className="btn btn-secondary landing-load-graph-btn" onClick={onLoadGraphData}>
          Load Graph Data
        </button>
      </div>

      <div className="landing-page-layout">
        <div className="landing-page-content">
          <h1 className="landing-page-title">Lean Portfolio Game Scoring</h1>
          <p className="landing-page-description">
            This application calculates scores for the Lean Portfolio Game by tracking card effort,
            completion, recurring value, penalties, and overall portfolio performance across multiple
            quarters. Enter effort each quarter and review the resulting scores and performance
            metrics.
          </p>
          <button type="button" className="btn landing-page-start-btn" onClick={onStart}>
            Start
          </button>
        </div>

        <Leaderboard />
      </div>
    </main>
  );
}

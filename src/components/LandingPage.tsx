interface LandingPageProps {
  onStart: () => void;
}

export function LandingPage({ onStart }: LandingPageProps) {
  return (
    <main className="landing-page">
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
    </main>
  );
}

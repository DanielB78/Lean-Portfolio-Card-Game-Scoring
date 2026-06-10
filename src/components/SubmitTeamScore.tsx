import { useState, type FormEvent } from 'react';
import { saveGraphDataForSubmission } from '../lib/graphDataStorage';
import { getSupabaseClient } from '../lib/supabase';
import type { ComparisonRoundData } from '../types/comparison';

interface SubmitTeamScoreProps {
  round1FinalScore: number | null;
  round2FinalScore: number | null;
  round1Data: ComparisonRoundData | null;
  round2Data: ComparisonRoundData | null;
}

export function SubmitTeamScore({
  round1FinalScore,
  round2FinalScore,
  round1Data,
  round2Data,
}: SubmitTeamScoreProps) {
  const [teamName, setTeamName] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedTeamName = teamName.trim();
    if (!trimmedTeamName) {
      setSubmitError('Please enter a team name.');
      setSubmitSuccess(null);
      return;
    }

    if (round1FinalScore === null || round2FinalScore === null) {
      setSubmitError('Both Round 1 and Round 2 scores must be available before submitting.');
      setSubmitSuccess(null);
      return;
    }

    setLoading(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    const totalScore = round1FinalScore + round2FinalScore;

    const { error } = await getSupabaseClient().from('scores').insert([
      {
        team_name: trimmedTeamName,
        round_1_score: round1FinalScore,
        round_2_score: round2FinalScore,
        total_score: totalScore,
      },
    ]);

    if (error) {
      setLoading(false);
      console.error('Error submitting score:', error);
      setSubmitError('Could not submit score. Please try again.');
      return;
    }

    let successMessage = 'Score submitted successfully.';

    if (round1Data && round2Data) {
      const { error: graphError } = await saveGraphDataForSubmission(
        trimmedTeamName,
        round1Data,
        round2Data,
      );

      if (graphError) {
        console.error('Error saving graph data:', graphError);
        successMessage =
          'Score submitted successfully, but graph data could not be saved. Please try again later.';
      } else {
        successMessage = 'Score and graph data submitted successfully.';
      }
    }

    setLoading(false);
    setSubmitSuccess(successMessage);
    setSubmitted(true);
  };

  const scoresAvailable = round1FinalScore !== null && round2FinalScore !== null;
  const totalPreview =
    scoresAvailable ? round1FinalScore + round2FinalScore : null;

  return (
    <section className="submit-score-card" aria-labelledby="submit-score-heading">
      <h2 id="submit-score-heading" className="submit-score-title">
        Submit Team Score
      </h2>
      <p className="submit-score-description muted">
        Submit your combined Round 1 and Round 2 scores to the leaderboard.
      </p>

      {scoresAvailable && (
        <dl className="submit-score-preview">
          <div className="submit-score-preview-item">
            <dt>Round 1</dt>
            <dd>{round1FinalScore}</dd>
          </div>
          <div className="submit-score-preview-item">
            <dt>Round 2</dt>
            <dd>{round2FinalScore}</dd>
          </div>
          <div className="submit-score-preview-item submit-score-preview-total">
            <dt>Total</dt>
            <dd>{totalPreview}</dd>
          </div>
        </dl>
      )}

      {!scoresAvailable && (
        <p className="status error submit-score-unavailable">
          Complete both Round 1 and Round 2 to submit a score.
        </p>
      )}

      <form className="submit-score-form" onSubmit={handleSubmit}>
        <div className="submit-score-field">
          <label htmlFor="submit-team-name">Team Name</label>
          <input
            id="submit-team-name"
            type="text"
            className="submit-score-input"
            value={teamName}
            onChange={(event) => setTeamName(event.target.value)}
            disabled={loading || submitted || !scoresAvailable}
            autoComplete="organization"
            placeholder="Enter your team name"
          />
        </div>

        {submitError && (
          <p className="status error submit-score-message" role="alert">
            {submitError}
          </p>
        )}

        {submitSuccess && (
          <p className="status submit-score-message submit-score-success" role="status">
            {submitSuccess}
          </p>
        )}

        <button
          type="submit"
          className="btn btn-primary submit-score-btn"
          disabled={loading || submitted || !scoresAvailable}
        >
          {loading ? 'Submitting…' : 'Submit Score'}
        </button>
      </form>
    </section>
  );
}

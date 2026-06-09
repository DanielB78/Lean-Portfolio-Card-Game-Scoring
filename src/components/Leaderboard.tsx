import { useEffect, useState } from 'react';
import { getSupabaseClient } from '../lib/supabase';

interface LeaderboardEntry {
  team_name: string;
  round_1_score: number;
  round_2_score: number;
  total_score: number;
  submitted_at: string;
}

type LeaderboardState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'empty' }
  | { status: 'ready'; entries: LeaderboardEntry[] };

export function Leaderboard() {
  const [state, setState] = useState<LeaderboardState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;

    async function loadLeaderboard() {
      try {
        const { data, error } = await getSupabaseClient()
          .from('scores')
          .select('team_name, round_1_score, round_2_score, total_score, submitted_at')
          .order('total_score', { ascending: false })
          .limit(5);

        if (cancelled) return;

        if (error) {
          console.error('Error loading leaderboard:', error);
          setState({ status: 'error' });
          return;
        }

        if (!data || data.length === 0) {
          setState({ status: 'empty' });
          return;
        }

        setState({ status: 'ready', entries: data as LeaderboardEntry[] });
      } catch (error) {
        if (cancelled) return;
        console.error('Error loading leaderboard:', error);
        setState({ status: 'error' });
      }
    }

    loadLeaderboard();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="leaderboard-section" aria-labelledby="leaderboard-heading">
      <div className="leaderboard-card">
        <h2 id="leaderboard-heading" className="leaderboard-title">
          Leaderboard
        </h2>

        {state.status === 'loading' && (
          <p className="leaderboard-message muted" aria-live="polite">
            Loading leaderboard…
          </p>
        )}

        {state.status === 'error' && (
          <p className="leaderboard-message status error" role="alert">
            Could not load leaderboard.
          </p>
        )}

        {state.status === 'empty' && (
          <p className="leaderboard-message muted">No scores submitted yet.</p>
        )}

        {state.status === 'ready' && (
          <>
            <div className="leaderboard-desktop-table table-scroll">
              <table className="results-table leaderboard-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Team Name</th>
                    <th>Round 1 Score</th>
                    <th>Round 2 Score</th>
                    <th>Total Score</th>
                  </tr>
                </thead>
                <tbody>
                  {state.entries.map((entry, index) => (
                    <tr key={`${entry.team_name}-${entry.submitted_at}-${index}`}>
                      <td>{index + 1}</td>
                      <td className="leaderboard-team-name">{entry.team_name}</td>
                      <td>{entry.round_1_score}</td>
                      <td>{entry.round_2_score}</td>
                      <td className="leaderboard-total-score">{entry.total_score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="leaderboard-mobile-cards">
              {state.entries.map((entry, index) => (
                <article
                  key={`${entry.team_name}-${entry.submitted_at}-${index}`}
                  className="leaderboard-mobile-card"
                >
                  <header className="leaderboard-mobile-card-header">
                    <span className="leaderboard-mobile-rank">#{index + 1}</span>
                    <h3 className="leaderboard-mobile-team">{entry.team_name}</h3>
                  </header>
                  <dl className="leaderboard-mobile-fields">
                    <div className="leaderboard-mobile-field">
                      <dt>Round 1 Score</dt>
                      <dd>{entry.round_1_score}</dd>
                    </div>
                    <div className="leaderboard-mobile-field">
                      <dt>Round 2 Score</dt>
                      <dd>{entry.round_2_score}</dd>
                    </div>
                    <div className="leaderboard-mobile-field leaderboard-mobile-total">
                      <dt>Total Score</dt>
                      <dd>{entry.total_score}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

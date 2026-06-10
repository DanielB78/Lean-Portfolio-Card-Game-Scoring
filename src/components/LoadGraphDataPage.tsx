import { useEffect, useState } from 'react';
import { SavedCharts } from './SavedCharts';
import { TeamNameCombobox } from './TeamNameCombobox';
import { fetchSavedTeamNames, loadSavedGraphData } from '../lib/graphDataStorage';
import type { RoundMode, SavedChartBundle } from '../types/savedGraphData';

interface LoadGraphDataPageProps {
  onGoHome: () => void;
}

export function LoadGraphDataPage({ onGoHome }: LoadGraphDataPageProps) {
  const [teamNames, setTeamNames] = useState<string[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [roundMode, setRoundMode] = useState<RoundMode>('round1');
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [loadingGraphs, setLoadingGraphs] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [bundle, setBundle] = useState<SavedChartBundle | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadTeams() {
      setLoadingTeams(true);
      const { teams, error } = await fetchSavedTeamNames();

      if (cancelled) return;

      if (error) {
        setLoadError('Could not load team names from Supabase.');
      } else {
        setLoadError(null);
      }

      setTeamNames(teams);
      setLoadingTeams(false);
    }

    void loadTeams();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSelectedTeamChange = (teamName: string | null) => {
    setSelectedTeam(teamName);
    setBundle(null);
    setLoadError(null);
  };

  const handleRoundModeChange = (nextRoundMode: RoundMode) => {
    setRoundMode(nextRoundMode);
    setBundle(null);
    setLoadError(null);
  };

  const handleLoad = async () => {
    if (!selectedTeam || !teamNames.includes(selectedTeam)) {
      setLoadError('Please select a valid team name from the dropdown.');
      setBundle(null);
      return;
    }

    setLoadingGraphs(true);
    setLoadError(null);
    setBundle(null);

    const { bundle: loadedBundle, error } = await loadSavedGraphData(selectedTeam, roundMode);

    setLoadingGraphs(false);

    if (error) {
      setLoadError('Could not load graph data. Please try again.');
      return;
    }

    if (!loadedBundle) {
      setLoadError(`No saved graph data found for "${selectedTeam}" in ${roundLabel(roundMode)}.`);
      return;
    }

    setBundle(loadedBundle);
  };

  const canLoad = Boolean(selectedTeam && teamNames.includes(selectedTeam));

  return (
    <main className="load-graph-page">
      <header className="load-graph-header">
        <div className="load-graph-header-text">
          <h1 className="load-graph-title">Load Graph Data</h1>
          <p className="load-graph-subtitle muted">
            Select a team and round to reload saved performance charts from Supabase.
          </p>
        </div>
        <button type="button" className="btn btn-ghost" onClick={onGoHome}>
          Home
        </button>
      </header>

      <section className="load-graph-controls panel" aria-labelledby="load-graph-controls-heading">
        <h2 id="load-graph-controls-heading" className="load-graph-controls-title">
          Search saved graphs
        </h2>

        <div className="load-graph-form">
          <div className="load-graph-field">
            <label htmlFor="load-graph-team">Team name</label>
            <TeamNameCombobox
              teamNames={teamNames}
              selectedTeam={selectedTeam}
              onSelectedTeamChange={handleSelectedTeamChange}
              disabled={loadingGraphs}
              loading={loadingTeams}
            />
          </div>

          <fieldset className="load-graph-round-fieldset">
            <legend>Round</legend>
            <div className="load-graph-round-options">
              <label className="load-graph-round-option">
                <input
                  type="radio"
                  name="load-graph-round"
                  value="round1"
                  checked={roundMode === 'round1'}
                  onChange={() => handleRoundModeChange('round1')}
                  disabled={loadingGraphs}
                />
                Round 1
              </label>
              <label className="load-graph-round-option">
                <input
                  type="radio"
                  name="load-graph-round"
                  value="round2"
                  checked={roundMode === 'round2'}
                  onChange={() => handleRoundModeChange('round2')}
                  disabled={loadingGraphs}
                />
                Round 2
              </label>
            </div>
          </fieldset>

          {loadError && (
            <p className="status error load-graph-message" role="alert">
              {loadError}
            </p>
          )}

          <button
            type="button"
            className="btn btn-primary load-graph-btn"
            onClick={() => void handleLoad()}
            disabled={loadingTeams || loadingGraphs || !canLoad}
          >
            {loadingGraphs ? 'Loading…' : 'Load Graph Data'}
          </button>
        </div>
      </section>

      {bundle && (
        <section className="load-graph-results" aria-labelledby="load-graph-results-heading">
          <header className="load-graph-results-header">
            <h2 id="load-graph-results-heading">
              {bundle.teamName} — {roundLabel(bundle.roundMode)}
            </h2>
            <p className="muted load-graph-saved-at">
              Saved {new Date(bundle.createdAt).toLocaleString()}
            </p>
          </header>
          <SavedCharts bundle={bundle} />
        </section>
      )}
    </main>
  );
}

function roundLabel(roundMode: RoundMode): string {
  return roundMode === 'round1' ? 'Round 1' : 'Round 2';
}

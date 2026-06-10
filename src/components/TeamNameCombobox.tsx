import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';

interface TeamNameComboboxProps {
  teamNames: string[];
  selectedTeam: string | null;
  onSelectedTeamChange: (teamName: string | null) => void;
  disabled?: boolean;
  loading?: boolean;
}

export function TeamNameCombobox({
  teamNames,
  selectedTeam,
  onSelectedTeamChange,
  disabled = false,
  loading = false,
}: TeamNameComboboxProps) {
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState(selectedTeam ?? '');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    setSearchQuery(selectedTeam ?? '');
  }, [selectedTeam]);

  const filteredTeams = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return teamNames;
    return teamNames.filter((name) => name.toLowerCase().includes(query));
  }, [teamNames, searchQuery]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const selectTeam = (teamName: string) => {
    onSelectedTeamChange(teamName);
    setSearchQuery(teamName);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const handleInputChange = (value: string) => {
    setSearchQuery(value);
    setIsOpen(true);
    setActiveIndex(-1);

    const exactMatch = teamNames.find((name) => name.toLowerCase() === value.trim().toLowerCase());
    if (exactMatch && value.trim() === exactMatch) {
      onSelectedTeamChange(exactMatch);
      return;
    }

    if (selectedTeam && value.trim() !== selectedTeam) {
      onSelectedTeamChange(null);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (disabled || loading || teamNames.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((index) => Math.min(index + 1, filteredTeams.length - 1));
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((index) => Math.max(index - 1, 0));
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      if (isOpen && activeIndex >= 0 && filteredTeams[activeIndex]) {
        selectTeam(filteredTeams[activeIndex]);
        return;
      }

      const exactMatch = teamNames.find(
        (name) => name.toLowerCase() === searchQuery.trim().toLowerCase(),
      );
      if (exactMatch) {
        selectTeam(exactMatch);
      }
      return;
    }

    if (event.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  const showEmptyMessage = !loading && teamNames.length === 0;
  const showNoMatches = isOpen && !loading && teamNames.length > 0 && filteredTeams.length === 0;

  return (
    <div className="team-combobox" ref={containerRef}>
      <div className="team-combobox-input-wrap">
        <input
          ref={inputRef}
          id="load-graph-team"
          type="text"
          role="combobox"
          className="load-graph-input team-combobox-input"
          value={searchQuery}
          onChange={(event) => handleInputChange(event.target.value)}
          onFocus={() => {
            if (!disabled && !loading && teamNames.length > 0) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-activedescendant={
            activeIndex >= 0 && filteredTeams[activeIndex]
              ? `${listboxId}-option-${activeIndex}`
              : undefined
          }
          placeholder={
            loading
              ? 'Loading teams…'
              : showEmptyMessage
                ? 'No saved teams found'
                : 'Search and select a team'
          }
          disabled={disabled || loading || teamNames.length === 0}
          autoComplete="off"
        />
        <button
          type="button"
          className="team-combobox-toggle"
          aria-label="Toggle team list"
          disabled={disabled || loading || teamNames.length === 0}
          onClick={() => {
            if (disabled || loading || teamNames.length === 0) return;
            setIsOpen((open) => !open);
            inputRef.current?.focus();
          }}
        >
          ▾
        </button>
      </div>

      {selectedTeam && (
        <p className="team-combobox-selected muted" aria-live="polite">
          Selected team: <strong>{selectedTeam}</strong>
        </p>
      )}

      {showEmptyMessage && (
        <p className="status load-graph-empty-teams" role="status">
          No saved teams found.
        </p>
      )}

      {isOpen && !loading && teamNames.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          className="team-combobox-list"
          aria-label="Saved team names"
        >
          {showNoMatches ? (
            <li className="team-combobox-option team-combobox-option-empty" role="presentation">
              No matching teams
            </li>
          ) : (
            filteredTeams.map((name, index) => (
              <li
                key={name}
                id={`${listboxId}-option-${index}`}
                role="option"
                aria-selected={selectedTeam === name}
                className={`team-combobox-option${
                  index === activeIndex ? ' team-combobox-option-active' : ''
                }${selectedTeam === name ? ' team-combobox-option-selected' : ''}`}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectTeam(name)}
              >
                {name}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

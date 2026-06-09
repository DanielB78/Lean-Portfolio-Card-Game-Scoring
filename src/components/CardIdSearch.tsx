import { useMemo, useState } from 'react';
import { filterByCardIdSearch } from '../lib/cardIdSearch';

interface CardIdSearchProps {
  value: string;
  onChange: (value: string) => void;
  totalCount: number;
  matchCount: number;
  id?: string;
}

export function CardIdSearch({
  value,
  onChange,
  totalCount,
  matchCount,
  id,
}: CardIdSearchProps) {
  return (
    <div className="card-id-search">
      <label className="visually-hidden" htmlFor={id}>
        Search Card ID
      </label>
      <input
        type="search"
        id={id}
        className="card-id-search-input"
        placeholder="Search Card ID..."
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete="off"
        spellCheck={false}
      />
      <p className="muted card-id-search-meta" aria-live="polite">
        Showing {matchCount} of {totalCount} cards
      </p>
    </div>
  );
}

export function useCardIdSearch<T extends { cardId: string }>(items: T[]) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(
    () => filterByCardIdSearch(items, query),
    [items, query],
  );

  const totalCount = items.length;
  const matchCount = query.trim() ? filtered.length : totalCount;

  return {
    query,
    setQuery,
    filtered,
    totalCount,
    matchCount,
    hasActiveSearch: query.trim().length > 0,
  };
}

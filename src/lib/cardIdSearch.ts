export function filterByCardIdSearch<T extends { cardId: string }>(
  items: T[],
  query: string,
): T[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return items;
  return items.filter((item) => item.cardId.toLowerCase().includes(normalized));
}

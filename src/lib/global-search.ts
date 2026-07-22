export const SEARCH_MIN_LENGTH = 2;

export type SearchResult = { id: string; title: string; subtitle: string; href: string; type: string };

export function normalizeSearchQuery(value: string | null) {
  return (value ?? '').trim().slice(0, 80);
}

export function canSearch(value: string) {
  return normalizeSearchQuery(value).length >= SEARCH_MIN_LENGTH;
}

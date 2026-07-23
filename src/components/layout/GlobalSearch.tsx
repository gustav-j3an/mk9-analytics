'use client';

import Link from 'next/link';
import { Search, X, MapPin, User, Building2, Factory } from 'lucide-react';
import { useEffect, useState } from 'react';
import { canSearch, type SearchResult } from '@/lib/global-search';

const typeLabels: Record<string, string> = {
  store: 'Loja',
  promoter: 'Promotor',
  operation: 'Operação',
  industry: 'Indústria',
};

const typeIcons: Record<string, React.ReactNode> = {
  store: <MapPin className="h-3.5 w-3.5 text-blue-500" />,
  promoter: <User className="h-3.5 w-3.5 text-emerald-500" />,
  operation: <Building2 className="h-3.5 w-3.5 text-orange-500" />,
  industry: <Factory className="h-3.5 w-3.5 text-purple-500" />,
};

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const searchable = canSearch(query);

  useEffect(() => {
    if (!canSearch(query)) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        const data = await response.json();
        setResults(data.results ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  return (
    <div className="global-search relative">
      <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--mk-text-subtle)]" aria-hidden="true" />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        type="search"
        aria-label="Pesquisa global"
        placeholder="Buscar operação, promotor, loja..."
        className="h-9 w-full rounded-lg bg-[var(--mk-bg-secondary)] border border-[var(--mk-border-strong)] pl-9 pr-8 text-xs text-[var(--mk-text)] placeholder-[var(--mk-text-subtle)] transition focus:border-[var(--mk-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--mk-focus)]"
      />
      {query && (
        <button
          aria-label="Limpar pesquisa"
          onClick={() => {
            setQuery('');
            setResults([]);
          }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--mk-text-subtle)] hover:text-[var(--mk-text)] transition"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      {searchable && (
        <div className="search-results absolute top-full left-0 right-0 z-50 mt-1 max-h-80 overflow-y-auto rounded-xl border border-[var(--mk-border-strong)] bg-[var(--mk-card-raised)] p-1.5 shadow-[var(--mk-shadow)] animate-fadeIn" role="listbox">
          {loading ? (
            <div className="search-message px-3 py-4 text-center text-xs text-[var(--mk-text-subtle)]">
              Pesquisando...
            </div>
          ) : results.length ? (
            <div className="space-y-0.5">
              {results.map((result) => (
                <Link
                  key={`${result.type}-${result.id}`}
                  href={result.href}
                  onClick={() => {
                    setQuery('');
                    setResults([]);
                  }}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--mk-hover)] transition text-left"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--mk-bg-secondary)]">
                    {typeIcons[result.type] ?? <Search className="h-3.5 w-3.5 text-[var(--mk-text-subtle)]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[var(--mk-text)] truncate">{result.title}</p>
                    <p className="text-[10px] text-[var(--mk-text-subtle)] truncate mt-0.5">{result.subtitle}</p>
                  </div>
                  <span className="shrink-0 rounded-md bg-[var(--mk-bg-secondary)] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[var(--mk-text-subtle)]">
                    {typeLabels[result.type] ?? result.type}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="search-message px-3 py-4 text-center text-xs text-[var(--mk-text-subtle)]">
              Nenhum resultado encontrado.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
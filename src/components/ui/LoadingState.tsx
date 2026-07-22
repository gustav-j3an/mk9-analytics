import React from 'react';

export function LoadingState({ rows = 5 }: { rows?: number }) {
  return <div className="skeleton-panel" role="status" aria-live="polite" aria-label="Carregando informações">
    <div className="skeleton-heading"><span /><span /></div>
    <div className="skeleton-grid">{Array.from({ length: 4 },(_,i)=><span key={i} />)}</div>
    <div className="skeleton-table">{Array.from({ length: rows },(_,i)=><span key={i} />)}</div>
    <span className="sr-only">Carregando informações...</span>
  </div>;
}
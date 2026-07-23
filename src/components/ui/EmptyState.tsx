import React from 'react';
import { Database } from 'lucide-react';
import { Button } from './button';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ReactNode;
}

export const EmptyState = ({
  title,
  description,
  action,
  icon = <Database className="h-5 w-5 text-[var(--mk-text-subtle)]" />,
}: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center space-y-3 empty-state rounded-2xl border p-8 text-center sm:p-12">
      <div className="rounded-xl bg-[var(--mk-bg-secondary)] p-3 text-[var(--mk-primary)]">{icon}</div>
      <div className="max-w-md space-y-1">
        <h4 className="text-xs font-bold text-[var(--mk-text)] uppercase tracking-wider">{title}</h4>
        <p className="text-xs leading-5 text-[var(--mk-text-secondary)]">{description}</p>
      </div>
      {action && (
        <Button variant="outline" size="sm" onClick={action.onClick} className="mt-2">
          {action.label}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;

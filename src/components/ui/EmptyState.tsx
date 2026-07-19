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
  icon = <Database className="w-12 h-12 text-gray-300" />,
}: EmptyStateProps) => {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center shadow-xs flex flex-col items-center justify-center space-y-4">
      <div className="p-4 bg-gray-50 rounded-full">{icon}</div>
      <div className="max-w-md space-y-1">
        <h4 className="text-base font-bold text-gray-900">{title}</h4>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      {action && (
        <Button variant="outline" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
};

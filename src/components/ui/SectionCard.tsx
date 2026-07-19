import React from 'react';
import { Card } from './card';

interface SectionCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const SectionCard = ({ title, description, children, actions, className = '' }: SectionCardProps) => {
  return (
    <Card className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between border-b border-gray-50 pb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div className="pt-2">{children}</div>
    </Card>
  );
};

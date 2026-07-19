import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  category?: string;
  actions?: React.ReactNode;
}

export const PageHeader = ({ title, subtitle, category = 'MK9 Analytics', actions }: PageHeaderProps) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-gray-150 mb-8 space-y-4 md:space-y-0">
      <div>
        <span className="text-xs font-bold text-green-600 uppercase tracking-widest">{category}</span>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight mt-1">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
};

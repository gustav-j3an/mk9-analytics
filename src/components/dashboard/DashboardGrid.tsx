import React from 'react';

interface DashboardGridProps {
  children: React.ReactNode;
}

export const DashboardGrid = ({ children }: DashboardGridProps) => {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {children}
    </div>
  );
};

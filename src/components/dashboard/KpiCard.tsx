import React from 'react';

interface KpiCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  iconBgColor?: string;
  iconColor?: string;
}

export const KpiCard = ({
  title,
  value,
  description,
  icon,
  iconBgColor = 'bg-blue-50',
  iconColor = 'text-blue-600',
}: KpiCardProps) => {
  return (
    <div className="group relative overflow-hidden bg-white border border-gray-100 rounded-2xl p-6 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300">
      {/* Decorative element */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gray-50 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500" />
      
      <div className="relative flex items-center justify-between">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{title}</p>
          <p className="text-4xl font-extrabold text-gray-900 tracking-tight">{value}</p>
        </div>
        <div className={`p-4 rounded-2xl ${iconBgColor} ${iconColor} transition-transform duration-300 group-hover:rotate-6`}>
          {icon}
        </div>
      </div>
      
      <div className="relative mt-4 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <p className="text-xs font-medium text-gray-500">{description}</p>
      </div>
    </div>
  );
};

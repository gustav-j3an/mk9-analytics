import React from 'react';
import { Card } from './card';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  iconBgColor?: string; // Kept for backwards compatibility props
  iconColor?: string;   // Kept for backwards compatibility props
}

export const StatCard = ({
  title,
  value,
  description,
  icon,
}: StatCardProps) => {
  return (
    <Card className="group relative overflow-hidden transition-all duration-300 hover:border-[#D4D4D8] border border-[#F4F4F5]">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          {/* Muted tiny label header */}
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#A1A1AA]">{title}</p>
          {/* Tabular numbers */}
          <p className="text-3xl font-extrabold text-[#09090B] tracking-tight tabular-nums">{value}</p>
        </div>
        {icon && (
          <div className="text-[#A1A1AA] group-hover:text-[#71717A] transition-colors duration-300">
            {icon}
          </div>
        )}
      </div>
      {description && (
        <div className="mt-4 flex items-center gap-1.5 pt-3 border-t border-[#FAFAFA]">
          <span className="w-1 h-1 rounded-full bg-[#16A34A] opacity-75" />
          <p className="text-[10px] font-bold text-[#71717A] uppercase tracking-wide">{description}</p>
        </div>
      )}
    </Card>
  );
};

export default StatCard;

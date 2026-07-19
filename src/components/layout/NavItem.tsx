import React from 'react';
import Link from 'next/link';

interface NavItemProps {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  collapsed?: boolean;
}

export const NavItem = ({ href, label, icon, active, collapsed = false }: NavItemProps) => {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-tight transition-all duration-150 group ${
        active
          ? 'bg-white/[0.08] text-white shadow-[0_1px_2px_rgba(0,0,0,0.2)]'
          : 'text-[#A1A1AA] hover:bg-white/[0.03] hover:text-white'
      }`}
    >
      <div className={`transition-transform duration-150 shrink-0 ${active ? 'scale-105 text-white' : 'text-[#71717A] group-hover:text-[#A1A1AA]'}`}>
        {icon}
      </div>
      {!collapsed && (
        <span className="truncate">{label}</span>
      )}
    </Link>
  );
};

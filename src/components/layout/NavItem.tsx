import React from 'react';import Link from 'next/link';
interface NavItemProps{href:string;label:string;icon:React.ReactNode;active:boolean;collapsed?:boolean}
export const NavItem = ({ href, label, icon, active, collapsed = false }: NavItemProps) => (
  <Link
    href={href}
    aria-current={active ? 'page' : undefined}
    className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all ${
      active
        ? 'bg-[var(--mk-hover)] text-[var(--mk-text)]'
        : 'text-[var(--mk-text-secondary)] hover:bg-[var(--mk-hover)] hover:text-[var(--mk-text)]'
    }`}
  >
    {active && <span className="absolute -left-0.5 h-5 w-0.5 rounded-full bg-[var(--mk-primary)]" />}
    <span className={`shrink-0 ${active ? 'text-[var(--mk-primary)]' : 'text-[var(--mk-text-subtle)] group-hover:text-[var(--mk-primary)]'}`}>
      {icon}
    </span>
    {!collapsed && <span className="truncate">{label}</span>}
    {collapsed && (
      <span className="pointer-events-none absolute left-full ml-3 z-50 rounded-lg bg-[var(--mk-card-raised)] border border-[var(--mk-border-strong)] px-2.5 py-1.5 text-[10px] font-bold text-[var(--mk-text)] opacity-0 scale-95 origin-left transition-all duration-150 group-hover:opacity-100 group-hover:scale-100 shadow-[var(--mk-shadow)] whitespace-nowrap">
        {label}
      </span>
    )}
  </Link>
);
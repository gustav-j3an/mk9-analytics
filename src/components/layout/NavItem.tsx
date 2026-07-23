import React from 'react';
import Link from 'next/link';

interface NavItemProps { href: string; label: string; icon: React.ReactNode; active: boolean; collapsed?: boolean; }
export const NavItem = ({ href, label, icon, active, collapsed = false }: NavItemProps) => <Link href={href} aria-current={active ? 'page' : undefined} title={collapsed ? label : undefined} className={`group flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-colors ${active ? 'bg-white/[0.07] text-white' : 'text-[#9d9d98] hover:bg-white/[0.04] hover:text-[#e7e7e3]'}`}><div className={`shrink-0 ${active ? 'text-white' : 'text-[#73736f] group-hover:text-[#aaa9a4]'}`}>{icon}</div>{!collapsed && <span className="truncate">{label}</span>}</Link>;
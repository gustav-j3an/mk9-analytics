'use client';

import { Calendar, ChevronLeft, ChevronRight, ClipboardList, Factory, LayoutDashboard, Settings, Store, Upload, Users, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { NavItem } from './NavItem';

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onCloseMobile?: () => void;
}

const sections = [
  { title: 'VISÃO', items: [{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
  {
    title: 'OPERAÇÃO',
    items: [
      { href: '/dashboard/operacoes', label: 'Operações', icon: ClipboardList },
      { href: '/dashboard/roteiros', label: 'Roteiros', icon: Calendar },
      { href: '/dashboard/visitas', label: 'Visitas', icon: Calendar },
      { href: '/dashboard/importacoes', label: 'Importações', icon: Upload },
    ],
  },
  {
    title: 'CADASTROS',
    items: [
      { href: '/dashboard/promotores', label: 'Promotores', icon: Users },
      { href: '/dashboard/lojas', label: 'Lojas', icon: Store },
      { href: '/dashboard/industrias', label: 'Indústrias', icon: Factory },
    ],
  },
  { title: 'ADMINISTRAÇÃO', items: [{ href: '/dashboard/configuracoes', label: 'Configurações', icon: Settings }] },
];

export function Sidebar({ collapsed = false, onToggleCollapse = () => {}, onCloseMobile = () => {} }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col border-r border-black bg-[#1b1b1a] py-4">
      <div className="mb-5 flex items-center justify-between border-b border-white/[0.07] px-4 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-white text-[11px] font-bold text-[#1b1b1a]">MK</div>
          {!collapsed && <span className="text-sm font-semibold tracking-tight text-white">MK9 <span className="font-normal text-[#8d8d88]">Analytics</span></span>}
        </div>
        <button aria-label="Fechar menu" onClick={onCloseMobile} className="rounded p-1.5 text-[#73736f] hover:bg-white/[0.05] hover:text-white lg:hidden"><X className="h-4 w-4" /></button>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-2.5">
        {sections.map((section) => (
          <div key={section.title} className="space-y-1">
            {!collapsed && <span className="mb-1.5 block px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#60605c]">{section.title}</span>}
            {section.items.map((item) => {
              const Icon = item.icon;
              return <NavItem key={item.href} href={item.href} label={item.label} icon={<Icon className="h-4 w-4" />} active={pathname === item.href} collapsed={collapsed} />;
            })}
          </div>
        ))}
      </nav>

      <div className="hidden border-t border-white/[0.07] px-2.5 pt-4 lg:block">
        <button onClick={onToggleCollapse} className="flex w-full items-center justify-center gap-2 rounded-md p-2 text-xs font-medium text-[#73736f] transition-colors hover:bg-white/[0.04] hover:text-white">
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!collapsed && <span>Recolher</span>}
        </button>
      </div>
    </div>
  );
}

export default Sidebar;

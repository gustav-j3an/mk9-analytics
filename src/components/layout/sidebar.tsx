'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { NavItem } from '@/components/layout/NavItem';
import {
  Briefcase,
  Store,
  Factory,
  Users,
  Calendar,
  Settings,
  Database,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onCloseMobile?: () => void;
}

export const Sidebar = ({
  collapsed = false,
  onToggleCollapse = () => {},
  onCloseMobile = () => {},
}: SidebarProps) => {
  const pathname = usePathname();

  const sections = [
    {
      title: 'OPERACIONAL',
      items: [
        { href: '/dashboard', label: 'Visão Geral', icon: <Briefcase className="w-4 h-4" /> },
        { href: '/dashboard/importacoes', label: 'Importações', icon: <FileSpreadsheet className="w-4 h-4" /> },
        { href: '/dashboard/operacoes', label: 'Operações', icon: <Database className="w-4 h-4" /> },
        { href: '/dashboard/visitas', label: 'Visitas', icon: <Calendar className="w-4 h-4" /> },
      ],
    },
    {
      title: 'CADASTROS',
      items: [
        { href: '/dashboard/promotores', label: 'Promotores', icon: <Users className="w-4 h-4" /> },
        { href: '/dashboard/lojas', label: 'Lojas', icon: <Store className="w-4 h-4" /> },
        { href: '/dashboard/industrias', label: 'Indústrias', icon: <Factory className="w-4 h-4" /> },
      ],
    },
    {
      title: 'SISTEMA',
      items: [
        { href: '/dashboard/configuracoes', label: 'Configurações', icon: <Settings className="w-4 h-4" /> },
      ],
    },
  ];

  return (
    <div className="flex flex-col h-full bg-[#09090B] border-r border-white/[0.04] py-4 animate-fadeIn">
      {/* Header / Logo */}
      <div className="flex items-center justify-between px-5 pb-4 border-b border-white/[0.04] mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[#16A34A] rounded-lg flex items-center justify-center font-black text-white text-sm shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
            M
          </div>
          {!collapsed && (
            <span className="font-extrabold text-white tracking-tight text-sm">
              MK9 <span className="text-[#16A34A] font-semibold">Analytics</span>
            </span>
          )}
        </div>
        {/* Mobile close button */}
        <button
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 hover:bg-white/[0.03] rounded-lg text-[#71717A] hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-4 overflow-y-auto">
        {sections.map((section) => (
          <div key={section.title} className="space-y-1">
            {!collapsed && (
              <span className="text-[9px] font-bold uppercase tracking-widest text-[#52525B] px-3.5 block mb-1">
                {section.title}
              </span>
            )}
            {section.items.map((item) => {
              const isActive = pathname === item.href;
              return (
                <NavItem
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  active={isActive}
                  collapsed={collapsed}
                />
              );
            })}
          </div>
        ))}
      </nav>

      {/* Collapse Desktop Button */}
      <div className="hidden lg:block px-3 pt-4 border-t border-white/[0.04]">
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center gap-2 p-2 hover:bg-white/[0.03] rounded-xl text-[#71717A] hover:text-white font-bold text-xs tracking-tight transition-all duration-150 focus:outline-none"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {!collapsed && <span>Recolher Menu</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
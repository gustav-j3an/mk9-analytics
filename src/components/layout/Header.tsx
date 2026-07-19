import React from 'react';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { UserMenu } from '@/components/layout/UserMenu';
import { Search, Menu } from 'lucide-react';

interface HeaderProps {
  onMenuToggle: () => void;
}

export const Header = ({ onMenuToggle }: HeaderProps) => {
  return (
    <header className="h-14 border-b border-[#F4F4F5] bg-white/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-1.5 hover:bg-[#F4F4F5] rounded-lg text-[#71717A] hover:text-[#09090B] transition-colors"
        >
          <Menu className="w-4 h-4" />
        </button>
        <Breadcrumb />
      </div>

      <div className="flex items-center gap-6">
        {/* Telemetry Status Indicator */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-[#F0FDF4] border border-[#DCFCE7] rounded-full">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#16A34A] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#16A34A]"></span>
          </span>
          <span className="text-[10px] font-bold text-[#16A34A] uppercase tracking-wider">Telemetria Ativa</span>
        </div>

        {/* Search */}
        <div className="relative hidden md:block min-w-[200px] lg:min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#A1A1AA]" />
          <input
            type="text"
            placeholder="Buscar..."
            className="w-full pl-9 pr-4 py-1.5 border border-[#E4E4E7] bg-white rounded-lg text-xs font-semibold placeholder-[#A1A1AA] text-[#09090B] focus:outline-none focus:border-[#A1A1AA] transition-all duration-150 shadow-[0_1px_2px_rgba(0,0,0,0.01)]"
          />
        </div>

        <UserMenu />
      </div>
    </header>
  );
};

export default Header;

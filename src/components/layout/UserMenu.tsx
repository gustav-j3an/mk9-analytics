'use client';

import React, { useState } from 'react';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';

export const UserMenu = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-md p-1 transition-colors hover:bg-[#f3f3f0] dark:hover:bg-[#32353A] focus:outline-none"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#292928] dark:bg-[#4F8CFF] text-[10px] font-semibold text-white">
          GS
        </div>
        <div className="hidden sm:flex flex-col text-left">
          <span className="text-xs font-medium leading-none text-[#292928] dark:text-[#F5F5F5]">Gustav Smith</span>
          <span className="mt-0.5 text-[10px] text-[#858580] dark:text-[#C7C7C7]">Administrador</span>
        </div>
        <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-48 rounded-md border border-[#deded9] bg-white dark:border-[#3B3E45] dark:bg-[#2A2D31] py-1.5 shadow-[0_8px_24px_rgba(18,19,21,0.16)] animate-fadeIn">
            <button className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-gray-600 dark:text-[#C7C7C7] hover:bg-gray-50 dark:hover:bg-[#32353A] transition-colors text-left">
              <User className="w-4 h-4 text-gray-400" />
              Perfil
            </button>
            <button className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-gray-600 dark:text-[#C7C7C7] hover:bg-gray-50 dark:hover:bg-[#32353A] transition-colors text-left">
              <Settings className="w-4 h-4 text-gray-400" />
              Configurações
            </button>
            <hr className="my-1 border-gray-100 dark:border-[#3B3E45]" />
            <button className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-rose-600 dark:text-[#FF7774] hover:bg-rose-50 dark:hover:bg-[#EF5350]/15 transition-colors text-left">
              <LogOut className="w-4 h-4 text-rose-400" />
              Sair
            </button>
          </div>
        </>
      )}
    </div>
  );
};

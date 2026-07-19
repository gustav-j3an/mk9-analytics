'use client';

import React, { useState } from 'react';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';

export const UserMenu = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-gray-150"
      >
        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
          GS
        </div>
        <div className="hidden sm:flex flex-col text-left">
          <span className="text-xs font-bold text-gray-800 leading-none">Gustav Smith</span>
          <span className="text-[10px] text-gray-400 font-semibold mt-0.5">Administrador</span>
        </div>
        <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-lg py-1.5 z-20 animate-fadeIn">
            <button className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors text-left">
              <User className="w-4 h-4 text-gray-400" />
              Perfil
            </button>
            <button className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors text-left">
              <Settings className="w-4 h-4 text-gray-400" />
              Configurações
            </button>
            <hr className="my-1 border-gray-100" />
            <button className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left">
              <LogOut className="w-4 h-4 text-rose-400" />
              Sair
            </button>
          </div>
        </>
      )}
    </div>
  );
};

import React from 'react';

export const DashboardHeader = () => {
  const currentDate = new Date().toLocaleDateString('pt-BR');
  
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-gray-150 mb-8 space-y-4 md:space-y-0">
      <div>
        <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">MK9 Analytics</span>
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mt-1">Dashboard Executivo</h1>
        <p className="text-sm text-gray-500 mt-1">
          Visão consolidada das operações, equipes de campo e cobertura de visitas de trade marketing.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex flex-col text-right hidden md:block">
          <span className="text-xs text-gray-400">Última atualização</span>
          <span className="text-sm font-semibold text-gray-700">{currentDate}</span>
        </div>
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
      </div>
    </div>
  );
};

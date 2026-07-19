import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingState = () => {
  return (
    <div className="bg-white/50 border border-gray-100/50 backdrop-blur-xs rounded-2xl p-16 text-center shadow-xs flex flex-col items-center justify-center space-y-3 animate-pulse">
      <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
      <p className="text-xs font-semibold text-gray-500">Carregando informações...</p>
    </div>
  );
};

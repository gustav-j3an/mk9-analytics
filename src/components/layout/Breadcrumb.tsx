'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export const Breadcrumb = () => {
  const pathname = usePathname();
  const paths = pathname ? pathname.split('/').filter(Boolean) : [];

  const routeLabels: Record<string, string> = {
    dashboard: 'Dashboard',
    importacoes: 'Importações',
    operacoes: 'Operações',
    visitas: 'Visitas',
    promotores: 'Promotores',
    lojas: 'Lojas',
    stores: 'Lojas',
    industrias: 'Indústrias',
    configuracoes: 'Configurações',
  };

  return (
    <nav className="flex items-center space-x-2 text-[11px] font-bold uppercase tracking-wider text-[#A1A1AA]">
      <Link href="/dashboard" className="hover:text-[#09090B] transition-colors">
        MK9
      </Link>
      {paths.map((path, idx) => {
        // Skip root dashboard label to avoid redundant MK9 > Dashboard > Importações
        if (path === 'dashboard' && paths.length > 1) return null;
        
        const href = `/${paths.slice(0, idx + 1).join('/')}`;
        const label = routeLabels[path] || path;
        const isLast = idx === paths.length - 1;

        return (
          <React.Fragment key={href}>
            <span className="text-[#E4E4E7] font-normal">/</span>
            {isLast ? (
              <span className="text-[#09090B] font-bold truncate max-w-[120px] sm:max-w-none">
                {label}
              </span>
            ) : (
              <Link href={href} className="hover:text-[#09090B] transition-colors truncate max-w-[120px] sm:max-w-none">
                {label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumb;

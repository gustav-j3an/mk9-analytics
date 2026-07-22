'use client';
import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const routeLabels: Record<string, string> = { dashboard:'Dashboard', importacoes:'Importações', operacoes:'Operações', visitas:'Visitas', promotores:'Promotores', lojas:'Lojas', stores:'Lojas', industrias:'Indústrias', conciliacao:'Conciliação', roteiros:'Roteiros', novo:'Novo', nova:'Nova', editar:'Editar', imports:'Nova Importação' };
export const Breadcrumb = () => {
 const pathname=usePathname(); const paths=pathname?.split('/').filter(Boolean) ?? [];
 return <nav aria-label="Navegação estrutural" className="breadcrumb flex min-w-0 items-center space-x-2 text-[11px] font-bold uppercase tracking-wider"><Link href="/dashboard">MK9</Link>{paths.map((path,idx)=>{if(path==='dashboard'&&paths.length>1)return null; const href=`/${paths.slice(0,idx+1).join('/')}`; const label=routeLabels[path] || (path.length>16?'Detalhes':path); const last=idx===paths.length-1; return <React.Fragment key={href}><span>/</span>{last?<span className="max-w-[110px] truncate sm:max-w-48">{label}</span>:<Link className="max-w-[110px] truncate sm:max-w-48" href={href}>{label}</Link>}</React.Fragment>})}</nav>;
};
export default Breadcrumb;
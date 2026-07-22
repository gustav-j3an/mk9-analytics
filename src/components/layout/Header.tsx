import { Bell, Menu } from 'lucide-react';
import { Breadcrumb } from './Breadcrumb';
import { UserMenu } from './UserMenu';
import { GlobalSearch } from './GlobalSearch';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps { onMenuToggle: () => void }

export function Header({ onMenuToggle }: HeaderProps) {
  const currentDate = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date());
  return <header className="app-header sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b px-3 backdrop-blur-md sm:px-4 md:px-6">
    <div className="flex min-w-0 items-center gap-3"><button aria-label="Abrir menu" onClick={onMenuToggle} className="icon-button lg:hidden"><Menu /></button><Breadcrumb /></div>
    <div className="flex items-center gap-2 sm:gap-3"><GlobalSearch /><span className="hidden border-l pl-3 text-xs xl:block">{currentDate}</span><ThemeToggle /><button aria-label="Notificações" className="icon-button hidden sm:inline-flex"><Bell /></button><UserMenu /></div>
  </header>;
}
export default Header;
import { Menu } from 'lucide-react';
import { Breadcrumb } from './Breadcrumb';
import { UserMenu } from './UserMenu';
import { GlobalSearch } from './GlobalSearch';
import { ThemeToggle } from './ThemeToggle';
import { NotificationFeed } from './NotificationFeed';

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  return (
    <header className="app-header sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b px-3 backdrop-blur-xl sm:px-5 lg:px-7">
      <div className="flex min-w-0 items-center gap-3">
        <button
          aria-label="Abrir menu"
          onClick={onMenuToggle}
          className="icon-button lg:hidden"
        >
          <Menu className="h-4 w-4" />
        </button>
        <Breadcrumb />
      </div>
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        <GlobalSearch />
        <ThemeToggle />
        <NotificationFeed />
        <UserMenu />
      </div>
    </header>
  );
}
export default Header;
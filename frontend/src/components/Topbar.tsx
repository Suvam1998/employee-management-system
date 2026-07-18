'use client';

import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { ROLE_LABELS } from '@/lib/types';

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
      <button
        onClick={onMenu}
        className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
        aria-label="Toggle menu"
      >
        ☰
      </button>
      <div className="flex-1" />
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <div className="hidden text-right sm:block">
          <div className="text-sm font-medium">{user?.name}</div>
          <div className="text-xs text-slate-500">{user ? ROLE_LABELS[user.role] : ''}</div>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 dark:bg-brand-700 dark:text-white">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <button onClick={logout} className="btn-secondary hidden sm:inline-flex">
          Logout
        </button>
      </div>
    </header>
  );
}

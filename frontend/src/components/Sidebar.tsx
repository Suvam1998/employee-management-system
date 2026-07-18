'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { useAuth } from '@/lib/auth-context';
import { Role } from '@/lib/types';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  roles?: Role[]; // if omitted, all roles
}

const NAV: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: '▤', roles: ['super_admin', 'hr'] },
  { href: '/employees', label: 'Employees', icon: '👥', roles: ['super_admin', 'hr'] },
  { href: '/organization', label: 'Org Hierarchy', icon: '🗂', roles: ['super_admin', 'hr'] },
  { href: '/profile', label: 'My Profile', icon: '👤' },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();

  const items = NAV.filter((i) => !i.roles || (user && i.roles.includes(user.role)));

  return (
    <nav className="flex h-full flex-col gap-1 p-4">
      <div className="mb-4 flex items-center gap-2 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 font-bold text-white">
          E
        </div>
        <span className="text-lg font-bold">EMS</span>
      </div>
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + '/');
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={clsx(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
              active
                ? 'bg-brand-600 text-white'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
            )}
          >
            <span aria-hidden>{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

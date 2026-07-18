'use client';

import clsx from 'clsx';
import { ReactNode } from 'react';
import { EmployeeStatus, Role, ROLE_LABELS } from '@/lib/types';

export function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: number | string;
  icon: string;
  accent: string;
}) {
  return (
    <div className="card flex items-center gap-4">
      <div className={clsx('flex h-12 w-12 items-center justify-center rounded-lg text-xl', accent)}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-sm text-slate-500">{label}</div>
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: EmployeeStatus }) {
  return (
    <span
      className={clsx(
        'badge',
        status === 'active'
          ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
          : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
      )}
    >
      {status}
    </span>
  );
}

export function RoleBadge({ role }: { role: Role }) {
  const map: Record<Role, string> = {
    super_admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    hr: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    employee: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  };
  return <span className={clsx('badge', map[role])}>{ROLE_LABELS[role]}</span>;
}

export function Spinner() {
  return (
    <div className="flex justify-center py-10">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="py-10 text-center text-sm text-slate-500">{children}</div>;
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold sm:text-2xl">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

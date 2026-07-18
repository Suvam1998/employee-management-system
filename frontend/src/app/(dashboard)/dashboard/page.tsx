'use client';

import { useEffect, useState } from 'react';
import { api, extractError } from '@/lib/api';
import { Stats } from '@/lib/types';
import { StatCard, Spinner, PageHeader } from '@/components/ui';
import { DepartmentBarChart, RolePieChart } from '@/components/DashboardCharts';

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/employees/stats')
      .then(({ data }) => setStats(data.data))
      .catch((e) => setError(extractError(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (error) return <div className="card text-red-600">{error}</div>;
  if (!stats) return null;

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Overview of your organization" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Employees"
          value={stats.totalEmployees}
          icon="👥"
          accent="bg-brand-100 text-brand-700 dark:bg-brand-700 dark:text-white"
        />
        <StatCard
          label="Active"
          value={stats.activeEmployees}
          icon="✅"
          accent="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
        />
        <StatCard
          label="Inactive"
          value={stats.inactiveEmployees}
          icon="⏸"
          accent="bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-200"
        />
        <StatCard
          label="Departments"
          value={stats.departmentCount}
          icon="🏢"
          accent="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DepartmentBarChart data={stats.byDepartment} />
        <RolePieChart data={stats.byRole} />
      </div>
    </div>
  );
}

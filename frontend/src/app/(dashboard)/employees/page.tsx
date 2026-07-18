'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, extractError } from '@/lib/api';
import { Employee, Pagination } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { Modal } from '@/components/Modal';
import { EmployeeForm } from '@/components/EmployeeForm';
import { PageHeader, Spinner, EmptyState, StatusBadge, RoleBadge } from '@/components/ui';

const DEPARTMENTS = ['Engineering', 'Human Resources', 'Sales', 'Marketing', 'Finance', 'Operations'];

export default function EmployeesPage() {
  const { hasRole } = useAuth();
  const [items, setItems] = useState<Employee[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [managers, setManagers] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // filters
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  // modals
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState<Employee | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (debounced) params.set('search', debounced);
      if (department) params.set('department', department);
      if (role) params.set('role', role);
      if (status) params.set('status', status);
      params.set('sortBy', sortBy);
      params.set('order', order);
      params.set('page', String(page));
      params.set('limit', '10');
      const { data } = await api.get(`/employees?${params.toString()}`);
      setItems(data.data);
      setPagination(data.pagination);
    } catch (e) {
      setError(extractError(e));
    } finally {
      setLoading(false);
    }
  }, [debounced, department, role, status, sortBy, order, page]);

  useEffect(() => {
    load();
  }, [load]);

  // managers list for the form (all active employees, large page)
  const loadManagers = useCallback(async () => {
    try {
      const { data } = await api.get('/employees?limit=100&sortBy=name&order=asc');
      setManagers(data.data);
    } catch {
      // non-fatal: form can still open with an empty manager list
      setManagers([]);
    }
  }, []);

  useEffect(() => {
    loadManagers();
  }, [loadManagers]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (e: Employee) => {
    setEditing(e);
    setFormOpen(true);
  };

  const onSaved = () => {
    setFormOpen(false);
    setEditing(null);
    load();
    loadManagers();
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await api.delete(`/employees/${deleting._id}`);
      setDeleting(null);
      load();
    } catch (e) {
      setError(extractError(e));
      setDeleting(null);
    }
  };

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setOrder('asc');
    }
  };

  const sortIcon = (field: string) => (sortBy === field ? (order === 'asc' ? ' ▲' : ' ▼') : '');

  const managerName = (m: Employee['reportingManager']) =>
    m && typeof m === 'object' ? m.name : '—';

  const hasFilters = useMemo(
    () => Boolean(debounced || department || role || status),
    [debounced, department, role, status],
  );

  return (
    <div>
      <PageHeader
        title="Employees"
        subtitle={`${pagination.total} total`}
        action={
          hasRole('super_admin', 'hr') ? (
            <button className="btn-primary" onClick={openCreate}>
              + Add Employee
            </button>
          ) : null
        }
      />

      {/* Filters */}
      <div className="card mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <input
          className="input lg:col-span-2"
          placeholder="Search by name, email, ID…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <select className="input" value={department} onChange={(e) => { setDepartment(e.target.value); setPage(1); }}>
          <option value="">All Departments</option>
          {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select className="input" value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}>
          <option value="">All Roles</option>
          <option value="super_admin">Super Admin</option>
          <option value="hr">HR Manager</option>
          <option value="employee">Employee</option>
        </select>
        <select className="input" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {error && <div className="card mb-4 text-red-600">{error}</div>}

      {/* Table */}
      <div className="card overflow-x-auto p-0">
        {loading ? (
          <Spinner />
        ) : items.length === 0 ? (
          <EmptyState>{hasFilters ? 'No employees match your filters.' : 'No employees yet.'}</EmptyState>
        ) : (
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800">
              <tr>
                <th className="cursor-pointer px-4 py-3" onClick={() => toggleSort('name')}>Name{sortIcon('name')}</th>
                <th className="px-4 py-3">Employee ID</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Designation</th>
                <th className="px-4 py-3">Manager</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="cursor-pointer px-4 py-3" onClick={() => toggleSort('joiningDate')}>Joined{sortIcon('joiningDate')}</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((e) => (
                <tr key={e._id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3">
                    <div className="font-medium">{e.name}</div>
                    <div className="text-xs text-slate-500">{e.email}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{e.employeeId}</td>
                  <td className="px-4 py-3">{e.department}</td>
                  <td className="px-4 py-3">{e.designation}</td>
                  <td className="px-4 py-3">{managerName(e.reportingManager)}</td>
                  <td className="px-4 py-3"><RoleBadge role={e.role} /></td>
                  <td className="px-4 py-3"><StatusBadge status={e.status} /></td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{new Date(e.joiningDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {hasRole('super_admin', 'hr') && (
                        <button className="text-brand-600 hover:underline" onClick={() => openEdit(e)}>Edit</button>
                      )}
                      {hasRole('super_admin') && (
                        <button className="text-red-600 hover:underline" onClick={() => setDeleting(e)}>Delete</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-slate-500">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <div className="flex gap-2">
            <button className="btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </button>
            <button className="btn-secondary" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </button>
          </div>
        </div>
      )}

      {/* Create / Edit modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit Employee' : 'Add Employee'}
        size="lg"
      >
        <EmployeeForm
          employee={editing}
          managers={managers}
          onSaved={onSaved}
          onCancel={() => setFormOpen(false)}
        />
      </Modal>

      {/* Delete confirm */}
      <Modal open={Boolean(deleting)} onClose={() => setDeleting(null)} title="Delete Employee">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Are you sure you want to delete <strong>{deleting?.name}</strong>? This is a soft delete and can be
          restored in the database.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn-secondary" onClick={() => setDeleting(null)}>Cancel</button>
          <button className="btn-danger" onClick={confirmDelete}>Delete</button>
        </div>
      </Modal>
    </div>
  );
}

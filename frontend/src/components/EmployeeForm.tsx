'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { api, extractError } from '@/lib/api';
import { Employee, Role } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';

const schema = z.object({
  employeeId: z.string().optional(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email required'),
  phone: z.string().regex(/^[+]?[\d][\d\s-]{7,15}$/, 'Valid phone number required'),
  department: z.string().min(1, 'Department is required'),
  designation: z.string().min(1, 'Designation is required'),
  salary: z.coerce.number().min(0, 'Salary must be positive'),
  joiningDate: z.string().min(1, 'Joining date is required'),
  status: z.enum(['active', 'inactive']),
  role: z.enum(['super_admin', 'hr', 'employee']),
  reportingManager: z.string().optional(),
  password: z.string().min(6, 'Min 6 characters').optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

const DEPARTMENTS = ['Engineering', 'Human Resources', 'Sales', 'Marketing', 'Finance', 'Operations'];

export function EmployeeForm({
  employee,
  managers,
  onSaved,
  onCancel,
}: {
  employee?: Employee | null;
  managers: Employee[];
  onSaved: () => void;
  onCancel: () => void;
}) {
  const { hasRole } = useAuth();
  const isEdit = Boolean(employee);
  const [serverError, setServerError] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      employeeId: employee?.employeeId || '',
      name: employee?.name || '',
      email: employee?.email || '',
      phone: employee?.phone || '',
      department: employee?.department || 'Engineering',
      designation: employee?.designation || '',
      salary: employee?.salary ?? 0,
      joiningDate: employee?.joiningDate ? employee.joiningDate.slice(0, 10) : '',
      status: employee?.status || 'active',
      role: employee?.role || 'employee',
      reportingManager:
        typeof employee?.reportingManager === 'object' && employee?.reportingManager
          ? employee.reportingManager._id
          : (employee?.reportingManager as string) || '',
      password: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setServerError('');
    try {
      const payload: Record<string, unknown> = { ...values };
      if (!payload.password) delete payload.password;
      if (!payload.employeeId) delete payload.employeeId;
      // reportingManager: '' means none
      payload.reportingManager = values.reportingManager || null;

      let body: unknown = payload;
      let headers: Record<string, string> | undefined;
      if (imageFile) {
        const fd = new FormData();
        Object.entries(payload).forEach(([k, v]) => {
          if (v !== null && v !== undefined) fd.append(k, String(v));
        });
        fd.append('profileImage', imageFile);
        body = fd;
        headers = { 'Content-Type': 'multipart/form-data' };
      }

      if (isEdit) {
        await api.put(`/employees/${employee!._id}`, body, { headers });
      } else {
        await api.post('/employees', body, { headers });
      }
      onSaved();
    } catch (err) {
      setServerError(extractError(err));
    }
  };

  const canAssignSuperAdmin = hasRole('super_admin');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {serverError && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {serverError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Full Name" error={errors.name?.message}>
          <input className="input" {...register('name')} />
        </Field>
        <Field label="Email" error={errors.email?.message}>
          <input className="input" type="email" {...register('email')} />
        </Field>
        <Field label="Phone" error={errors.phone?.message}>
          <input className="input" {...register('phone')} />
        </Field>
        <Field label="Employee ID (auto if blank)" error={errors.employeeId?.message}>
          <input className="input" placeholder="EMP0001" {...register('employeeId')} />
        </Field>
        <Field label="Department" error={errors.department?.message}>
          <select className="input" {...register('department')}>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </Field>
        <Field label="Designation" error={errors.designation?.message}>
          <input className="input" {...register('designation')} />
        </Field>
        <Field label="Salary" error={errors.salary?.message}>
          <input className="input" type="number" step="0.01" {...register('salary')} />
        </Field>
        <Field label="Joining Date" error={errors.joiningDate?.message}>
          <input className="input" type="date" {...register('joiningDate')} />
        </Field>
        <Field label="Status" error={errors.status?.message}>
          <select className="input" {...register('status')}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </Field>
        <Field label="Role" error={errors.role?.message}>
          <select className="input" {...register('role')}>
            <option value="employee">Employee</option>
            <option value="hr">HR Manager</option>
            {canAssignSuperAdmin && <option value="super_admin">Super Admin</option>}
          </select>
        </Field>
        <Field label="Reporting Manager" error={errors.reportingManager?.message}>
          <select className="input" {...register('reportingManager')}>
            <option value="">— None —</option>
            {managers
              .filter((m) => m._id !== employee?._id)
              .map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name} ({m.employeeId})
                </option>
              ))}
          </select>
        </Field>
        <Field label={isEdit ? 'Reset Password (optional)' : 'Password (default if blank)'} error={errors.password?.message}>
          <input className="input" type="password" placeholder="••••••" {...register('password')} />
        </Field>
      </div>

      <Field label="Profile Image (optional)">
        <input
          className="input"
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files?.[0] || null)}
        />
      </Field>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : isEdit ? 'Update Employee' : 'Create Employee'}
        </button>
      </div>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

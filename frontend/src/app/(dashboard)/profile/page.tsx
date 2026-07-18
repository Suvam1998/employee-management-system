'use client';

import { useState } from 'react';
import { api, extractError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { PageHeader, RoleBadge, StatusBadge } from '@/components/ui';

export default function ProfilePage() {
  const { user, refresh } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [password, setPassword] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', name);
      fd.append('phone', phone);
      if (password) fd.append('password', password);
      if (imageFile) fd.append('profileImage', imageFile);
      await api.put(`/employees/${user._id}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await refresh();
      setPassword('');
      setMessage('Profile updated successfully.');
    } catch (err) {
      setError(extractError(err));
    } finally {
      setSaving(false);
    }
  };

  const readOnly = [
    ['Employee ID', user.employeeId],
    ['Email', user.email],
    ['Department', user.department],
    ['Designation', user.designation],
    ['Salary', `$${user.salary.toLocaleString()}`],
    ['Joining Date', new Date(user.joiningDate).toLocaleDateString()],
  ];

  return (
    <div className="max-w-3xl">
      <PageHeader title="My Profile" subtitle="View and update your personal details" />

      <div className="mb-4 card flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-2xl font-semibold text-brand-700 dark:bg-brand-700 dark:text-white">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="text-lg font-semibold">{user.name}</div>
          <div className="mt-1 flex gap-2">
            <RoleBadge role={user.role} />
            <StatusBadge status={user.status} />
          </div>
        </div>
      </div>

      <div className="mb-4 card">
        <h3 className="mb-3 font-semibold">Details (read-only)</h3>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {readOnly.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs uppercase text-slate-500">{label}</dt>
              <dd className="text-sm font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <form onSubmit={onSubmit} className="card space-y-4">
        <h3 className="font-semibold">Editable Information</h3>
        {message && (
          <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-300">
            {message}
          </div>
        )}
        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Full Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>
          <div>
            <label className="label">New Password (optional)</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank to keep current"
            />
          </div>
          <div>
            <label className="label">Profile Image</label>
            <input className="input" type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
          </div>
        </div>
        <div className="flex justify-end">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

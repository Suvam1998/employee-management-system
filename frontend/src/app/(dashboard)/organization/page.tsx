'use client';

import { useEffect, useState } from 'react';
import { api, extractError } from '@/lib/api';
import { TreeNode } from '@/lib/types';
import { OrgTree } from '@/components/OrgTree';
import { PageHeader, Spinner, EmptyState } from '@/components/ui';

export default function OrganizationPage() {
  const [roots, setRoots] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/organization/tree')
      .then(({ data }) => setRoots(data.data))
      .catch((e) => setError(extractError(e)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader title="Organizational Hierarchy" subtitle="Reporting structure across the company" />
      {error && <div className="card mb-4 text-red-600">{error}</div>}
      <div className="card">
        {loading ? (
          <Spinner />
        ) : roots.length === 0 ? (
          <EmptyState>No hierarchy to display.</EmptyState>
        ) : (
          <OrgTree roots={roots} />
        )}
      </div>
    </div>
  );
}

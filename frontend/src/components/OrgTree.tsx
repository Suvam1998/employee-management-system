'use client';

import { useState } from 'react';
import { TreeNode, ROLE_LABELS } from '@/lib/types';

function TreeItem({ node, depth }: { node: TreeNode; depth: number }) {
  const [open, setOpen] = useState(depth < 2);
  const hasReports = node.reports.length > 0;

  return (
    <li>
      <div
        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900"
        style={{ marginLeft: depth * 16 }}
      >
        {hasReports ? (
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex h-5 w-5 items-center justify-center rounded text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label={open ? 'Collapse' : 'Expand'}
          >
            {open ? '▾' : '▸'}
          </button>
        ) : (
          <span className="inline-block h-5 w-5 text-center text-slate-300">•</span>
        )}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700 dark:bg-brand-700 dark:text-white">
          {node.name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">
            {node.name}
            <span className="ml-2 text-xs font-normal text-slate-400">{node.employeeId}</span>
          </div>
          <div className="truncate text-xs text-slate-500">
            {node.designation} · {node.department} · {ROLE_LABELS[node.role]}
          </div>
        </div>
        {hasReports && (
          <span className="ml-auto badge bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {node.reports.length} report{node.reports.length > 1 ? 's' : ''}
          </span>
        )}
      </div>
      {hasReports && open && (
        <ul className="mt-1 space-y-1 border-l border-dashed border-slate-300 dark:border-slate-700">
          {node.reports.map((child) => (
            <TreeItem key={child._id} node={child} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function OrgTree({ roots }: { roots: TreeNode[] }) {
  return (
    <ul className="space-y-1">
      {roots.map((root) => (
        <TreeItem key={root._id} node={root} depth={0} />
      ))}
    </ul>
  );
}

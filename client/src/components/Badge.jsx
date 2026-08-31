import React from 'react';

const STATUS_STYLES = {
  Todo: 'bg-gray-100 text-gray-600',
  'In Progress': 'bg-blue-50 text-blue-600',
  Completed: 'bg-green-50 text-green-600',
  Planning: 'bg-purple-50 text-purple-600',
  'On Hold': 'bg-amber-50 text-amber-600',
};

const PRIORITY_STYLES = {
  Low: 'bg-gray-100 text-gray-600',
  Medium: 'bg-amber-50 text-amber-600',
  High: 'bg-red-50 text-red-600',
};

export const StatusBadge = ({ status }) => (
  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[status] || 'bg-gray-100 text-gray-600'}`}>
    {status}
  </span>
);

export const PriorityBadge = ({ priority }) => (
  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${PRIORITY_STYLES[priority] || 'bg-gray-100 text-gray-600'}`}>
    {priority}
  </span>
);

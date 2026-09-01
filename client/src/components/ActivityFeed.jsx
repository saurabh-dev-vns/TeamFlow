import React, { useCallback, useEffect, useState } from 'react';
import {
  PlusCircle,
  Pencil,
  Trash2,
  ArrowRightLeft,
  UserPlus,
  UserMinus,
  CheckSquare,
  MessageSquare,
  UserCog,
  History,
} from 'lucide-react';
import api from '../services/api';
import { getSocket } from '../services/socket';
import Avatar from './Avatar';
import LoadingSpinner from './LoadingSpinner';
import EmptyState from './EmptyState';
import { formatRelativeTime } from '../utils/formatDate';

const ACTION_ICONS = {
  PROJECT_CREATED: PlusCircle,
  PROJECT_UPDATED: Pencil,
  PROJECT_DELETED: Trash2,
  MEMBER_ADDED: UserPlus,
  MEMBER_REMOVED: UserMinus,
  TASK_CREATED: PlusCircle,
  TASK_UPDATED: Pencil,
  TASK_STATUS_CHANGED: ArrowRightLeft,
  TASK_ASSIGNED: UserCog,
  TASK_DELETED: Trash2,
  CHECKLIST_ITEM_TOGGLED: CheckSquare,
  COMMENT_ADDED: MessageSquare,
};

const ACTION_COLORS = {
  PROJECT_CREATED: 'bg-emerald-50 text-emerald-600',
  PROJECT_UPDATED: 'bg-blue-50 text-blue-600',
  PROJECT_DELETED: 'bg-red-50 text-red-600',
  MEMBER_ADDED: 'bg-emerald-50 text-emerald-600',
  MEMBER_REMOVED: 'bg-amber-50 text-amber-600',
  TASK_CREATED: 'bg-emerald-50 text-emerald-600',
  TASK_UPDATED: 'bg-blue-50 text-blue-600',
  TASK_STATUS_CHANGED: 'bg-violet-50 text-violet-600',
  TASK_ASSIGNED: 'bg-sky-50 text-sky-600',
  TASK_DELETED: 'bg-red-50 text-red-600',
  CHECKLIST_ITEM_TOGGLED: 'bg-teal-50 text-teal-600',
  COMMENT_ADDED: 'bg-gray-100 text-gray-600',
};

// Renders a live-updating audit trail. Pass either `projectId` (all events
// across the project) or `taskId` (events scoped to one task) — not both.
const ActivityFeed = ({ projectId, taskId }) => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const endpoint = taskId ? `/tasks/${taskId}/activity` : `/projects/${projectId}/activity`;

  const load = useCallback(
    async (pageNum) => {
      const { data } = await api.get(endpoint, { params: { page: pageNum, limit: 20 } });
      setHasMore(pageNum < data.pages);
      return data.entries;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [endpoint]
  );

  useEffect(() => {
    setLoading(true);
    setPage(1);
    load(1)
      .then(setEntries)
      .finally(() => setLoading(false));
  }, [load]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const more = await load(nextPage);
      setEntries((prev) => [...prev, ...more]);
      setPage(nextPage);
    } finally {
      setLoadingMore(false);
    }
  };

  // Live-append new entries as they happen, filtered to this feed's scope.
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNew = (entry) => {
      const belongsHere = taskId ? entry.task?._id === taskId || entry.task === taskId : true;
      if (!belongsHere) return;
      setEntries((prev) => [entry, ...prev]);
    };

    socket.on('activity:new', handleNew);
    return () => socket.off('activity:new', handleNew);
  }, [taskId]);

  if (loading) {
    return (
      <div className="py-8">
        <LoadingSpinner size={22} label="Loading activity..." />
      </div>
    );
  }

  if (entries.length === 0) {
    return <EmptyState icon={History} title="No activity yet" description="Actions taken here will show up in this feed." />;
  }

  return (
    <div className="space-y-1">
      {entries.map((entry) => {
        const Icon = ACTION_ICONS[entry.action] || History;
        const colorClass = ACTION_COLORS[entry.action] || 'bg-gray-100 text-gray-600';
        return (
          <div key={entry._id} className="flex items-start gap-3 py-2.5">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
              <Icon size={14} />
            </div>
            <div className="flex-1 min-w-0 flex items-start gap-2">
              <Avatar name={entry.user?.name || 'Unknown'} src={entry.user?.avatar} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700">{entry.message}</p>
                <p className="text-xs text-gray-400 mt-0.5">{formatRelativeTime(entry.createdAt)}</p>
              </div>
            </div>
          </div>
        );
      })}

      {hasMore && (
        <button
          onClick={loadMore}
          disabled={loadingMore}
          className="text-xs font-medium text-primary-600 hover:text-primary-700 mt-2 disabled:opacity-50"
        >
          {loadingMore ? 'Loading...' : 'Load more'}
        </button>
      )}
    </div>
  );
};

export default ActivityFeed;

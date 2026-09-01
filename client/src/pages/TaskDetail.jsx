import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Send, Pencil, Trash2, Check } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { getSocket } from '../services/socket';
import { StatusBadge, PriorityBadge } from '../components/Badge';
import Avatar from '../components/Avatar';
import LoadingSpinner from '../components/LoadingSpinner';
import TaskFormModal from '../components/TaskFormModal';
import ConfirmDialog from '../components/ConfirmDialog';
import ActivityFeed from '../components/ActivityFeed';
import { formatDate, formatRelativeTime, isOverdue } from '../utils/formatDate';

const STATUS_OPTIONS = ['Todo', 'In Progress', 'Completed'];

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [posting, setPosting] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [members, setMembers] = useState([]);

  const isAdmin = user?.role === 'admin';
  const canEditStatus = task && (isAdmin || String(task.assignedTo?._id) === String(user._id));

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/tasks/${id}`);
      setTask(data.task);
      setComments(data.comments);
      const proj = data.task.project;
      const { data: projectDetail } = await api.get(`/projects/${proj._id}`);
      setMembers([projectDetail.project.owner, ...projectDetail.project.members]);
    } catch (err) {
      addToast('Failed to load task', 'error');
      navigate('/tasks');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handleComment = ({ taskId, comment }) => {
      if (taskId === id) setComments((prev) => [...prev, comment]);
    };
    const handleUpdated = (updated) => {
      if (updated._id === id) setTask((prev) => ({ ...prev, ...updated }));
    };
    socket.on('comment:new', handleComment);
    socket.on('task:updated', handleUpdated);
    return () => {
      socket.off('comment:new', handleComment);
      socket.off('task:updated', handleUpdated);
    };
  }, [id]);

  const handleStatusChange = async (status) => {
    const prev = task.status;
    setTask((t) => ({ ...t, status }));
    try {
      await api.patch(`/tasks/${id}/status`, { status });
      addToast('Status updated', 'success');
    } catch (err) {
      setTask((t) => ({ ...t, status: prev }));
      addToast(err.response?.data?.message || 'Failed to update status', 'error');
    }
  };

  const toggleChecklistItem = async (itemId) => {
    const { data } = await api.patch(`/tasks/${id}/checklist/${itemId}`);
    setTask(data);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setPosting(true);
    try {
      const { data } = await api.post(`/tasks/${id}/comments`, { text: commentText });
      setComments((prev) => [...prev, data]);
      setCommentText('');
    } catch (err) {
      addToast('Failed to post comment', 'error');
    } finally {
      setPosting(false);
    }
  };

  const handleEditSubmit = async (form) => {
    const { data } = await api.put(`/tasks/${id}`, form);
    setTask((prev) => ({ ...prev, ...data }));
    addToast('Task updated', 'success');
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/tasks/${id}`);
      addToast('Task deleted', 'success');
      navigate(`/projects/${task.project._id}`);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete task', 'error');
    } finally {
      setDeleting(false);
    }
  };

  if (loading || !task) {
    return (
      <div className="h-64 flex items-center justify-center">
        <LoadingSpinner size={28} label="Loading task..." />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link to={`/projects/${task.project._id}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={15} /> Back to {task.project.name}
      </Link>

      <div className="bg-white rounded-xl border border-gray-100 p-5 md:p-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-800">{task.title}</h1>
            <p className="text-sm text-gray-500 mt-2">{task.description || 'No description provided.'}</p>
          </div>
          {isAdmin && (
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => setEditOpen(true)} className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                <Pencil size={14} /> Edit
              </button>
              <button onClick={() => setDeleteOpen(true)} className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-red-100 text-red-500 hover:bg-red-50">
                <Trash2 size={14} /> Delete
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-4">
          <PriorityBadge priority={task.priority} />
          {isOverdue(task.dueDate, task.status) && (
            <span className="text-xs font-medium text-red-500 bg-red-50 px-2.5 py-1 rounded-full">Overdue</span>
          )}
          <span className="text-xs text-gray-400">Due {formatDate(task.dueDate)}</span>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-5 pt-5 border-t border-gray-50">
          <div>
            <p className="text-xs text-gray-400 mb-1">Assigned to</p>
            {task.assignedTo ? (
              <div className="flex items-center gap-2">
                <Avatar name={task.assignedTo.name} src={task.assignedTo.avatar} size="sm" />
                <span className="text-sm text-gray-700">{task.assignedTo.name}</span>
              </div>
            ) : (
              <span className="text-sm text-gray-400">Unassigned</span>
            )}
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Status</p>
            {canEditStatus ? (
              <select
                value={task.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm bg-white"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            ) : (
              <StatusBadge status={task.status} />
            )}
          </div>
        </div>

        {task.checklist?.length > 0 && (
          <div className="mt-5 pt-5 border-t border-gray-50">
            <p className="text-sm font-semibold text-gray-700 mb-2">
              Checklist ({task.checklist.filter((c) => c.completed).length}/{task.checklist.length})
            </p>
            <div className="space-y-1.5">
              {task.checklist.map((item) => (
                <button
                  key={item._id}
                  onClick={() => toggleChecklistItem(item._id)}
                  className="flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50"
                >
                  <span
                    className={`w-[18px] h-[18px] rounded flex items-center justify-center flex-shrink-0 border ${
                      item.completed ? 'bg-primary-600 border-primary-600' : 'border-gray-300'
                    }`}
                  >
                    {item.completed && <Check size={12} className="text-white" />}
                  </span>
                  <span className={`text-sm ${item.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                    {item.text}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5 md:p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Comments ({comments.length})</h3>
        <div className="space-y-4 mb-5">
          {comments.length === 0 && <p className="text-sm text-gray-400">No comments yet. Be the first to comment.</p>}
          {comments.map((c) => (
            <div key={c._id} className="flex gap-3">
              <Avatar name={c.user.name} src={c.user.avatar} size="sm" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-800">{c.user.name}</span>
                  <span className="text-xs text-gray-400">{formatRelativeTime(c.createdAt)}</span>
                </div>
                <p className="text-sm text-gray-600 mt-0.5">{c.text}</p>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleAddComment} className="flex gap-2">
          <input
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Write a comment..."
            className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button
            type="submit"
            disabled={posting || !commentText.trim()}
            className="px-4 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5 md:p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Activity</h3>
        <ActivityFeed taskId={id} />
      </div>

      <TaskFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSubmit={handleEditSubmit}
        members={members}
        initialData={task}
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
        description={`This will permanently delete "${task.title}". This action cannot be undone.`}
      />
    </div>
  );
};

export default TaskDetail;

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, UserPlus, X, Calendar, Pencil, Trash2 } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { getSocket } from '../services/socket';
import { StatusBadge } from '../components/Badge';
import Avatar from '../components/Avatar';
import LoadingSpinner from '../components/LoadingSpinner';
import KanbanBoard from '../components/KanbanBoard';
import TaskFormModal from '../components/TaskFormModal';
import ProjectFormModal from '../components/ProjectFormModal';
import AddMemberModal from '../components/AddMemberModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { formatDate } from '../utils/formatDate';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState([]);

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [deleteProjectOpen, setDeleteProjectOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isAdmin = user?.role === 'admin';

  const load = useCallback(async () => {
    try {
      const [{ data }, { data: users }] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get('/users'),
      ]);
      setProject(data.project);
      setTasks(data.tasks);
      setStats(data.stats);
      setAllUsers(users);
    } catch (err) {
      addToast('Failed to load project', 'error');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // Join the project's socket room to get live task/comment updates
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit('project:join', id);

    const handleCreated = (task) => {
      if (task.project?._id === id || task.project === id) {
        setTasks((prev) => [task, ...prev]);
      }
    };
    const handleUpdated = (task) => {
      setTasks((prev) => prev.map((t) => (t._id === task._id ? task : t)));
    };
    const handleDeleted = ({ _id }) => {
      setTasks((prev) => prev.filter((t) => t._id !== _id));
    };

    socket.on('task:created', handleCreated);
    socket.on('task:updated', handleUpdated);
    socket.on('task:deleted', handleDeleted);

    return () => {
      socket.emit('project:leave', id);
      socket.off('task:created', handleCreated);
      socket.off('task:updated', handleUpdated);
      socket.off('task:deleted', handleDeleted);
    };
  }, [id]);

  const handleCreateOrUpdateTask = async (form) => {
    if (editingTask) {
      const { data } = await api.put(`/tasks/${editingTask._id}`, form);
      setTasks((prev) => prev.map((t) => (t._id === data._id ? data : t)));
      addToast('Task updated', 'success');
    } else {
      const { data } = await api.post('/tasks', { ...form, project: id });
      setTasks((prev) => [data, ...prev]);
      addToast('Task created', 'success');
    }
  };

  const handleStatusChange = async (taskId, status) => {
    // optimistic update
    const prevTasks = tasks;
    setTasks((prev) => prev.map((t) => (t._id === taskId ? { ...t, status } : t)));
    try {
      await api.patch(`/tasks/${taskId}/status`, { status });
    } catch (err) {
      setTasks(prevTasks);
      addToast(err.response?.data?.message || 'Failed to update task', 'error');
    }
  };

  const handleAddMember = async (userId) => {
    const { data } = await api.post(`/projects/${id}/members`, { userId });
    setProject(data);
    addToast('Member added', 'success');
  };

  const handleRemoveMember = async (userId) => {
    const { data } = await api.delete(`/projects/${id}/members/${userId}`);
    setProject(data);
    addToast('Member removed', 'success');
  };

  const handleUpdateProject = async (form) => {
    const { data } = await api.put(`/projects/${id}`, form);
    setProject(data);
    addToast('Project updated', 'success');
  };

  const handleDeleteProject = async () => {
    setDeleting(true);
    try {
      await api.delete(`/projects/${id}`);
      addToast('Project deleted', 'success');
      navigate('/projects');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete project', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const canDragTask = (task) => isAdmin || String(task.assignedTo?._id) === String(user._id);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <LoadingSpinner size={28} label="Loading project..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/projects" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={15} /> Back to projects
      </Link>

      <div className="bg-white rounded-xl border border-gray-100 p-5 md:p-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-gray-800">{project.name}</h1>
              <StatusBadge status={project.status} />
            </div>
            <p className="text-sm text-gray-500 mt-2 max-w-2xl">{project.description}</p>
            <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-3">
              <Calendar size={13} />
              {formatDate(project.startDate)} — {formatDate(project.deadline)}
            </div>
          </div>

          {isAdmin && (
            <div className="flex gap-2">
              <button
                onClick={() => setProjectModalOpen(true)}
                className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                <Pencil size={14} /> Edit
              </button>
              <button
                onClick={() => setDeleteProjectOpen(true)}
                className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-red-100 text-red-500 hover:bg-red-50"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 mt-6">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-gray-800">{stats.total}</p>
            <p className="text-xs text-gray-400">Total Tasks</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-green-600">{stats.completed}</p>
            <p className="text-xs text-gray-400">Completed</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-amber-600">{stats.pending}</p>
            <p className="text-xs text-gray-400">Pending</p>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>Overall progress</span>
            <span>{stats.progress}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${stats.progress}%` }} />
          </div>
        </div>

        <div className="mt-5 pt-5 border-t border-gray-50">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-700">Team Members</h3>
            {isAdmin && (
              <button
                onClick={() => setMemberModalOpen(true)}
                className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                <UserPlus size={13} /> Add member
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1.5 bg-gray-50 rounded-full pl-1 pr-3 py-1">
              <Avatar name={project.owner.name} src={project.owner.avatar} size="sm" />
              <span className="text-xs text-gray-600">{project.owner.name} (Owner)</span>
            </div>
            {project.members.map((m) => (
              <div key={m._id} className="flex items-center gap-1.5 bg-gray-50 rounded-full pl-1 pr-2 py-1">
                <Avatar name={m.name} src={m.avatar} size="sm" />
                <span className="text-xs text-gray-600">{m.name}</span>
                {isAdmin && (
                  <button onClick={() => handleRemoveMember(m._id)} className="text-gray-300 hover:text-red-500">
                    <X size={12} />
                  </button>
                )}
              </div>
            ))}
            {project.members.length === 0 && <p className="text-xs text-gray-400">No members added yet.</p>}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-800">Task Board</h2>
        {isAdmin && (
          <button
            onClick={() => {
              setEditingTask(null);
              setTaskModalOpen(true);
            }}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            <Plus size={16} /> New Task
          </button>
        )}
      </div>

      <KanbanBoard tasks={tasks} onStatusChange={handleStatusChange} canDrag={canDragTask} />

      <TaskFormModal
        open={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        onSubmit={handleCreateOrUpdateTask}
        members={[project.owner, ...project.members]}
        initialData={editingTask}
      />

      <ProjectFormModal
        open={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        onSubmit={handleUpdateProject}
        initialData={project}
      />

      <AddMemberModal
        open={memberModalOpen}
        onClose={() => setMemberModalOpen(false)}
        onAdd={handleAddMember}
        allUsers={allUsers}
        existingMemberIds={[project.owner._id, ...project.members.map((m) => m._id)]}
      />

      <ConfirmDialog
        open={deleteProjectOpen}
        onClose={() => setDeleteProjectOpen(false)}
        onConfirm={handleDeleteProject}
        loading={deleting}
        description={`This will permanently delete "${project.name}" and all of its tasks. This action cannot be undone.`}
      />
    </div>
  );
};

export default ProjectDetail;

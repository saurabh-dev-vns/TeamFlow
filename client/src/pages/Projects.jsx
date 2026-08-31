import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Calendar, Users as UsersIcon, MoreVertical, Pencil, Trash2, FolderKanban } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { StatusBadge } from '../components/Badge';
import Avatar from '../components/Avatar';
import EmptyState from '../components/EmptyState';
import { SkeletonCard } from '../components/Skeleton';
import ProjectFormModal from '../components/ProjectFormModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { formatDate } from '../utils/formatDate';

const Projects = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState(null);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/projects');
      setProjects(data);
    } catch (err) {
      addToast('Failed to load projects', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateOrUpdate = async (form) => {
    if (editing) {
      await api.put(`/projects/${editing._id}`, form);
      addToast('Project updated', 'success');
    } else {
      await api.post('/projects', form);
      addToast('Project created', 'success');
    }
    fetchProjects();
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/projects/${deleteTarget._id}`);
      addToast('Project deleted', 'success');
      setDeleteTarget(null);
      fetchProjects();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete project', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Projects</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage all your team's projects</p>
        </div>
        {user?.role === 'admin' && (
          <button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition"
          >
            <Plus size={16} /> New Project
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description={user?.role === 'admin' ? 'Create your first project to get started.' : 'You have not been added to any projects yet.'}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div key={project._id} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition relative">
              <div className="flex items-start justify-between">
                <Link to={`/projects/${project._id}`} className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 truncate pr-2">{project.name}</h3>
                </Link>
                {user?.role === 'admin' && (
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpenId(menuOpenId === project._id ? null : project._id)}
                      className="p-1 rounded hover:bg-gray-100 text-gray-400"
                    >
                      <MoreVertical size={16} />
                    </button>
                    {menuOpenId === project._id && (
                      <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-100 rounded-lg shadow-lg z-10 py-1">
                        <button
                          onClick={() => {
                            setEditing(project);
                            setModalOpen(true);
                            setMenuOpenId(null);
                          }}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
                        >
                          <Pencil size={14} /> Edit
                        </button>
                        <button
                          onClick={() => {
                            setDeleteTarget(project);
                            setMenuOpenId(null);
                          }}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Link to={`/projects/${project._id}`}>
                <p className="text-sm text-gray-500 mt-1.5 line-clamp-2 min-h-[2.5rem]">
                  {project.description || 'No description provided.'}
                </p>

                <div className="mt-3">
                  <StatusBadge status={project.status} />
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                    <span>Progress</span>
                    <span>{project.taskStats?.progress || 0}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full transition-all"
                      style={{ width: `${project.taskStats?.progress || 0}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Calendar size={13} />
                    {formatDate(project.deadline)}
                  </div>
                  <div className="flex -space-x-2">
                    {project.members?.slice(0, 3).map((m) => (
                      <Avatar key={m._id} name={m.name} src={m.avatar} size="sm" />
                    ))}
                    {project.members?.length > 3 && (
                      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] text-gray-500 font-medium border-2 border-white">
                        +{project.members.length - 3}
                      </div>
                    )}
                    {project.members?.length === 0 && (
                      <UsersIcon size={14} className="text-gray-300" />
                    )}
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}

      <ProjectFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreateOrUpdate}
        initialData={editing}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        description={`This will permanently delete "${deleteTarget?.name}" and all of its tasks. This action cannot be undone.`}
      />
    </div>
  );
};

export default Projects;

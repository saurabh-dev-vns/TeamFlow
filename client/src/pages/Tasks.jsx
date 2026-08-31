import React, { useEffect, useState } from 'react';
import { Search, CheckSquare } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import TaskCard from '../components/TaskCard';
import EmptyState from '../components/EmptyState';
import { SkeletonCard } from '../components/Skeleton';

const Tasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [sort, setSort] = useState('newest');
  const [assignedToMe, setAssignedToMe] = useState(true);

  useEffect(() => {
    api.get('/projects').then(({ data }) => setProjects(data));
  }, []);

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      try {
        const params = {};
        if (search) params.search = search;
        if (status) params.status = status;
        if (priority) params.priority = priority;
        if (projectFilter) params.project = projectFilter;
        if (sort) params.sort = sort;
        if (assignedToMe) params.assignedTo = user._id;

        const { data } = await api.get('/tasks', { params });
        setTasks(data);
      } finally {
        setLoading(false);
      }
    };
    const debounce = setTimeout(fetchTasks, 250);
    return () => clearTimeout(debounce);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status, priority, projectFilter, sort, assignedToMe]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Tasks</h1>
        <p className="text-sm text-gray-500 mt-0.5">Search, filter, and track task progress</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks by title..."
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
            <option value="">All Status</option>
            <option value="Todo">Todo</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
            <option value="">All Priority</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
          <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="dueDate">Due date</option>
            <option value="priority">Priority</option>
          </select>
          <button
            onClick={() => setAssignedToMe((v) => !v)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
              assignedToMe ? 'bg-primary-50 text-primary-700 border border-primary-200' : 'bg-white text-gray-500 border border-gray-200'
            }`}
          >
            {assignedToMe ? 'My tasks only' : 'All tasks'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState icon={CheckSquare} title="No tasks found" description="Try adjusting your filters or search term." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <TaskCard key={task._id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Tasks;

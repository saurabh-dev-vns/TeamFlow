import React, { useEffect, useState } from 'react';
import {
  FolderKanban,
  CheckSquare,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from 'recharts';
import api from '../services/api';
import { SkeletonCard } from '../components/Skeleton';

const STATUS_COLORS = ['#94a3b8', '#3b82f6', '#22c55e'];
const PRIORITY_COLORS = ['#94a3b8', '#f59e0b', '#ef4444'];

const StatCard = ({ icon: Icon, label, value, tint }) => (
  <div className="bg-white rounded-xl border border-gray-100 p-5">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
      </div>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tint}`}>
        <Icon size={18} />
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/dashboard');
        setData(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  const { stats, charts } = data;

  const statCards = [
    { icon: FolderKanban, label: 'Total Projects', value: stats.totalProjects, tint: 'bg-primary-50 text-primary-600' },
    { icon: CheckSquare, label: 'Total Tasks', value: stats.totalTasks, tint: 'bg-blue-50 text-blue-600' },
    { icon: CheckCircle2, label: 'Completed', value: stats.completedTasks, tint: 'bg-green-50 text-green-600' },
    { icon: Clock, label: 'Pending', value: stats.pendingTasks, tint: 'bg-amber-50 text-amber-600' },
    { icon: AlertTriangle, label: 'Overdue', value: stats.overdueTasks, tint: 'bg-red-50 text-red-600' },
    { icon: Users, label: 'Team Members', value: stats.teamMembers, tint: 'bg-violet-50 text-violet-600' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Overview of your projects and tasks</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Tasks by Status</h3>
          {stats.totalTasks === 0 ? (
            <p className="text-sm text-gray-400 py-10 text-center">No tasks yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={charts.tasksByStatus}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {charts.tasksByStatus.map((entry, index) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Tasks by Priority</h3>
          {stats.totalTasks === 0 ? (
            <p className="text-sm text-gray-400 py-10 text-center">No tasks yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={charts.tasksByPriority}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {charts.tasksByPriority.map((entry, index) => (
                    <Cell key={entry.name} fill={PRIORITY_COLORS[index % PRIORITY_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Project Progress</h3>
          {charts.projectProgress.length === 0 ? (
            <p className="text-sm text-gray-400 py-10 text-center">No projects yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(200, charts.projectProgress.length * 50)}>
              <BarChart data={charts.projectProgress} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" width={160} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f8fafc' }} formatter={(v) => `${v}%`} />
                <Bar dataKey="progress" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

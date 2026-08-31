import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  User,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import NotificationBell from '../components/NotificationBell';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/tasks', label: 'My Tasks', icon: CheckSquare },
  { to: '/profile', label: 'Profile', icon: User },
];

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <>
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white font-bold text-sm">
          TF
        </div>
        <span className="font-bold text-lg text-gray-800">TeamFlow</span>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pb-4">
        <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-gray-50">
          <Avatar name={user?.name} src={user?.avatar} />
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full mt-2 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 transition"
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 flex-col bg-white border-r border-gray-100">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="w-64 bg-white flex flex-col h-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <SidebarContent />
          </div>
          <div className="flex-1 bg-black/30" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-gray-100 bg-white">
          <button
            className="md:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={20} />
          </button>
          <div className="hidden md:block" />
          <NotificationBell />
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

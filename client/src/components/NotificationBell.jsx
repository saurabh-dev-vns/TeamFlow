import React, { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { formatRelativeTime } from '../utils/formatDate';

const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition"
      >
        <Bell size={19} className="text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white border border-gray-100 rounded-xl shadow-xl z-40">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="font-semibold text-sm text-gray-800">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                <CheckCheck size={13} /> Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-400">No notifications yet</div>
          ) : (
            notifications.map((n) => (
              <button
                key={n._id}
                onClick={() => markAsRead(n._id)}
                className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition flex gap-2 ${
                  !n.isRead ? 'bg-primary-50/50' : ''
                }`}
              >
                {!n.isRead && <span className="w-1.5 h-1.5 mt-1.5 rounded-full bg-primary-500 flex-shrink-0" />}
                <div className={!n.isRead ? '' : 'ml-3.5'}>
                  <p className="text-sm text-gray-700">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatRelativeTime(n.createdAt)}</p>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;

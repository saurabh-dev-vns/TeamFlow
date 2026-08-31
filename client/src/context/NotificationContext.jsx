import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';
import { getSocket } from '../services/socket';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (err) {
      // silently ignore - notification bell will just stay empty
    }
  };

  useEffect(() => {
    if (user) fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Listen for real-time notifications pushed from the server via Socket.IO
  useEffect(() => {
    if (!user) return;
    const socket = getSocket();
    if (!socket) return;

    const handleNew = (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    socket.on('notification:new', handleNew);
    return () => socket.off('notification:new', handleNew);
  }, [user]);

  const markAsRead = async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await api.patch(`/notifications/${id}/read`);
    } catch (err) {
      // ignore, UI already optimistic
    }
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await api.patch('/notifications/read-all');
    } catch (err) {
      // ignore
    }
  };

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};

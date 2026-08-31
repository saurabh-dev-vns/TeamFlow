import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On first load, if a token exists, verify it and restore the session.
  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('teamflow_token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get('/auth/me');
        setUser(data.user);
        connectSocket(token);
      } catch (err) {
        localStorage.removeItem('teamflow_token');
        localStorage.removeItem('teamflow_user');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('teamflow_token', data.token);
    localStorage.setItem('teamflow_user', JSON.stringify(data.user));
    setUser(data.user);
    connectSocket(data.token);
    return data.user;
  };

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    localStorage.setItem('teamflow_token', data.token);
    localStorage.setItem('teamflow_user', JSON.stringify(data.user));
    setUser(data.user);
    connectSocket(data.token);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('teamflow_token');
    localStorage.removeItem('teamflow_user');
    setUser(null);
    disconnectSocket();
  };

  const updateUser = (partial) => {
    setUser((prev) => {
      const updated = { ...prev, ...partial };
      localStorage.setItem('teamflow_user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

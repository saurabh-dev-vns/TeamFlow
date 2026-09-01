import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On first load, ask the server whether we have a valid session (the JWT
  // lives in an httpOnly cookie, so client JS can't inspect it directly —
  // we just try the request and see what comes back).
  useEffect(() => {
    const init = async () => {
      try {
        const { data } = await api.get('/auth/me');
        setUser(data.user);
        localStorage.setItem('teamflow_user', JSON.stringify(data.user));
        connectSocket();
      } catch (err) {
        localStorage.removeItem('teamflow_user');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('teamflow_user', JSON.stringify(data.user));
    setUser(data.user);
    connectSocket();
    return data.user;
  };

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    localStorage.setItem('teamflow_user', JSON.stringify(data.user));
    setUser(data.user);
    connectSocket();
    return data.user;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('teamflow_user');
      setUser(null);
      disconnectSocket();
    }
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

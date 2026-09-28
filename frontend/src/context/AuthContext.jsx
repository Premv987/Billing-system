import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axiosClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState({
    id: 'admin-1',
    name: 'Mr. Patel (Owner / Admin)',
    email: 'admin@patelrmart.com',
    role: 'ADMIN'
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || 'patel-admin-session');

  useEffect(() => {
    // Acquire background backend token silently
    api.post('/auth/login', { email: 'admin@patelrmart.com', password: 'admin123' })
      .then(res => {
        if (res.data?.token) {
          setToken(res.data.token);
          setUser(res.data.user);
          localStorage.setItem('token', res.data.token);
          localStorage.setItem('user', JSON.stringify(res.data.user));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isAdmin: true }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

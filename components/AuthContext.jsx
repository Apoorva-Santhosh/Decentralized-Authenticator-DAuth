import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { api, authenticate, post } from '../utils/authApi.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const operation = useRef(0);

  const refresh = async () => {
    const version = ++operation.current;
    try {
      const result = await api('/api/auth/session');
      if (version === operation.current) setSession(result);
    } catch {
      if (version === operation.current) setSession(null);
    } finally {
      if (version === operation.current) setLoading(false);
    }
  };
  const logout = async () => {
    const version = ++operation.current;
    await post('/api/auth/logout');
    if (version === operation.current) setSession(null);
  };
  const login = async (account, password) => {
    const version = ++operation.current;
    const result = await authenticate('login', account, password);
    if (version === operation.current) { setSession(result); setLoading(false); }
  };

  useEffect(() => { refresh(); return () => { operation.current++; }; }, []);
  useEffect(() => {
    const wallet = window.ethereum;
    if (!wallet || !session) return;
    const reset = () => {
      operation.current++;
      setSession(null);
      post('/api/auth/logout').catch(() => {});
    };
    const accountsChanged = (accounts) => {
      if (accounts[0]?.toLowerCase() !== session.address) reset();
    };
    wallet.on('accountsChanged', accountsChanged);
    wallet.on('chainChanged', reset);
    wallet.on('disconnect', reset);
    return () => {
      wallet.removeListener('accountsChanged', accountsChanged);
      wallet.removeListener('chainChanged', reset);
      wallet.removeListener('disconnect', reset);
    };
  }, [session]);

  return <AuthContext.Provider value={{ session, loading, login, logout, refresh }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

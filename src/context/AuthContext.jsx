import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    api.auth
      .me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setReady(true));
  }, []);

  const login = useCallback(async (data) => {
    const u = await api.auth.login(data);
    setUser(u);
    return u;
  }, []);
  const register = useCallback(async (data) => {
    const u = await api.auth.register(data);
    setUser(u);
    return u;
  }, []);
  const logout = useCallback(() => {
    api.auth.logout();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, ready, login, register, logout }), [user, ready, login, register, logout]);
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);

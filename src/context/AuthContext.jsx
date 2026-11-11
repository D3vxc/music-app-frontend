import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import api from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // Bumped on every login/register/logout so a slow initial /auth/me can't overwrite it.
  const version = useRef(0);

  const setAccount = useCallback((account) => {
    version.current += 1;
    setUser(account);
    setLoading(false);
  }, []);

  useEffect(() => {
    const started = version.current;
    api
      .get("/auth/me")
      .then((res) => version.current === started && setUser(res.data))
      .catch(() => version.current === started && setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(
    async (credentials) => {
      const res = await api.post("/auth/login", credentials);
      setAccount(res.data);
      return res.data;
    },
    [setAccount],
  );

  const register = useCallback(
    async (data, asArtist) => {
      const res = await api.post(asArtist ? "/auth/register/artist" : "/auth/register", data);
      setAccount(res.data);
      return res.data;
    },
    [setAccount],
  );

  const logout = useCallback(async () => {
    await api.post("/auth/logout").catch(() => {});
    setAccount(null);
  }, [setAccount]);

  const value = { user, setUser, loading, login, register, logout, isArtist: user?.role === "artist" };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

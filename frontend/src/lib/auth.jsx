import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";

const AuthContext = createContext(null);
const TOKEN_KEY = "bitverse_admin_token";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Attach Authorization header globally when we have a token
  useEffect(() => {
    if (token) {
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common.Authorization;
    }
  }, [token]);

  // On mount + when token changes, verify
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get("/auth/me");
        if (!cancelled) setUser(data);
      } catch {
        if (!cancelled) {
          localStorage.removeItem(TOKEN_KEY);
          setToken("");
          setUser(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken("");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

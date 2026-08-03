import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getAccessToken, setAccessToken, ApiError } from "../services/api";
import * as authApi from "../services/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        if (!getAccessToken()) {
          // No access token in this tab yet — try the httpOnly refresh
          // cookie in case there's a valid session from a previous visit.
          const { API_URL } = await import("../services/api");
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 15_000);
          const res = await fetch(`${API_URL}/auth/refresh`, {
            method: "POST",
            credentials: "include",
            signal: controller.signal,
          }).finally(() => clearTimeout(timeout));
          if (res.ok) {
            const body = await res.json();
            setAccessToken(body.data.accessToken);
          }
        }
        if (getAccessToken()) {
          const me = await authApi.me();
          if (!cancelled) setUser(me);
        }
      } catch (err) {
        if (!(err instanceof ApiError && err.status === 401)) {
          console.error("Session check failed — continuing as logged out:", err);
        }
        setAccessToken(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const loggedInUser = await authApi.login(email, password);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const register = useCallback(async (payload) => {
    const newUser = await authApi.register(payload);
    setUser(newUser);
    return newUser;
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { apiFetch } from "@/lib/api";

export interface User {
  id: string;
  username: string;
  email: string | null;
  role: "ADMIN" | "USER";
  isActive: boolean;
  language: "DE" | "EN" | "FA";
  readMode: string;
  darkMode: boolean;
  deviceLockMode: string;
  createdAt: string;
  lastLoginAt: string | null;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

// Generate or retrieve device fingerprint
function getDeviceId(): string {
  let id = localStorage.getItem("hx_device_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("hx_device_id", id);
  }
  return id;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refetchUser = useCallback(async () => {
    try {
      const me = await apiFetch<User>("/auth/me");
      setUser(me);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refetchUser().finally(() => setLoading(false));
  }, [refetchUser]);

  const login = useCallback(async (username: string, password: string, rememberMe = false) => {
    const deviceId = getDeviceId();
    const data = await apiFetch<{ user: User; accessToken: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password, rememberMe, deviceId }),
    });
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    await apiFetch("/auth/logout", { method: "POST" }).catch(() => {});
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

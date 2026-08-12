import { useState, createContext, useContext } from "react";

interface AuthContextValue {
  token: string | null;
  user: { id: string; email: string; name: string; role: string } | null;
  setAuth: (token: string, user: any) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function isTokenValid(token: string | null): boolean {
  if (!token) return false;
  try {
    const payload = token.split(".")[1];
    if (!payload) return false;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const decoded = JSON.parse(atob(padded));
    if (typeof decoded.exp !== "number") return false;
    return decoded.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    const stored = localStorage.getItem("token");
    if (stored && !isTokenValid(stored)) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return null;
    }
    return stored;
  });
  const [user, setUser] = useState<any>(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });

  const setAuth = (token: string, user: any) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setToken(token);
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, setAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

import { createContext, ReactNode, useContext, useMemo, useState } from "react";
import { Role } from "../api/client";
import { authApi } from "../api/resources";

type AuthContextValue = {
  token: string | null;
  role: Role | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // DEMO BYPASS: Always signed in as fleet manager
  const [token, setToken] = useState<string | null>("demo-bypass-token");
  const [role, setRole] = useState<Role | null>("fleet_manager");

  const value = useMemo<AuthContextValue>(() => ({
    token,
    role,
    login: async (email, password) => {
      const { data } = await authApi.login(email, password);
      localStorage.setItem("transitops_token", data.access_token);
      localStorage.setItem("transitops_role", data.role);
      setToken(data.access_token);
      setRole(data.role);
    },
    logout: () => {
      localStorage.removeItem("transitops_token");
      localStorage.removeItem("transitops_role");
      setToken(null);
      setRole(null);
    }
  }), [token, role]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}

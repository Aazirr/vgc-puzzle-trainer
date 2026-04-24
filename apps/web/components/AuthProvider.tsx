"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  getSessionUser,
  loginUser as apiLogin,
  registerUser as apiRegister,
  logoutUser as apiLogout,
  getAuthProviderStatus,
  type AuthUser,
  type AuthInput,
  type AuthResult,
} from "@/lib/auth-client";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  backendConfigured: boolean;
  apiBase: string | null;
  login: (input: AuthInput) => Promise<AuthResult>;
  register: (input: AuthInput) => Promise<AuthResult>;
  logout: () => void;
  refresh: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [backendConfigured, setBackendConfigured] = useState(false);
  const [apiBase, setApiBase] = useState<string | null>(null);

  const refresh = useCallback(() => {
    const current = getSessionUser();
    setUser(current);
    const status = getAuthProviderStatus();
    setBackendConfigured(status.backendConfigured);
    setApiBase(status.apiBase);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(
    async (input: AuthInput): Promise<AuthResult> => {
      const result = await apiLogin(input);
      if (result.ok) {
        setUser(result.user);
        const status = getAuthProviderStatus();
        setBackendConfigured(status.backendConfigured);
        setApiBase(status.apiBase);
      }
      return result;
    },
    []
  );

  const register = useCallback(
    async (input: AuthInput): Promise<AuthResult> => {
      const result = await apiRegister(input);
      if (result.ok) {
        setUser(result.user);
        const status = getAuthProviderStatus();
        setBackendConfigured(status.backendConfigured);
        setApiBase(status.apiBase);
      }
      return result;
    },
    []
  );

  const logout = useCallback(() => {
    apiLogout();
    setUser(null);
  }, []);

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: !!user,
    backendConfigured,
    apiBase,
    login,
    register,
    logout,
    refresh,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}


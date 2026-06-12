"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import { apiRequest } from "@/lib/api";
import { authStorage } from "@/lib/auth-storage";
import type { AuthUser, LoginResponseData } from "@/lib/types";

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (
    payload: { email: string; password: string },
    redirectTo?: string | null,
  ) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getServerSnapshot() {
  return null;
}

function parseUser(rawUser: string | null): AuthUser | null {
  if (!rawUser) return null;

  try {
    return JSON.parse(rawUser) as AuthUser;
  } catch {
    return null;
  }
}

function subscribeToHydration(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const timer = window.setTimeout(callback, 0);

  return () => {
    window.clearTimeout(timer);
  };
}

function getHydratedClientSnapshot() {
  return true;
}

function getHydratedServerSnapshot() {
  return false;
}

function getSafeRedirectPath(redirectTo?: string | null) {
  if (!redirectTo) return "/dashboard";

  if (!redirectTo.startsWith("/")) return "/dashboard";

  if (redirectTo.startsWith("//")) return "/dashboard";

  if (redirectTo.startsWith("/login")) return "/dashboard";

  return redirectTo;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  const hasHydrated = useSyncExternalStore(
    subscribeToHydration,
    getHydratedClientSnapshot,
    getHydratedServerSnapshot,
  );

  const token = useSyncExternalStore(
    authStorage.subscribe,
    authStorage.getToken,
    getServerSnapshot,
  );

  const rawUser = useSyncExternalStore(
    authStorage.subscribe,
    authStorage.getUserRaw,
    getServerSnapshot,
  );

  const user = useMemo(() => parseUser(rawUser), [rawUser]);

  const login = useCallback(
    async (
      payload: { email: string; password: string },
      redirectTo?: string | null,
    ) => {
      const response = await apiRequest<LoginResponseData>("/auth/login", {
        method: "POST",
        body: payload,
        token: null,
      });

      if (!response.data?.token || !response.data.user) {
        throw new Error("Login response is missing token or user.");
      }

      authStorage.setToken(response.data.token);
      authStorage.setUser(response.data.user);

      router.replace(getSafeRedirectPath(redirectTo));
    },
    [router],
  );

  const logout = useCallback(() => {
    authStorage.clear();
    router.replace("/login");
  }, [router]);

  const value = useMemo(
    () => ({
      user,
      token,
      isLoading: !hasHydrated,
      isAuthenticated: hasHydrated && Boolean(token && user),
      login,
      logout,
    }),
    [user, token, hasHydrated, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}

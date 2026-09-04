"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import AuthModal from "@/components/AuthModal";
import {
  AuthTokens,
  AuthUser,
  clearTokens,
  fetchCurrentUser,
  loadTokens,
  refreshTokens,
  revokeSession,
  saveTokens,
} from "@/lib/auth-client";

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  /** `false` until the stored session (if any) has been checked, to avoid a login flash. */
  isReady: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  logout: () => void;
  /**
   * Fetch with the current access token attached, transparently refreshed
   * once on a 401. Throws if there's no session — callers must check
   * `isAuthenticated` first.
   */
  authFetch: (input: string, init?: RequestInit) => Promise<Response>;
  /** Re-fetches the current user (e.g. after a purchase credits their account). No-op if signed out. */
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // On mount, resume a previous session: try the stored access token, fall back
  // to a single refresh attempt, and drop everything if both fail.
  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const stored = loadTokens();
      if (!stored) {
        setIsReady(true);
        return;
      }

      let active = stored;
      let profile = await fetchCurrentUser(active.accessToken);

      if (!profile) {
        const refreshed = await refreshTokens(active.refreshToken);
        if (refreshed) {
          active = refreshed;
          profile = await fetchCurrentUser(active.accessToken);
        }
      }

      if (cancelled) return;

      if (profile) {
        saveTokens(active);
        setTokens(active);
        setUser(profile);
      } else {
        clearTokens();
      }
      setIsReady(true);
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  // Doesn't close the modal itself — a registration keeps it open to show a
  // success screen, so AuthModal decides when to close via `closeAuthModal`.
  const handleAuthenticated = useCallback(async (nextTokens: AuthTokens) => {
    saveTokens(nextTokens);
    setTokens(nextTokens);
    setUser(await fetchCurrentUser(nextTokens.accessToken));
  }, []);

  const logout = useCallback(() => {
    if (tokens) void revokeSession(tokens.accessToken);
    clearTokens();
    setTokens(null);
    setUser(null);
  }, [tokens]);

  const authFetch = useCallback(
    async (input: string, init: RequestInit = {}) => {
      if (!tokens) throw new Error("authFetch called without a session");

      const withAuth = (accessToken: string): RequestInit => ({
        ...init,
        headers: { ...init.headers, Authorization: `Bearer ${accessToken}` },
      });

      let response = await fetch(input, withAuth(tokens.accessToken));
      if (response.status !== 401) return response;

      const refreshed = await refreshTokens(tokens.refreshToken);
      if (!refreshed) {
        logout();
        return response;
      }
      saveTokens(refreshed);
      setTokens(refreshed);
      response = await fetch(input, withAuth(refreshed.accessToken));
      return response;
    },
    [tokens, logout],
  );

  const refreshUser = useCallback(async () => {
    if (!tokens) return;
    const profile = await fetchCurrentUser(tokens.accessToken);
    if (profile) setUser(profile);
  }, [tokens]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isReady,
      openAuthModal: () => setIsModalOpen(true),
      closeAuthModal: () => setIsModalOpen(false),
      logout,
      authFetch,
      refreshUser,
    }),
    [user, isReady, logout, authFetch, refreshUser],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <AuthModal onAuthenticated={handleAuthenticated} onClose={() => setIsModalOpen(false)} open={isModalOpen} />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside an AuthProvider");
  return value;
}

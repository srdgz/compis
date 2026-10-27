import { useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { clearSession, getSession, onUnauthorized, saveSession } from "@/shared/api/session";
import type { Session } from "@/shared/api/session";

import { authApi } from "./api";

interface AuthContextValue {
  session: Session | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(() => getSession());

  useEffect(
    () =>
      onUnauthorized(() => {
        setSession(null);
        queryClient.clear();
      }),
    [queryClient],
  );

  const signIn = useCallback(async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    const next = { token: response.token, roomieId: response.roomie_id };
    saveSession(next);
    setSession(next);
  }, []);

  const signOut = useCallback(() => {
    clearSession();
    setSession(null);
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo(() => ({ session, signIn, signOut }), [session, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}

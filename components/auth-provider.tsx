"use client";

import { authClient } from "@/lib/auth-client";
import { Session } from "better-auth";
import { createContext, useContext, ReactNode } from "react";

interface AuthContextType {
  session: Session | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const sessionQuery = authClient.useSession();
  const session = (sessionQuery.data as Session | null) ?? null;
  const isLoading = Boolean(
    (sessionQuery as { isPending?: boolean }).isPending ??
      (sessionQuery as { isLoading?: boolean }).isLoading
  );

  return (
    <AuthContext.Provider value={{ session, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
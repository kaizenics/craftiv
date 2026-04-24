"use client";

import { authClient } from "@/lib/auth-client";
import { Session } from "better-auth";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface AuthContextType {
  session: Session | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data } = await authClient.getSession();
        setSession(data?.session || null);
      } catch (error) {
        console.error("Failed to get session:", error);
        setSession(null);
      } finally {
        setIsLoading(false);
      }
    };

    getSession();
  }, []);

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
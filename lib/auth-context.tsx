"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { createAuthSession, getAuthSession, destroyAuthSession } from "@/app/actions/auth";

interface AuthContextType {
  userId: Id<"users"> | null;
  userEmail: string | null;
  isLoading: boolean;
  login: (userId: Id<"users">, email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mutation to sync the timezone
  const syncTimezone = useMutation(api.users.syncTimezone);

  useEffect(() => {
    // Check for existing session via HTTP-Only Cookie
    const initAuth = async () => {
      try {
        const session = await getAuthSession();

        if (session && session.userId && session.email) {
          setUserId(session.userId as Id<"users">);
          setUserEmail(session.email);

          // Sync timezone when user loads
          const clientTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          syncTimezone({ id: session.userId as Id<"users">, timezone: clientTimezone }).catch(console.error);
        }
      } catch (error) {
        console.error("Failed to load secure session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [syncTimezone]);

  const login = async (newUserId: Id<"users">, email: string) => {
    // 1. Set React State immediately for snappy UI
    setUserId(newUserId);
    setUserEmail(email);

    // 2. Set Secure Server Cookie
    await createAuthSession(newUserId, email);

    // 3. Sync timezone on fresh login
    try {
      const clientTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      syncTimezone({ id: newUserId, timezone: clientTimezone }).catch(console.error);
    } catch (error) {
      console.error("Failed to sync timezone:", error);
    }
  };

  const logout = async () => {
    // 1. Clear React State
    setUserId(null);
    setUserEmail(null);

    // 2. Destroy Secure Cookie
    await destroyAuthSession();

    // 3. Force Hard Redirect to Home 
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{ userId, userEmail, isLoading, login, logout }}>
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
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Id } from "@/convex/_generated/dataModel";

interface AuthContextType {
  userId: Id<"users"> | null;
  userEmail: string | null;
  isLoading: boolean;
  login: (userId: Id<"users">, email: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const storedUserId = localStorage.getItem("goalforge_user_id");
    const storedEmail = localStorage.getItem("goalforge_user_email");
    
    if (storedUserId && storedEmail) {
      setUserId(storedUserId as Id<"users">);
      setUserEmail(storedEmail);
    }
    setIsLoading(false);
  }, []);

  const login = (newUserId: Id<"users">, email: string) => {
    setUserId(newUserId);
    setUserEmail(email);
    localStorage.setItem("goalforge_user_id", newUserId);
    localStorage.setItem("goalforge_user_email", email);
  };

  const logout = () => {
    setUserId(null);
    setUserEmail(null);
    localStorage.removeItem("goalforge_user_id");
    localStorage.removeItem("goalforge_user_email");
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

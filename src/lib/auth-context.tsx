"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import type { User } from "./types";
import { getStoredUser, setStoredUser, verifyCurrentSession } from "./auth";
import { useRouter, usePathname } from "next/navigation";

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function initAuth() {
      try {
        const activeUser = await verifyCurrentSession();
        setUser(activeUser);
      } catch {
        setUser(getStoredUser());
      } finally {
        setLoading(false);
      }
    }
    initAuth();
  }, []);

  useEffect(() => {
    if (!loading) {
      if (!user && pathname !== "/login") {
        router.push("/login");
      } else if (user && pathname === "/login") {
        router.push("/feed");
      }
    }
  }, [user, loading, pathname, router]);

  const login = (newUser: User) => {
    setUser(newUser);
    setStoredUser(newUser);
    router.push("/feed");
  };

  const logout = () => {
    setUser(null);
    setStoredUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading ? children : (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-center space-y-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full blur-xl opacity-30 animate-pulse" />
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin relative" />
          </div>
          <p className="text-slate-400 text-sm">Authenticating session...</p>
        </div>
      )}
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

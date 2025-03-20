"use client";

import { type ReactNode, createContext, useContext } from "react";

import type { Account } from "@/lib/db/types";

export interface AuthProviderProps {
  account?: Account | null; 
  bearerToken?: string | null;
}

const AuthContext = createContext<AuthProviderProps>({
  account: null,
  bearerToken: null,
});

export const useAuth = () => {
  return useContext(AuthContext);
};

export interface AuthProviderComponentProps extends AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({
  children,
  account,
  bearerToken,
}: AuthProviderComponentProps) {
  return (  
    <AuthContext.Provider value={{ account, bearerToken }}>
      {children}
    </AuthContext.Provider>
  );
}

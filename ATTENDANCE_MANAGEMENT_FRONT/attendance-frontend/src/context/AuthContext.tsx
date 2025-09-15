import React, { createContext, useContext, useEffect, useState } from "react";
import { User, getUser, logout } from "../lib/api";

interface AuthState {
  user: User | null;
  setUser: (u: User | null) => void;
}
const AuthCtx = createContext<AuthState>({ user: null, setUser: () => {} });
export const useAuth = () => useContext(AuthCtx);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(getUser());

  useEffect(() => {
    // if token missing while user present, clean up
    if (user && !localStorage.getItem("access")) {
      logout();
    }
  }, [user]);

  return (
    <AuthCtx.Provider value={{ user, setUser }}>{children}</AuthCtx.Provider>
  );
};

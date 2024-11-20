"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { createJWTToken, getUserFromJWT, getUserRole } from "@/lib/backend";

interface User {
  id: string | null;
  name: string;
  phone: string;
}

export enum Permission {
  HOST = "host",
  CONSUMER = "consumer",
  UNAUTHORIZED = "unauthorized",
}

export enum AuthStatus {
  CHECKING = "checking", // Initial state when verifying JWT
  AUTHORIZED = "authorized", // Valid JWT and user authenticated
  UNAUTHORIZED = "unauthorized", // Invalid JWT
  NO_TOKEN = "no_token", // No JWT found in storage
}

interface GlobalContextType {
  user: User | null;
  status: AuthStatus;
  login: (userData: User) => void;
  logout: () => void;
  getPermission: (receiptId: string) => Promise<Permission>;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export const useGlobalContext = () => {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error("useGlobalContext must be used within a GlobalProvider");
  }
  return context;
};

export const GlobalProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>(AuthStatus.CHECKING);

  useEffect(() => {
    const jwt = localStorage.getItem("jwt");
    if (jwt) {
      console.log(jwt);
      getUserFromJWT()
        .then((data) => {
          setUser({ id: data.id, name: data.name, phone: data.phone });
          console.log("User found:", data);
          setStatus(AuthStatus.AUTHORIZED);
        })
        .catch(() => {
          setStatus(AuthStatus.UNAUTHORIZED);
          localStorage.removeItem("jwt");
        });
    } else {
      console.log("No token found");
      setStatus(AuthStatus.NO_TOKEN);
    }
  }, []);

  const getPermission = async (receiptId: string): Promise<Permission> => {
    try {
      const role = await getUserRole(receiptId);
      const permission = role.role;
      if (permission === "host") {
        return Permission.HOST;
      } else if (permission === "consumer") {
        return Permission.CONSUMER;
      } else {
        return Permission.UNAUTHORIZED;
      }
    } catch (error) {
      console.error("There was a problem retrieving permissions:", error);
      return Permission.UNAUTHORIZED;
    }
  };

  const login = async (userData: User) => {
    const resp = await createJWTToken(userData.name, userData.phone);
    localStorage.setItem("jwt", resp.token);
    setStatus(AuthStatus.AUTHORIZED);
  };

  const logout = () => {
    localStorage.removeItem("jwt");
    setStatus(AuthStatus.NO_TOKEN);
    setUser(null);
  };

  return (
    <GlobalContext.Provider
      value={{
        user,
        status,
        login,
        logout,
        getPermission,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

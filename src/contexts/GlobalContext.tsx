"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { backend } from "@/lib/backend";

interface User {
  id: string;
  name: string;
  phone: string;
}

export enum Permission {
  HOST = "host",
  CONSUMER = "consumer",
  UNAUTHORIZED = "unauthorized",
}

interface GlobalContextType {
  user: User | null;
  invalid_token: boolean;
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
  const [invalid_token, setInvalidToken] = useState(false);

  useEffect(() => {
    const jwt = localStorage.getItem("jwt");
    if (jwt) {
      console.log(jwt);
      backend("GET", "/token")
        .then((data) => {
          const user = data.data;
          setInvalidToken(false);
          setUser({ id: user.id, name: user.name, phone: user.phone });
          console.log(`User logged in: ${user.name}`);
        })
        .catch(() => {
          console.log("Invalid token");
          setInvalidToken(true);
          localStorage.removeItem("jwt");
        });
    } else {
      console.log("No token found");
      setInvalidToken(true);
    }
  }, []);

  const getPermission = async (receiptId: string): Promise<Permission> => {
    try {
      const resp = await backend("GET", `/receipt/${receiptId}/role`);
      const permission = resp.data.role;
      if (permission === "host") {
        return Permission.HOST;
      } else if (permission === "consumer") {
        return Permission.CONSUMER;
      } else {
        return Permission.UNAUTHORIZED;
      }
    } catch (error) {
      console.error("There was a problem!", error);
      return Permission.UNAUTHORIZED;
    }
  };

  const login = async (userData: User) => {
    const resp = await backend("POST", "/token", userData);
    localStorage.setItem("jwt", resp.token);
  };

  const logout = () => {
    localStorage.removeItem("jwt");
    setUser(null);
  };

  return (
    <GlobalContext.Provider
      value={{
        user,
        invalid_token,
        login,
        logout,
        getPermission,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

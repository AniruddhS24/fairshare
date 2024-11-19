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
      getUserFromJWT()
        .then((data) => {
          setInvalidToken(false);
          setUser({ id: data.id, name: data.name, phone: data.phone });
          console.log(`User logged in: ${data.name}`);
        })
        .catch(() => {
          // TODO: Check error logic, not right
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
      console.error("There was a problem!", error);
      return Permission.UNAUTHORIZED;
    }
  };

  const login = async (userData: User) => {
    const resp = await createJWTToken(userData.name, userData.phone);
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

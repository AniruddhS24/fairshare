"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";

import {
  createJWTToken,
  getUserFromJWT,
  getUserRole,
  Receipt,
  Role,
} from "@/lib/backend";

interface User {
  id: string | null;
  name: string;
  phone: string;
  venmo_handle: string;
}

export enum Permission {
  HOST = "host",
  CONSUMER = "consumer",
  UNAUTHORIZED = "unauthorized",
}

export enum AuthStatus {
  CHECKING = "checking", // Initial state when verifying JWT
  AUTHORIZED = "authorized", // Valid JWT and user authenticated
  BAD_TOKEN = "bad_token", // Invalid JWT
  NO_TOKEN = "no_token", // No JWT found in storage
}

interface GlobalContextType {
  user: User | null;
  status: AuthStatus;
  login: (userData: User) => void;
  logout: () => void;
  getRole: (receiptId: string) => Promise<Role>;
  role: Role | null;
  setRole: React.Dispatch<React.SetStateAction<Role | null>>;
  receipt: Receipt | null;
  setReceipt: React.Dispatch<React.SetStateAction<Receipt | null>>;
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
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [role, setRole] = useState<Role | null>(null);

  const readJWT = () => {
    const jwt = localStorage.getItem("jwt");
    // console.log(jwt);
    if (jwt) {
      getUserFromJWT()
        .then((data) => {
          setUser({
            id: data.id,
            name: data.name,
            phone: data.phone,
            venmo_handle: data.venmo_handle,
          });
          setStatus(AuthStatus.AUTHORIZED);
        })
        .catch(() => {
          setStatus(AuthStatus.BAD_TOKEN);
          localStorage.removeItem("jwt");
        });
    } else {
      setUser(null);
      setStatus(AuthStatus.NO_TOKEN);
    }
  };

  useEffect(() => {
    readJWT();
  }, []);

  const getRole = async (receiptId: string): Promise<Role> => {
    if (role) return role;
    const _role = await getUserRole(receiptId);
    setRole(_role);
    return _role;
  };

  const login = async (userData: User) => {
    const resp = await createJWTToken(
      userData.name,
      userData.phone,
      userData.venmo_handle
    );
    localStorage.setItem("jwt", resp.token);
    readJWT();
  };

  const logout = () => {
    localStorage.removeItem("jwt");
    setStatus(AuthStatus.BAD_TOKEN);
  };

  return (
    <GlobalContext.Provider
      value={{
        user,
        status,
        login,
        logout,
        getRole,
        receipt,
        setReceipt,
        role,
        setRole,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

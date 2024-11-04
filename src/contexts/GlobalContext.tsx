"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";

interface User {
  name: string;
  phone: string;
}

interface GlobalContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
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
  const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const jwt = localStorage.getItem("jwt");
    if (jwt) {
      fetch(`${apiUrl}/token`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          const user = data.data;
          setUser({ name: user.name, phone: user.phone });
        })
        .catch((error) => {
          console.error("There was a problem!", error);
        });
    }
  }, []);

  const login = (userData: User) => {
    fetch(`${apiUrl}/token`, {
      method: "POST",
      body: JSON.stringify(userData),
    })
      .then((res) => res.json())
      .then((data) => {
        setUser(userData);
        localStorage.setItem("jwt", data["token"]);
      })
      .catch((error) => {
        console.error("There was a problem!", error);
      });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("jwt");
  };

  return (
    <GlobalContext.Provider value={{ user, login, logout }}>
      {children}
    </GlobalContext.Provider>
  );
};

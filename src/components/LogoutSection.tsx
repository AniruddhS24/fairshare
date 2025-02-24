"use client";

import React from "react";
import Text from "@/components/Text";
import { useGlobalContext } from "@/contexts/GlobalContext";

const LogoutSection: React.FC = () => {
  const { logout } = useGlobalContext();

  return (
    <div className="w-full flex justify-end items-center mb-3">
      {/* <Text type="body">{user?.name}</Text> */}
      <i
        className={`fa-solid fa-arrow-right-from-bracket text-primary fa-md`}
      ></i>
      <button
        onClick={() => {
          logout();
        }}
        className={`items-center justify-center ms-1 rounded-full`}
      >
        <Text type="body_bold" className="text-primary">
          Log out
        </Text>
      </button>
    </div>
  );
};

export default LogoutSection;

"use client";

import React from "react";
import Text from "@/components/Text";
import { useGlobalContext } from "@/contexts/GlobalContext";

const LogoutSection: React.FC = () => {
  const { logout, user } = useGlobalContext();

  return (
    <div className="w-full flex justify-end items-center">
      <Text type="body">{user?.name}</Text>
      <button
        onClick={() => {
          logout();
        }}
        className={`items-center justify-center ms-2 rounded-full`}
      >
        <Text type="body_bold" className="text-primary">
          Logout
        </Text>
      </button>
    </div>
  );
};

export default LogoutSection;

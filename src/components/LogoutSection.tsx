"use client";

import React from "react";
import Text from "@/components/Text";
import { useGlobalContext } from "@/contexts/GlobalContext";
import { useRouter } from "next/navigation";

const LogoutSection: React.FC = () => {
  const { logout } = useGlobalContext();
  const router = useRouter();

  return (
    <div className="w-full flex justify-end items-center mb-3">
      <div className="mr-4">
        <i className={`fa-solid fa-house text-primary fa-md`}></i>
        <button
          onClick={() => {
            router.push(`/upload`);
          }}
          className={`items-center justify-center ms-1 rounded-full`}
        >
          <Text type="body_bold" className="text-primary">
            Home
          </Text>
        </button>
      </div>
      <div>
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
    </div>
  );
};

export default LogoutSection;

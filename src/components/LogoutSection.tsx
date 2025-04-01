"use client";

import React from "react";
import Text from "@/components/Text";
import { useGlobalContext } from "@/contexts/GlobalContext";
import { useRouter } from "next/navigation";

interface LogoutSectionProps {
  onBack?: () => void;
}

const LogoutSection: React.FC<LogoutSectionProps> = ({ onBack }) => {
  const { logout } = useGlobalContext();
  const router = useRouter();

  return (
    <div className="w-full flex justify-between items-center mb-3">
      {onBack ? (
        <button
          onClick={onBack}
          className="flex items-center justify-center border p-2 rounded-full text-primary w-10 h-10"
        >
          <i className="fa-solid fa-arrow-left fa-xl"></i>
        </button>
      ) : (
        <div></div>
      )}
      <div className="flex items-center">
        <div className="mr-4 flex items-center">
          <i className="fa-solid fa-arrow-rotate-left text-primary fa-md"></i>
          <button
            onClick={() => router.push(`/upload`)}
            className="ms-1 rounded-full"
          >
            <Text type="body_bold" className="text-primary">
              New Receipt
            </Text>
          </button>
        </div>
        <div className="flex items-center">
          <i className="fa-solid fa-arrow-right-from-bracket text-primary fa-md"></i>
          <button onClick={() => logout()} className="ms-1 rounded-full">
            <Text type="body_bold" className="text-primary">
              Log out
            </Text>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutSection;

"use client";

import Image from "next/image";
import React from "react";
import Text from "@/components/Text";
import { useGlobalContext } from "@/contexts/GlobalContext";
import { useRouter } from "next/navigation";

interface HeaderProps {
  onBack?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onBack }) => {
  const { logout } = useGlobalContext();
  const router = useRouter();

  return (
    <div className="w-full flex justify-between items-center mb-4 px-4 pt-3 pb-3 border-b border-lightestgray">
      {onBack ? (
        <button
          onClick={onBack}
          className="flex items-center justify-center text-primary"
        >
          <i className="fa-solid fa-arrow-left fa-2xl"></i>
        </button>
      ) : (
        <div className="h-8 w-[auto]">
          <Image
            src="/applogo.png"
            alt="Logo"
            height={0}
            width={0}
            className="h-full w-auto"
            sizes="auto"
            priority
          />
        </div>
      )}
      <div className="flex items-center">
        <div className="flex items-center">
          <button
            onClick={() => {
              router.push(`/upload`);
            }}
            className="ms-1 rounded-full px-3 py-1 active:bg-gray-100"
          >
            <Text type="body_bold" className="text-primary">
              New Receipt
            </Text>
          </button>
        </div>
        <div className="flex items-center">
          <button
            onClick={() => logout()}
            className="ms-1 rounded-full bg-primary px-3 py-1 active:bg-primarydark"
          >
            <Text type="body_bold" className="text-white">
              Log out
            </Text>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Header;

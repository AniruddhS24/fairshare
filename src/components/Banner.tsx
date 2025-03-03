import React from "react";

export interface BannerProps {
  label: string;
  icon: string;
  type: "error" | "success";
}

export const Banner: React.FC<BannerProps> = ({ label, icon, type }) => {
  const color_map = {
    error: "text-error bg-red-200",
    success: "text-primary bg-accentlight",
  };
  return (
    <div
      className={`w-full flex justify-center items-center font-medium ${color_map[type]} rounded-md p-2 mb-2`}
    >
      <i className={`fas ${icon} mr-2`}></i>
      {label}
    </div>
  );
};

import React, { useEffect, useState } from "react";

export interface BannerProps {
  label: string;
  icon: string;
  type: "error" | "success";
  disappear?: boolean;
}

export const Banner: React.FC<BannerProps> = ({
  label,
  icon,
  type,
  disappear = true,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  const color_map = {
    error: "text-error bg-red-200",
    success: "text-primary bg-accentlight",
  };

  useEffect(() => {
    if (disappear) {
      const hideTimer = setTimeout(() => {
        setIsVisible(false);
      }, 3000);

      return () => {
        clearTimeout(hideTimer);
      };
    }
  }, [disappear]);

  return (
    isVisible && (
      <div
        className={`w-full flex justify-center items-center font-medium ${color_map[type]} rounded-md p-2 mb-2 `}
      >
        <i className={`fas ${icon} mr-2`}></i>
        {label}
      </div>
    )
  );
};

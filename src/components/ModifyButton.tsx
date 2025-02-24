import React from "react";
import Text from "./Text";

interface ModifyButtonProps {
  label: string;
  icon: string;
  onClick: () => void;
}

const ModifyButton: React.FC<ModifyButtonProps> = ({
  label,
  icon,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className={`transition-transform duration-200 active:scale-90`}
    >
      <div className="flex justify-center items-center">
        <i className={`fa-solid ${icon} text-primary fa-md me-1`}></i>
        <Text type="s_heading" className="text-primary">
          {label}
        </Text>
      </div>
    </button>
  );
};

export default ModifyButton;

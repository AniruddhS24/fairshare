import React from "react";
import Text from "./Text";
import Spinner from "./Spinner";

interface StickyButtonProps {
  label: string;
  onClick: () => void;
  icon?: string;
  sticky?: boolean;
  disabled?: boolean;
  onComplete?: () => void;
  secondary?: boolean;
  tertiary?: boolean;
}

const BUTTON_STYLES = {
  primary: "bg-primary text-white active:bg-primarydark",
  primary_disabled:
    "bg-primary text-white opacity-50 cursor-not-allowed pointer-events-none",
  secondary: "bg-accent text-white active:bg-accentdark",
  secondary_disabled:
    "bg-accent text-white opacity-50 cursor-not-allowed pointer-events-none",
  tertiary: "text-primary active:bg-gray-100",
  tertiary_disabled:
    "text-white opacity-50 cursor-not-allowed pointer-events-none",
};

const getButtonClass = ({
  secondary,
  tertiary,
  disabled,
}: {
  secondary: boolean;
  tertiary: boolean;
  disabled: boolean;
}) => {
  if (secondary)
    return disabled
      ? BUTTON_STYLES.secondary_disabled
      : BUTTON_STYLES.secondary;
  if (tertiary)
    return disabled ? BUTTON_STYLES.tertiary_disabled : BUTTON_STYLES.tertiary;
  return disabled ? BUTTON_STYLES.primary_disabled : BUTTON_STYLES.primary;
};

const StickyButton: React.FC<StickyButtonProps> = ({
  label,
  onClick,
  icon,
  sticky = false,
  disabled = false,
  secondary = false,
  tertiary = false,
}) => {
  const [loading, setLoading] = React.useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await onClick();
    } catch (error) {
      console.error("Error during onClick:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`w-full bg-white p-2 ${
        sticky ? "fixed bottom-0 left-0 z-10" : ""
      }`}
    >
      {loading ? (
        <button
          className={`w-full flex items-center justify-center ${getButtonClass({
            secondary,
            tertiary,
            disabled,
          })} p-2.5 rounded-full`}
        >
          <Spinner color="text-white" />
        </button>
      ) : (
        <button
          onClick={handleClick}
          className={`w-full flex items-center justify-center  
            ${getButtonClass({ secondary, tertiary, disabled })} 
            p-2.5 rounded-full transition-colors duration-150 ease-in-out`}
          disabled={disabled}
        >
          {icon == "venmo" ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              x="0px"
              y="0px"
              width="25"
              height="25"
              viewBox="0 0 50 50"
              style={{ marginRight: "8px" }}
            >
              <path
                fill="#ffffff"
                d="M41,4H9C6.243,4,4,6.243,4,9v32c0,2.757,2.243,5,5,5h32c2.757,0,5-2.243,5-5V9C46,6.243,43.757,4,41,4z M28,37H17l-3-22 l8-1.001L24,30c1.833-2.918,4-7.873,4-11c0-1.711-0.531-3.04-1-4l8-2c0.853,1.377,1,3.795,1,5.586C36,24.3,32.05,31.788,28,37z"
              ></path>
            </svg>
          ) : icon ? (
            <i className={`fas fa-regular ${icon} mr-2`}></i>
          ) : null}
          <Text type="s_heading">{label}</Text>
        </button>
      )}
    </div>
  );
};

export default StickyButton;

import React from "react";
import Text from "./Text";
import Spinner from "./Spinner";

interface StickyButtonProps {
  label: string;
  onClick: () => void;
  icon?: string;
  sticky?: boolean; // Prop to determine if the button should be sticky
  disabled?: boolean; // Prop to determine if the button should be disabled
  onComplete?: () => void; // Callback to set loading to false
}

const StickyButton: React.FC<StickyButtonProps> = ({
  label,
  onClick,
  icon,
  sticky = false,
  disabled = false,
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

  return loading ? (
    <button
      className={`w-full max-w-[300px] flex items-center justify-center bg-primary p-2.5 rounded-full transition-colors duration-150 ease-in-out active:bg-primarydark ${
        sticky
          ? "fixed bottom-4 left-1/2 transform -translate-x-1/2 z-10 max-w-[90%]"
          : ""
      }`}
    >
      <Spinner color="text-white" />
    </button>
  ) : (
    <button
      onClick={handleClick}
      className={`w-full flex items-center justify-center bg-primary p-2.5 rounded-full transition-colors duration-150 ease-in-out active:bg-primarydark ${
        sticky
          ? "fixed bottom-4 left-1/2 transform -translate-x-1/2 z-10 max-w-[90%]"
          : ""
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
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
        <i className={`fas fa-regular ${icon} mr-2 text-white`}></i>
      ) : null}
      <Text type="s_heading" className="text-white">
        {label}
      </Text>
    </button>
  );
};

export default StickyButton;

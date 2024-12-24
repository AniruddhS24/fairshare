import React from "react";
import Text from "./Text";
import Spinner from "./Spinner";

interface StickyButtonProps {
  label: string;
  onClick: () => void;
  sticky?: boolean; // Prop to determine if the button should be sticky
  disabled?: boolean; // Prop to determine if the button should be disabled
  onComplete?: () => void; // Callback to set loading to false
}

const StickyButton: React.FC<StickyButtonProps> = ({
  label,
  onClick,
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
      className={`w-full max-w-[300px] flex items-center justify-center bg-primary p-2.5 rounded-full transition-colors duration-150 ease-in-out active:bg-primarydark ${
        sticky
          ? "fixed bottom-4 left-1/2 transform -translate-x-1/2 z-10 max-w-[90%]"
          : ""
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      disabled={disabled}
    >
      <Text type="s_heading" className="text-white">
        {label}
      </Text>
    </button>
  );
};

export default StickyButton;

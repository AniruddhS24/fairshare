import Text from "./Text";

interface OptionButtonProps {
  label: string;
  onClick: () => void;
  iconSize?: string;
  icon?: string;
  className?: string;
}

const OptionButton: React.FC<OptionButtonProps> = ({
  label,
  onClick,
  iconSize,
  icon,
  className = "",
}) => {
  return (
    <button
      onClick={() => onClick()}
      className={`w-full flex items-center justify-center ${className}`}
    >
      {icon ? (
        <i className={`fas fa-regular ${iconSize} ${icon} mr-2`}></i>
      ) : null}
      <Text type="s_heading">{label}</Text>
    </button>
  );
};

export default OptionButton;

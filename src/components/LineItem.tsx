import React from "react";
import Text from "./Text";

interface LineItemProps {
  label: string;
  price: number;
  labelColor: string;
  bold?: boolean;
  className?: string;
}

const LineItem: React.FC<LineItemProps> = ({
  label,
  price,
  labelColor,
  bold,
  className,
}) => {
  return (
    <div className={`flex justify-between items-center w-full ${className}`}>
      {bold ? (
        <Text type="body_bold" className={labelColor}>
          {label}
        </Text>
      ) : (
        <Text type="body" className={labelColor}>
          {label}
        </Text>
      )}
      <Text type="body" className="text-midgray">
        ${price.toFixed(2)}
      </Text>
    </div>
  );
};

export default LineItem;

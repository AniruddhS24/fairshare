import React from "react";
import Text from "./Text";

interface LineItemProps {
  label: string;
  price: number;
  labelColor: string;
  bold?: boolean;
}

const LineItem: React.FC<LineItemProps> = ({
  label,
  price,
  labelColor,
  bold,
}) => {
  return (
    <div className="flex justify-between items-center w-full">
      {bold ? (
        <Text type="body_bold" className={labelColor}>
          {label}
        </Text>
      ) : (
        <Text type="body_semi" className={labelColor}>
          {label}
        </Text>
      )}
      <Text type="body_semi" className="text-midgray">
        ${price.toFixed(2)}
      </Text>
    </div>
  );
};

export default LineItem;

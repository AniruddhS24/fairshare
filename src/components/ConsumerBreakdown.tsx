import React, { useEffect } from "react";
import Text from "./Text";

interface ConsumerBreakdownProps {
  consumer: string;
  items: {
    name: string;
    quantity: number;
    split: number;
    price: number;
  }[];
  sharedCost: number;
  isHost?: boolean;
}

const ConsumerBreakdown: React.FC<ConsumerBreakdownProps> = ({
  consumer,
  items,
  sharedCost,
  isHost = false,
}) => {
  const calculateShare = (quantity, split, price) => {
    return (price * quantity) / split;
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center w-full">
        <div>
          <Text type="body_bold" className="text-darkest">
            {consumer}
          </Text>
          {isHost ? (
            <span className="ml-2 px-2 py-1 font-bold text-sm text-primary bg-accentlight rounded-md">
              Host
            </span>
          ) : null}
        </div>
        <Text type="body_bold" className="text-midgray">
          $
          {(
            parseFloat(sharedCost) +
            items.reduce(
              (acc, item) =>
                acc +
                calculateShare(
                  parseInt(item.quantity),
                  parseInt(item.split),
                  parseFloat(item.price)
                ),
              0
            )
          ).toFixed(2)}
        </Text>
      </div>
      {items.map((item, index) => (
        <div className="flex justify-between items-center w-full" key={index}>
          <Text className="text-darkest">
            {item.quantity} {item.name}
            {item.split > 1 ? ` / ${item.split}` : null}
          </Text>
          <Text className="text-midgray">
            {calculateShare(
              parseInt(item.quantity),
              parseInt(item.split),
              parseFloat(item.price)
            ).toFixed(2)}
          </Text>
        </div>
      ))}
      <div className="flex justify-between items-center w-full">
        <Text className="text-midgray">Shared Charges</Text>
        <Text className="text-midgray">{sharedCost.toFixed(2)}</Text>
      </div>
    </div>
  );
};

export default ConsumerBreakdown;

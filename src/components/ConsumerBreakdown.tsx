import React from "react";
import Text from "./Text";

interface ConsumerBreakdownProps {
  consumer_items: { [key: string]: { name: string; price: string } };
  user_name: string;
  sharedCharges: number;
  isHost: boolean;
  handleReminder: (name: string) => void;
}

const ConsumerBreakdown: React.FC<ConsumerBreakdownProps> = ({
  consumer_items,
  user_name,
  sharedCharges,
  isHost,
  handleReminder,
}) => {
  const total = Object.values(consumer_items).reduce((sum, item) => {
    return sum + parseFloat(item.price);
  }, sharedCharges);

  return (
    <div className="w-full mb-2">
      <div className="flex justify-between items-center w-full">
        <div className="flex items-center gap-2">
          <Text type="body_bold" className="text-darkest">
            {user_name}
          </Text>
          {isHost ? (
            <span className="px-1.5 font-bold text-sm text-primary bg-primarylight rounded-s rounded-e">
              Host
            </span>
          ) : (
            <i
              className={`fas fa-regular fa-bell mr-2 text-primary`}
              onClick={() => handleReminder(user_name)}
            ></i>
          )}
        </div>
        <Text type="body_bold" className="text-midgray">
          ${total.toFixed(2)}
        </Text>
      </div>
      {Object.values(consumer_items).map((item, index) => (
        <div className="flex justify-between items-center w-full" key={index}>
          <Text className="text-darkest">{item.name}</Text>
          <Text className="text-midgray">{item.price}</Text>
        </div>
      ))}
      {sharedCharges ? (
        <div className="flex justify-between items-center w-full">
          <Text className="text-midgray">Shared Charges</Text>
          <Text className="text-midgray">{sharedCharges.toFixed(2)}</Text>
        </div>
      ) : null}
    </div>
  );
};

export default ConsumerBreakdown;

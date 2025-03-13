import React, { useEffect, useState } from "react";
import Text from "./Text";
import { Item, Split } from "@/lib/backend";

interface ConsumerBreakdownProps {
  items: { [key: string]: Item };
  splits: Split[];
  user_id: string;
  user_name: string;
  sharedCharges: string | null;
  isHost: boolean;
  handleReminder: (name: string) => void;
}

interface MyItem {
  name: string;
  price: string;
}

const ConsumerBreakdown: React.FC<ConsumerBreakdownProps> = ({
  items,
  splits,
  user_id,
  user_name,
  sharedCharges,
  isHost,
  handleReminder,
}) => {
  const [total, setTotal] = useState<number>(0.0);
  const [myItems, setMyItems] = useState<{ [key: string]: MyItem }>({});

  useEffect(() => {
    const split_counts: { [key: string]: number } = {};
    const my_items: { [key: string]: MyItem } = {};

    for (const split of splits) {
      const split_key = `${split.item_id}_${split.split_id}`;
      if (split_key in split_counts) {
        split_counts[split_key] += 1;
      } else {
        split_counts[split_key] = 1;
      }
    }
    for (const split of splits) {
      if (!(split.item_id in items)) continue;
      const split_key = `${split.item_id}_${split.split_id}`;
      if (split.user_id == user_id) {
        let name = items[split.item_id].name;
        if (split_counts[split_key] > 1)
          name += " / " + split_counts[split_key].toString();
        const unit_price =
          parseFloat(items[split.item_id].price) /
          parseFloat(items[split.item_id].quantity);
        my_items[split_key] = {
          name: name,
          price: (unit_price / split_counts[split_key]).toFixed(2),
        };
      }
    }

    let total = 0;
    for (const item of Object.values(my_items)) {
      total += parseFloat(item.price);
    }
    setTotal(total);
    setMyItems(my_items);
  }, [items, splits, sharedCharges]);

  return (
    <div className="w-full mb-2">
      <div className="flex justify-between items-center w-full">
        <div className="flex items-center gap-2">
          <Text type="body_bold" className="text-darkest">
            {user_name}
          </Text>
          {isHost ? (
            <span className="px-2 py-1 font-bold text-sm text-primary bg-accentlight rounded-md">
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
      {Object.values(myItems).map((item, index) => (
        <div className="flex justify-between items-center w-full" key={index}>
          <Text className="text-darkest">{item.name}</Text>
          <Text className="text-midgray">{item.price}</Text>
        </div>
      ))}
      {sharedCharges ? (
        <div className="flex justify-between items-center w-full">
          <Text className="text-midgray">Shared Charges</Text>
          <Text className="text-midgray">{sharedCharges}</Text>
        </div>
      ) : null}
    </div>
  );
};

export default ConsumerBreakdown;

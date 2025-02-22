import React, { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import Text from "@/components/Text";
import LineItem from "@/components/LineItem";
import { Item, Split } from "@/lib/backend";

interface PaymentBreakdownProps {
  items: { [key: string]: Item };
  splits: { [key: string]: Split };
  user_id: string;
  sharedCharges: string;
}

interface MyItem {
  name: string;
  price: string;
}
const PaymentBreakdown: React.FC<PaymentBreakdownProps> = ({
  items,
  splits,
  user_id,
  sharedCharges,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [total, setTotal] = useState<number>(0.0);
  const [myItems, setMyItems] = useState<{ [key: string]: MyItem }>({});

  useEffect(() => {
    const split_counts: { [key: string]: number } = {};
    const my_items: { [key: string]: MyItem } = {};

    for (const split of Object.values(splits)) {
      const split_key = `${split.item_id}_${split.split_id}`;
      if (split_key in split_counts) {
        split_counts[split_key] += 1;
      } else {
        split_counts[split_key] = 1;
      }
    }
    for (const split of Object.values(splits)) {
      const split_key = `${split.item_id}_${split.split_id}`;
      if (split.user_id == user_id) {
        my_items[split.item_id] = {
          name:
            items[split.item_id].name +
            " / " +
            split_counts[split_key].toString(),
          price: (
            parseFloat(items[split.item_id].price) / split_counts[split_key]
          ).toFixed(2),
        };
      }
    }

    let total = 0;
    for (const item of Object.values(my_items)) {
      total += parseFloat(item.price);
    }
    setTotal(total);
    setMyItems(my_items);
  }, [items, splits]);

  return (
    <div className="w-full max-w-md mx-auto border border-lightgray rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-3"
      >
        <Text type="m_heading" className="text-darkest">
          My Total
        </Text>
        <div className="flex items-center gap-2">
          <Text type="m_heading" className="text-primary">
            ${total.toFixed(2)}
          </Text>
          {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </button>

      <div
        className={`transition-all duration-500 ease-in-out px-3 ${
          isOpen ? "max-h-[200px] opacity-100" : "max-h-0 opacity-0"
        } overflow-hidden bg-white`}
      >
        {Object.values(myItems).map((item, index) => (
          <div key={index} className="flex justify-between">
            <LineItem
              label={item.name}
              price={parseFloat(item.price)}
              labelColor="text-darkest"
            ></LineItem>
          </div>
        ))}
        <LineItem
          label="Shared Charges"
          price={parseFloat(sharedCharges)}
          labelColor="text-midgray"
          className="pb-3"
        ></LineItem>
      </div>
    </div>
  );
};

export default PaymentBreakdown;

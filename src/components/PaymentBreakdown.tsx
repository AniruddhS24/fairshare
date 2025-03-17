import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import Text from "@/components/Text";
import LineItem from "@/components/LineItem";

interface PaymentBreakdownProps {
  consumer_items: { [key: string]: { name: string; price: string } };
  sharedCharges: number;
}

const PaymentBreakdown: React.FC<PaymentBreakdownProps> = ({
  consumer_items,
  sharedCharges,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const total = Object.values(consumer_items).reduce((sum, item) => {
    return sum + parseFloat(item.price);
  }, sharedCharges);

  return (
    <div className="w-full max-w-md mx-auto shadow-[0px_0px_6px_0px_rgba(0,0,0,0.10)] rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex justify-between items-center px-3 ${
          !isOpen ? "py-2" : "pt-2"
        }`}
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
          isOpen ? "opacity-100" : "max-h-0 opacity-0"
        } overflow-hidden bg-white`}
      >
        {Object.values(consumer_items).map((item, index) => (
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
          price={sharedCharges}
          labelColor="text-midgray"
          className="pb-3"
        ></LineItem>
      </div>
    </div>
  );
};

export default PaymentBreakdown;

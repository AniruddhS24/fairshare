import React from 'react';
import Text from './Text';

interface ItemBreakdownProps {
  name: string,
  quantity: number,
  price: number,
  consumers: string[],
}

const ConsumerBreakdown: React.FC<ItemBreakdownProps> = ({name, quantity, price, consumers}) => {
  
  return (
    <div className="w-full">
        <div className="flex justify-between items-center w-full">
            <Text type="body_bold" className="text-darkest">{quantity}x {name}</Text>
            <Text type="body_bold" className="text-midgray">${(quantity*price).toFixed(2)}</Text>
        </div>
        {/* <div>
            <Text type="body" className="text-midgray">{quantity} @ ${price.toFixed(2)} each</Text>
        </div> */}
        <Text type="body" className="text-darkest">{consumers.join(", ")}</Text>
    </div>
  );
};

export default ConsumerBreakdown;

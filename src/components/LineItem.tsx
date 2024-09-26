import React from 'react';
import Text from './Text';

interface LineItemProps {
  label: string;
  price: number;
  labelColor: string;
}

const LineItem: React.FC<LineItemProps> = ({label, price, labelColor}) => {

  return (
    <div className="flex justify-between items-center w-full">
        <Text type="body_bold" className={labelColor}>{label}</Text>
        <Text type="body_semi" className="text-midgray">${price}</Text>
    </div>
  );
};

export default LineItem;

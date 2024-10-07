"use client";

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Spacer from "@/components/Spacer";
import Text from "../../../components/Text";
import ItemInput from '@/components/ItemInput';
import PriceInput from '@/components/PriceInput';
import QuantityInput from '@/components/QuantityInput';
import ModifyButton from '@/components/ModifyButton';
import LineItem from '@/components/LineItem';
import StickyButton from '@/components/StickyButton';
import { fetchDummyData } from '../../lib/backend';

export default function SplitPage({ params }: { params: { receiptid: string } }) {
  const [receiptItems, setReceiptItems] = useState([]);
  const router = useRouter();
  useEffect(() => {
    let data = fetchDummyData();
    data = data.map((item) => ({ ...item, isChecked: false }));
    setReceiptItems(data);
  }
  , []);

  const setChecked = (index: number) => {
    const newItems = [...receiptItems];
    newItems[index].isChecked = !newItems[index].isChecked;
    setReceiptItems(newItems);
  }

  const handleSaveSelections = () => {
    const query_params = new URLSearchParams();
    const selectedItems = receiptItems.map((item, index) => item.isChecked ? index : null).filter((index) => index !== null);
    const queryString = selectedItems.join(',');
    query_params.set('selected', queryString);
    router.push(`/${params.receiptid}/adjustments?${query_params.toString()}`);
  }

  return (
    <div className="h-full flex flex-col items-start justify-start bg-white px-5 pb-12">
        <Spacer size="large" />
        <Text type="xl_heading">My Share {params.receiptid}</Text>
        <Spacer size="small" />
        <Text type="body">Tap the items you consumed then click next.</Text>
        <Spacer size="large" />
        <div className="grid grid-cols-8 w-full">
        {receiptItems.map((item, index) => (
            <div
                className={`col-span-8 grid grid-cols-8 items-center gap-x-1 gap-y-3 py-3 pr-3 cursor-pointer ${receiptItems[index].isChecked ? 'bg-accentlight' : ''}`}
                key={index}
                onClick={() => setChecked(index)} // Trigger toggle on row click
            >
                <div className="col-span-1 flex justify-center items-center ">
                    <input
                        type="checkbox"
                        checked={receiptItems[index].isChecked}
                        onChange={(e) => e.stopPropagation()} // Prevent row click when clicking on checkbox
                        className='w-4 h-4 accent-primary'
                    />
                </div>
                <div className="col-span-7 flex justify-start items-center">
                    <LineItem
                    label={item.name}
                    price={item.price}
                    labelColor="text-darkest"
                    />
                </div>
            </div>
        ))}
        </div>
        <Spacer size="medium" /> 
        <StickyButton label="Next" onClick={handleSaveSelections} sticky />
    </div>
  );
};
"use client";

import { useState } from 'react';

import Spacer from "@/components/Spacer";
import Text from "../../components/Text";
import ItemInput from '@/components/ItemInput';
import PriceInput from '@/components/PriceInput';
import QuantityInput from '@/components/QuantityInput';
import ModifyButton from '@/components/ModifyButton';
import LineItem from '@/components/LineItem';
import StickyButton from '@/components/StickyButton';

export default function EditReceiptPage() {
  const [receiptItems, setReceiptItems] = useState([
    {name: 'Item 1', qty: 1, price: 5},
    {name: 'Item 2', qty: 2, price: 6}]); // Initial state with one text box
  const [sharedCharges, setSharedCharges] = useState(3.00);

  const setItemProp = (index: number, field: string) => (value) => {
    const newTextBoxes = [...receiptItems];
    newTextBoxes[index][field] = value;
    setReceiptItems(newTextBoxes);
  }

  const deleteItem = (index) => {
    if (receiptItems.length > 1) {
      const newTextBoxes = [...receiptItems];
      newTextBoxes.splice(index, 1);
      setReceiptItems(newTextBoxes);
    }
  }

  const calculateTotal = () => {
    let total = parseFloat(sharedCharges);
    receiptItems.forEach((item) => {
      total += item.qty * item.price;
    });
    return total.toFixed(2);
  }

  const handleSaveEdits = () => {
    // TODO: Save the edited receipt
  }

  return (
    <div className="h-screen flex flex-col items-start justify-start bg-white px-5">
        <Spacer size="large" />
        <Text type="xl_heading">Edit Receipt</Text>
        <Spacer size="small" />
        <Text type="body">Fix any mistakes or add missing items.</Text>
        <Spacer size="large" />
        <div className="grid grid-cols-8 gap-y-3 w-full">
          {receiptItems.map((item, index) => (
            <div className="col-span-8 grid grid-cols-8 items-center gap-x-1 gap-y-3" key={index}>
              <div className="col-span-3 flex justify-center items-center">
                <ItemInput placeholder="Item name" value={item.name} setValue={setItemProp(index, "name")} />
              </div>
              <div className="col-span-2 flex justify-center items-center">
                <QuantityInput placeholder="Quantity" value={item.qty} setValue={setItemProp(index, "qty")} />
              </div>
              <div className="col-span-2 flex justify-center items-center">
                <PriceInput placeholder="Price" value={item.price} setValue={setItemProp(index, "price")} />
              </div>
              <button onClick={() => deleteItem(index)} className="col-span-1 flex justify-center items-center transition-transform duration-200 active:scale-90">
                <i className="fas fa-trash text-midgray"></i>
              </button>
              {index !== receiptItems.length - 1 &&
                <div className="col-span-8 justify-center items-center">
                  <hr className="border-gray-[#C1C9D01e]" />
                </div>
              }
            </div>
          ))}
        </div>
        <Spacer size="medium" /> 
        <ModifyButton label="Add Item" icon="fa-plus" onClick={() => setReceiptItems([...receiptItems, {name: '', qty: 1, price: 0}])} />
        <Spacer size="medium" />
        <div className="col-span-8 grid grid-cols-8 items-center gap-2">
          <div className="col-span-3 flex justify-start items-center">
            <Text type="body_bold" className="text-darkest">Shared Charges</Text>
          </div>
          <div className="col-span-2">
          </div>
          <div className="col-span-2 flex justify-center items-center">
            <PriceInput placeholder="Price" value={sharedCharges} setValue={setSharedCharges} />
          </div>
          <button onClick={() => alert('Shared charges are...')} className="col-span-1 flex justify-center items-center transition-transform duration-200 active:scale-90">
            <i className="fas fa-info-circle text-midgray"></i>
          </button>
        </div>
        <Spacer size="medium" />
        <LineItem label="Grand Total" price={calculateTotal()} labelColor='text-darkest'/>
        <StickyButton label="Next" onClick={handleSaveEdits} sticky />
    </div>
  );
};
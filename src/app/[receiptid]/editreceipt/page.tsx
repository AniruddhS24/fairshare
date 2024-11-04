"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Spacer from "@/components/Spacer";
import Text from "../../../components/Text";
import ItemInput from "@/components/ItemInput";
import PriceInput from "@/components/PriceInput";
import QuantityInput from "@/components/QuantityInput";
import ModifyButton from "@/components/ModifyButton";
import LineItem from "@/components/LineItem";
import StickyButton from "@/components/StickyButton";
import Spinner from "@/components/Spinner";
import { dummyGetReceiptItems, dummySetReceiptItems } from "../../lib/backend";

export default function EditReceiptPage({
  params,
}: {
  params: { receiptid: string };
}) {
  const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  const [loading, setLoading] = useState(true);
  const [receiptItems, setReceiptItems] = useState([]);
  const [sharedCharges, setSharedCharges] = useState({
    value: "0.00",
    edited: false,
  });
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    fetch(`${apiUrl}/receipt/${params.receiptid}`, {
      method: "GET",
    })
      .then((res) => res.json())
      .then((data) => {
        const receipt = data.data;
        setSharedCharges({ value: receipt.shared_cost, edited: false });
      });
    fetch(`${apiUrl}/receipt/${params.receiptid}/item`, {
      method: "GET",
    })
      .then((res) => res.json())
      .then((data) => {
        const items = [];
        for (const item of data.data) {
          items.push({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            edited: false,
            deleted: false,
          });
        }
        setReceiptItems(items);
        setLoading(false);
      });
  }, []);

  const setItemProp = (index: number, field: string) => (value) => {
    const newTextBoxes = [...receiptItems];
    newTextBoxes[index][field] = value;
    newTextBoxes[index].edited = true;
    setReceiptItems(newTextBoxes);
  };

  const deleteItem = (index) => {
    if (receiptItems.length > 1) {
      const newTextBoxes = [...receiptItems];
      const item = newTextBoxes[index];
      item.deleted = true;
      setReceiptItems(newTextBoxes);
    }
  };

  const calculateTotal = () => {
    let total = parseFloat(sharedCharges.value);
    receiptItems
      .filter((item) => !item.deleted)
      .forEach((item) => {
        total += parseInt(item.quantity) * parseFloat(item.price);
      });
    return total.toFixed(2);
  };

  const handleSaveEdits = async () => {
    const data = receiptItems;
    let edited = sharedCharges.edited;
    for (const item of data) {
      if (item.id && item.edited) {
        edited = true;
        await fetch(`${apiUrl}/receipt/${params.receiptid}/item/${item.id}`, {
          method: "PUT",
          body: JSON.stringify({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          }),
        });
      } else if (item.id && item.deleted) {
        edited = true;
        await fetch(`${apiUrl}/receipt/${params.receiptid}/item/${item.id}`, {
          method: "DELETE",
        });
      } else if (!item.id) {
        edited = true;
        await fetch(`${apiUrl}/receipt/${params.receiptid}/item`, {
          method: "POST",
          body: JSON.stringify({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          }),
        });
      }
    }
    console.log(edited);
    console.log(calculateTotal());
    if (edited) {
      fetch(`${apiUrl}/receipt/${params.receiptid}`, {
        method: "PUT",
        body: JSON.stringify({
          shared_cost: sharedCharges.value,
          grand_total: calculateTotal(),
        }),
      });
    }
    router.push(`/${params.receiptid}/split`);
  };

  return (
    <div className="h-full flex flex-col items-start justify-start bg-white px-2 pb-12">
      <Spacer size="large" />
      <Text type="xl_heading" className="text-darkest">
        Edit Receipt
      </Text>
      <Spacer size="small" />
      <Text type="body" className="text-midgray">
        Fix any mistakes or add missing items.
      </Text>
      <Spacer size="large" />
      {!loading ? (
        <div className="w-full">
          <div className="grid grid-cols-9 gap-y-3 w-full">
            {receiptItems
              .filter((item) => !item.deleted)
              .map((item, index) => (
                <div
                  className="col-span-9 grid grid-cols-9 items-center gap-x-1 gap-y-3"
                  key={index}
                >
                  <div className="col-span-4 flex justify-center items-center">
                    <ItemInput
                      placeholder="Item name"
                      value={item.name}
                      setValue={setItemProp(index, "name")}
                    />
                  </div>
                  <div className="col-span-2 flex justify-center items-center">
                    <QuantityInput
                      placeholder="Quantity"
                      value={item.quantity}
                      setValue={setItemProp(index, "quantity")}
                    />
                  </div>
                  <div className="col-span-2 flex justify-center items-center">
                    <PriceInput
                      placeholder="Price"
                      value={item.price}
                      setValue={setItemProp(index, "price")}
                    />
                  </div>
                  <button
                    onClick={() => deleteItem(index)}
                    className="col-span-1 flex justify-center items-center transition-transform duration-200 active:scale-90"
                  >
                    <i className="fas fa-trash text-midgray"></i>
                  </button>
                  {index !== receiptItems.length - 1 && (
                    <div className="col-span-9 justify-center items-center">
                      <hr className="border-gray-[#C1C9D01e]" />
                    </div>
                  )}
                </div>
              ))}
          </div>
          <Spacer size="medium" />
          <ModifyButton
            label="Add Item"
            icon="fa-plus"
            onClick={() =>
              setReceiptItems([
                ...receiptItems,
                {
                  id: null,
                  name: "",
                  quantity: 1,
                  price: 0,
                  edited: false,
                  deleted: false,
                },
              ])
            }
          />
          <Spacer size="medium" />
          <div className="col-span-8 grid grid-cols-8 items-center gap-2">
            <div className="col-span-3 flex justify-start items-center">
              <Text type="body_bold" className="text-darkest">
                Shared Charges
              </Text>
            </div>
            <div className="col-span-2"></div>
            <div className="col-span-2 flex justify-center items-center">
              <PriceInput
                placeholder="Price"
                value={sharedCharges.value}
                setValue={(value) => setSharedCharges({ value, edited: true })}
              />
            </div>
            <button
              onClick={() => alert("Shared charges are...")}
              className="col-span-1 flex justify-center items-center transition-transform duration-200 active:scale-90"
            >
              <i className="fas fa-info-circle text-midgray"></i>
            </button>
          </div>
          <Spacer size="medium" />
          <LineItem
            label="Grand Total"
            price={calculateTotal()}
            labelColor="text-darkest"
            bold
          />
          <Spacer size="large" />
          <StickyButton label="Next" onClick={handleSaveEdits} sticky />
        </div>
      ) : (
        <div className="flex w-full items-center justify-center">
          <Spinner color="text-primary" />
        </div>
      )}
    </div>
  );
}

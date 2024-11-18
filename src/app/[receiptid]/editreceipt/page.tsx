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
import { useGlobalContext, Permission } from "@/contexts/GlobalContext";
import { backend } from "@/lib/backend";

export default function EditReceiptPage({
  params,
}: {
  params: { receiptid: string };
}) {
  const { user, invalid_token, getPermission } = useGlobalContext();
  const [loading, setLoading] = useState(true);
  const [receiptItems, setReceiptItems] = useState([]);
  const [sharedCharges, setSharedCharges] = useState({
    value: "0.00",
    edited: false,
  });
  const [counter, setCounter] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      // set loading
    } else if (invalid_token) {
      router.push(`/user?receiptid=${params.receiptid}&page=editreceipt`);
    } else {
      getPermission(params.receiptid).then((permission) => {
        if (permission === Permission.UNAUTHORIZED) {
          router.push(`/unauthorized`);
        }
      });
    }

    setLoading(true);
    backend("GET", `/receipt/${params.receiptid}`).then((resp) => {
      const receipt = resp.data;
      setSharedCharges({ value: receipt.shared_cost, edited: false });
    });

    backend("GET", `/receipt/${params.receiptid}/item`).then((resp) => {
      const items = [];
      let ct = counter;
      for (const item of resp.data) {
        items.push({
          id: item.id,
          index: ct,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          edited: false,
          deleted: false,
        });
        ct++;
      }
      setCounter(ct);
      setReceiptItems(items);
      setLoading(false);
    });
  }, [user, invalid_token]);

  const setItemProp = (index: number, field: string) => (value) => {
    const newReceiptItems = [...receiptItems];
    newReceiptItems[index][field] = value;
    newReceiptItems[index].edited = true;
    setReceiptItems(newReceiptItems);
  };

  const deleteItem = (index) => {
    if (receiptItems.length > 1) {
      const newReceiptItems = [...receiptItems];
      const item = newReceiptItems[index];
      item.deleted = true;
      setReceiptItems(newReceiptItems);
    }
  };

  const addItem = () => {
    const newReceiptItems = [...receiptItems];
    newReceiptItems.push({
      id: null,
      index: counter,
      name: "",
      quantity: 1,
      price: 0,
      edited: false,
      deleted: false,
    });
    setCounter(counter + 1);
    setReceiptItems(newReceiptItems);
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
    const promises = [];
    for (const item of data) {
      if (item.id && item.edited) {
        edited = true;
        promises.push(
          backend("PUT", `/receipt/${params.receiptid}/item/${item.id}`, {
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          })
        );
      } else if (item.id && item.deleted) {
        edited = true;
        promises.push(
          backend("DELETE", `/receipt/${params.receiptid}/item/${item.id}`)
        );
      } else if (!item.id) {
        edited = true;
        promises.push(
          backend("POST", `/receipt/${params.receiptid}/item`, {
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          })
        );
      }
    }
    if (edited) {
      promises.push(
        backend("PUT", `/receipt/${params.receiptid}`, {
          shared_cost: sharedCharges.value,
          grand_total: calculateTotal(),
        })
      );
    }
    await Promise.all(promises);
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
              .map((item, list_index) => (
                <div
                  className="col-span-9 grid grid-cols-9 items-center gap-x-1 gap-y-3"
                  key={item.index}
                >
                  <div className="col-span-4 flex justify-center items-center">
                    <ItemInput
                      placeholder="Item name"
                      value={item.name}
                      setValue={setItemProp(item.index, "name")}
                    />
                  </div>
                  <div className="col-span-2 flex justify-center items-center">
                    <QuantityInput
                      placeholder="Quantity"
                      value={item.quantity}
                      setValue={setItemProp(item.index, "quantity")}
                    />
                  </div>
                  <div className="col-span-2 flex justify-center items-center">
                    <PriceInput
                      placeholder="Price"
                      value={item.price}
                      setValue={setItemProp(item.index, "price")}
                    />
                  </div>
                  <button
                    onClick={() => deleteItem(item.index)}
                    className="col-span-1 flex justify-center items-center transition-transform duration-200 active:scale-90"
                  >
                    <i className="fas fa-trash text-midgray"></i>
                  </button>
                  {list_index !== receiptItems.length - 1 && (
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
            onClick={() => addItem()}
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

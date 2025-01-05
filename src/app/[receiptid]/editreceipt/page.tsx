"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Spacer from "@/components/Spacer";
import Text from "../../../components/Text";
import LogoutSection from "@/components/LogoutSection";
import ItemInput from "@/components/ItemInput";
import PriceInput from "@/components/PriceInput";
import QuantityInput from "@/components/QuantityInput";
import ModifyButton from "@/components/ModifyButton";
import LineItem from "@/components/LineItem";
import StickyButton from "@/components/StickyButton";
import Spinner from "@/components/Spinner";
import Container from "@/components/Container";
import {
  useGlobalContext,
  AuthStatus,
  Permission,
} from "@/contexts/GlobalContext";
import {
  backend,
  getReceipt,
  getItems,
  updateItem,
  createItem,
  deleteItem,
} from "@/lib/backend";

interface EditItemProps {
  id: string | null;
  index: number;
  name: string;
  quantity: string;
  price: string;
  edited: boolean;
  deleted: boolean;
}

export default function EditReceiptPage({
  params,
}: {
  params: { receiptid: string };
}) {
  const { status, getPermission } = useGlobalContext();
  const [loading, setLoading] = useState(true);
  const [receiptItems, setReceiptItems] = useState<EditItemProps[]>([]);
  const [sharedCharges, setSharedCharges] = useState({
    value: "0.00",
    edited: false,
  });
  const [counter, setCounter] = useState(0);
  const receipt_id = params.receiptid;
  const router = useRouter();

  useEffect(() => {
    setLoading(true);

    if (status === AuthStatus.CHECKING) {
      return;
    } else if (status === AuthStatus.NO_TOKEN) {
      router.push(`/user?receiptid=${receipt_id}&page=editreceipt`);
    } else if (status === AuthStatus.BAD_TOKEN) {
      router.push(`/user`);
    } else if (status === AuthStatus.AUTHORIZED) {
      getPermission(receipt_id).then((permission) => {
        if (permission === Permission.UNAUTHORIZED) {
          router.push(`/unauthorized`);
        }
      });
    }

    const fetchData = async () => {
      const receipt = await getReceipt(receipt_id);
      if (receipt.settled) {
        router.push(`/${receipt_id}/dashboard`);
      }
      setSharedCharges({ value: receipt.shared_cost, edited: false });

      const items = [];
      let ct = counter;
      const receipt_items = await getItems(receipt_id);
      for (const item of receipt_items) {
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
    };

    fetchData().then(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, receipt_id]);

  const setItemProp =
    (index: number, field: keyof EditItemProps) => (value: string | number) => {
      const newReceiptItems = [...receiptItems];
      if (field === "index") {
        newReceiptItems[index][field] = value as number;
      } else if (field === "edited" || field === "deleted") {
        newReceiptItems[index][field] = Boolean(value);
      } else {
        newReceiptItems[index][field] = value.toString();
      }
      newReceiptItems[index].edited = true;
      setReceiptItems(newReceiptItems);
    };

  const removeItem = (index: number) => {
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
      quantity: "1",
      price: "0",
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
    return total;
  };

  const handleSaveEdits = async () => {
    const data = receiptItems;
    let receipt_changed = sharedCharges.edited;
    const promises = [];
    for (const item of data) {
      if (item.id && item.deleted) {
        receipt_changed = true;
        promises.push(deleteItem(receipt_id, item.id));
      } else if (item.id && item.edited) {
        receipt_changed = true;
        promises.push(
          updateItem(receipt_id, item.id, item.name, item.quantity, item.price)
        );
      } else if (!item.id) {
        receipt_changed = true;
        promises.push(
          createItem(receipt_id, item.name, item.quantity, item.price)
        );
      }
    }
    if (receipt_changed) {
      promises.push(
        backend("PUT", `/receipt/${receipt_id}`, {
          shared_cost: sharedCharges.value,
          grand_total: calculateTotal().toFixed(2),
        })
      );
    }
    await Promise.all(promises);
    router.push(`/${receipt_id}/split`);
  };

  return (
    <Container>
      <LogoutSection></LogoutSection>
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
              .map((item) => (
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
                      value={parseInt(item.quantity)}
                      setValue={setItemProp(item.index, "quantity")}
                    />
                  </div>
                  <div className="col-span-2 flex justify-center items-center">
                    <PriceInput
                      value={item.price}
                      setValue={setItemProp(item.index, "price")}
                    />
                  </div>
                  <button
                    onClick={() => removeItem(item.index)}
                    className="col-span-1 flex justify-center items-center transition-transform duration-200 active:scale-90"
                  >
                    <i className="fas fa-trash text-midgray"></i>
                  </button>
                  {/* {list_index !== receiptItems.length - 1 && (
                    <div className="col-span-9 justify-center items-center">
                      <hr className="border-gray-[#C1C9D01e]" />
                    </div>
                  )} */}
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
    </Container>
  );
}

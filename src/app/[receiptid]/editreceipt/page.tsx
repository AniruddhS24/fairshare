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
import PercentageInput from "@/components/PercentageInput";

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
  const [additionalGratuity, setAdditionalGratuity] = useState({
    value: "0",
    edited: false,
  });
  const [additionalGratuityPct, setAdditionalGratuityPct] = useState({
    value: "0",
    edited: false,
  });
  const [currentSubTotal, setCurrentSubTotal] = useState(0);

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
        router.push(`/${receipt_id}/live`);
      }

      const items = [];
      let ct = counter;
      const receipt_items = await getItems(receipt_id);
      let total = 0;
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
        total += parseInt(item.quantity) * parseFloat(item.price);
      }
      setCounter(ct);
      if (items.length == 0) addItem();
      else setReceiptItems(items);

      setSharedCharges({ value: receipt.shared_cost, edited: false });
      setAdditionalGratuity({ value: receipt.addl_gratuity, edited: false });
      const newPct = (
        (parseFloat(receipt.addl_gratuity) / (total == 0 ? 1 : total)) *
        100
      ).toFixed(0);
      setAdditionalGratuityPct({
        value: newPct,
        edited: true,
      });
    };

    fetchData().then(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, receipt_id]);

  useEffect(() => {
    let subtotal = 0;
    receiptItems
      .filter((item) => !item.deleted)
      .forEach((item) => {
        subtotal += parseInt(item.quantity) * parseFloat(item.price);
      });
    setCurrentSubTotal(subtotal);
    const total = subtotal + parseFloat(sharedCharges.value);
    let newPct =
      total == 0 ? 0 : (parseFloat(additionalGratuity.value) / total) * 100;
    if (newPct > 100) newPct = 0;
    setAdditionalGratuityPct({
      value: newPct.toFixed(0),
      edited: false,
    });
  }, [receiptItems, sharedCharges]);

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
    return (
      currentSubTotal +
      parseFloat(sharedCharges.value) +
      parseFloat(additionalGratuity.value)
    );
  };

  const handleSaveEdits = async () => {
    const data = receiptItems;
    let receipt_changed = sharedCharges.edited || additionalGratuity.edited;
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
      } else if (!item.id && !item.deleted) {
        receipt_changed = true;
        promises.push(
          createItem(receipt_id, item.name, item.quantity, item.price)
        );
      }
    }
    if (receipt_changed) {
      promises.push(
        backend("PUT", `/receipt/${receipt_id}`, {
          addl_gratuity: additionalGratuity.value,
          shared_cost: sharedCharges.value,
          grand_total: calculateTotal().toFixed(2),
        })
      );
    }
    for (const promise of promises) {
      try {
        await promise;
      } catch (error) {
        console.error("Error processing item:", error);
      }
    }
    router.push(`/${receipt_id}/live`);
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
          <div className="grid grid-cols-12 gap-y-3 w-full">
            {receiptItems
              .filter((item) => !item.deleted)
              .map((item) => (
                <div
                  className="col-span-12 grid grid-cols-12 items-center gap-x-1 gap-y-3"
                  key={item.index}
                >
                  <div className="col-span-5 flex justify-center items-center">
                    <ItemInput
                      placeholder="Item name"
                      value={item.name}
                      setValue={setItemProp(item.index, "name")}
                    />
                  </div>
                  <div className="col-span-3 flex justify-center items-center">
                    <QuantityInput
                      value={parseInt(item.quantity)}
                      setValue={setItemProp(item.index, "quantity")}
                    />
                  </div>
                  <div className="col-span-3 flex justify-center items-center">
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
          <div className="w-full flex justify-end">
            <ModifyButton
              label="Add Item"
              icon="fa-plus"
              onClick={() => addItem()}
            />
          </div>
          <Spacer size="small" />
          <LineItem
            label="Subtotal"
            price={currentSubTotal}
            labelColor="text-midgray"
            bold
          />
          <Spacer size="medium" />
          <Text type="body_bold" className="text-darkest">
            Shared Charges
          </Text>
          <div className="col-span-12 grid grid-cols-12 items-center gap-2">
            <div className="col-span-9 flex justify-start items-center">
              <Text type="body_semi" className="text-darkest">
                Tax + Other Fees
              </Text>
            </div>
            <div className="col-span-3 flex justify-center items-center">
              <PriceInput
                value={sharedCharges.value}
                setValue={(value) => setSharedCharges({ value, edited: true })}
              />
            </div>
          </div>
          <Spacer size="small" />
          <div className="col-span-12 grid grid-cols-12 items-center gap-2">
            <div className="col-span-6 flex justify-start items-center">
              <Text type="body_semi" className="text-darkest">
                Tip
              </Text>
            </div>
            <div className="col-span-3 flex justify-center items-center">
              <PercentageInput
                value={additionalGratuityPct.value}
                setValue={(value) => {
                  const newPct = parseInt(value);
                  const newDollarAmount = (
                    (currentSubTotal + parseFloat(sharedCharges.value)) *
                    (newPct / 100)
                  ).toFixed(2);
                  setAdditionalGratuity({
                    value: newDollarAmount,
                    edited: true,
                  });
                  setAdditionalGratuityPct({ value, edited: true });
                }}
              />
            </div>
            <div className="col-span-3 flex justify-center items-center">
              <PriceInput
                value={additionalGratuity.value}
                setValue={(value) => {
                  const newDollarAmount = parseFloat(value);
                  const total =
                    currentSubTotal + parseFloat(sharedCharges.value);
                  const newPct =
                    total == 0
                      ? "0"
                      : ((newDollarAmount / total) * 100).toFixed(0);
                  setAdditionalGratuityPct({
                    value: newPct,
                    edited: true,
                  });
                  setAdditionalGratuity({ value, edited: true });
                }}
              />
            </div>
          </div>
          <Spacer size="medium" />
          <LineItem
            label="Grand Total"
            price={calculateTotal()}
            labelColor="text-primary"
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

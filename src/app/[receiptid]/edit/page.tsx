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
  createReceipt,
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
  checked: boolean;
}

export default function EditReceiptPage({
  params,
}: {
  params: { receiptid: string };
}) {
  const { status, user, getRole, receipt, setReceipt, setRole } =
    useGlobalContext();
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

  const [splitDetailsStep, setSplitDetailsStep] = useState<boolean>(false);
  const [numConsumers, setNumConsumers] = useState({
    value: 1,
    edited: false,
  });

  const receipt_id = params.receiptid;
  const router = useRouter();

  useEffect(() => {
    setLoading(true);

    if (status === AuthStatus.CHECKING) {
      return;
    } else if (status === AuthStatus.NO_TOKEN) {
      router.push(`/user?receiptid=${receipt_id}&page=edit`);
    } else if (status === AuthStatus.BAD_TOKEN) {
      router.push(`/user`);
    } else if (status === AuthStatus.AUTHORIZED) {
      if (receipt_id === "new") {
        addItem();
        setLoading(false);
        return;
      }
      getRole(receipt_id).then((role) => {
        if (role.permission !== Permission.HOST) {
          router.push(`/unauthorized`);
        }
      });
    }

    const fetchData = async () => {
      const _receipt = receipt || (await getReceipt(receipt_id));
      if (_receipt.settled) {
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
          checked: item.global_split,
        });
        ct++;
        total += safeParseFloat(item.price);
      }
      setCounter(ct);
      if (items.length == 0) addItem();
      else setReceiptItems(items);

      setSharedCharges({ value: _receipt.shared_cost, edited: false });
      setAdditionalGratuity({ value: _receipt.addl_gratuity, edited: false });
      setNumConsumers({ value: _receipt.consumers, edited: false });
      const newPct = (
        (safeParseFloat(_receipt.addl_gratuity) / (total == 0 ? 1 : total)) *
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
        subtotal += safeParseFloat(item.price);
      });
    setCurrentSubTotal(subtotal);
    const total = subtotal + safeParseFloat(sharedCharges.value);
    // const newGratuity =
    //   (safeParseFloat(additionalGratuityPct.value) / 100) * total;
    // alert(newGratuity);
    // setAdditionalGratuity({
    //   value: newGratuity.toFixed(2),
    //   edited: false,
    // });
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
      } else if (
        field === "edited" ||
        field === "deleted" ||
        field === "checked"
      ) {
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
      checked: false,
    });
    setCounter(counter + 1);
    setReceiptItems(newReceiptItems);
  };

  const calculateTotal = () => {
    return (
      currentSubTotal +
      safeParseFloat(sharedCharges.value) +
      safeParseFloat(additionalGratuity.value)
    );
  };

  const safeParseFloat = (value: string) => {
    const result = parseFloat(value === "" ? "0" : value);
    return isNaN(result) ? 0 : result;
  };

  const handleSaveEdits = async () => {
    let _receipt_id = receipt_id;
    const data = receiptItems;
    let receipt_changed =
      sharedCharges.edited || additionalGratuity.edited || numConsumers.edited;
    const promises = [];
    if (receipt_id === "new") {
      const receipt = await createReceipt(
        safeParseFloat(sharedCharges.value),
        calculateTotal(),
        safeParseFloat(additionalGratuity.value),
        numConsumers.value
      );
      _receipt_id = receipt.id;
      setReceipt(receipt);
      setRole({
        receipt_id: receipt.id,
        user_id: user?.id || "",
        permission: "host",
        done: false,
      });
    } else if (receipt_changed) {
      setReceipt((prevReceipt) => {
        const prev = prevReceipt || {
          id: _receipt_id,
          image_url: "",
          settled: false,
          item_counter: receiptItems.length,
        };
        return {
          ...prev,
          addl_gratuity: additionalGratuity.value,
          shared_cost: sharedCharges.value,
          grand_total: calculateTotal().toFixed(2),
          consumers: numConsumers.value,
        };
      });
      promises.push(
        backend("PUT", `/receipt/${_receipt_id}`, {
          consumers: numConsumers.value,
          addl_gratuity: additionalGratuity.value,
          shared_cost: sharedCharges.value,
          grand_total: calculateTotal().toFixed(2),
        })
      );
    }

    for (const item of data) {
      if (item.id && item.deleted) {
        receipt_changed = true;
        promises.push(deleteItem(_receipt_id, item.id));
      } else if (item.id && item.edited) {
        receipt_changed = true;
        promises.push(
          updateItem(
            _receipt_id,
            item.id,
            item.name,
            item.quantity,
            safeParseFloat(item.price).toFixed(2),
            item.checked
          )
        );
      } else if (!item.id && !item.deleted) {
        receipt_changed = true;
        promises.push(
          createItem(
            _receipt_id,
            item.name,
            item.quantity,
            safeParseFloat(item.price).toFixed(2),
            item.checked
          )
        );
      }
    }
    for (const promise of promises) {
      try {
        await promise;
      } catch (error) {
        console.error("Error processing item:", error);
      }
    }
    router.push(`/${_receipt_id}/live`);
  };

  return splitDetailsStep ? (
    <Container header onBack={() => setSplitDetailsStep(!splitDetailsStep)}>
      <Text type="m_heading" className="text-darkest">
        Number of People
      </Text>
      <Text type="body" className="text-midgray">
        <b>How many people</b> are splitting this receipt, including you?
      </Text>
      <Spacer size="small" />
      <div className="flex items-center w-full justify-between">
        <button
          className="w-10 h-10 rounded-full bg-white border-2 border-lightestgray flex items-center justify-center font-bold
                 text-primary transition-transform duration-150 active:scale-90 active:bg-lightgray"
          onClick={() => {
            setNumConsumers({ value: numConsumers.value - 1, edited: true });
          }}
          disabled={numConsumers.value <= 1}
        >
          <i className="fas fa-minus"></i>
        </button>
        <input
          type="number"
          value={numConsumers.value}
          readOnly
          className="flex-grow mx-2 font-normal text-darkest bg-lightestgray placeholder-midgray rounded-xl p-2 text-center focus:outline-none focus:border-transparent"
        />
        <button
          className="w-10 h-10 rounded-full bg-white border-2 border-lightestgray flex items-center justify-center font-bold
                 text-primary transition-transform duration-150 active:scale-90 active:bg-lightgray"
          onClick={() => {
            setNumConsumers({ value: numConsumers.value + 1, edited: true });
          }}
        >
          <i className="fas fa-plus"></i>
        </button>
      </div>
      <Spacer size="large" />
      <Text type="m_heading" className="text-darkest">
        For The Table
      </Text>
      <Text type="body" className="text-midgray">
        Were any items split <b>evenly among everyone</b>?
      </Text>
      <Spacer size="small" />
      <div className="w-full">
        <div className="grid grid-cols-8 w-full">
          {receiptItems.map((item, index) => (
            <div
              className={`col-span-8 grid grid-cols-8 items-center py-3 -mx-4 ${
                receiptItems[index].checked ? "bg-accentlight" : ""
              }`}
              key={index}
              onClick={() =>
                setReceiptItems((prev) =>
                  prev.map((item, i) =>
                    i === index
                      ? { ...item, checked: !item.checked, edited: true }
                      : item
                  )
                )
              }
            >
              <div className="col-span-1 flex justify-center items-center ">
                <input
                  type="checkbox"
                  checked={receiptItems[index].checked}
                  onChange={(e) => e.stopPropagation()} // Prevent row click when clicking on checkbox
                  className="w-4 h-4 accent-primary"
                />
              </div>
              <div className="col-span-7 flex justify-start items-center">
                <Text type="body_semi" className="text-darkest">
                  {item.name}
                </Text>
              </div>
            </div>
          ))}
        </div>
      </div>
      <StickyButton
        label="Split Receipt"
        onClick={handleSaveEdits}
        disabled={numConsumers.value === 1}
        sticky
      />
    </Container>
  ) : (
    <Container header>
      <Text type="xl_heading" className="text-darkest">
        Edit Receipt
      </Text>
      <Spacer size="small" />
      <Text type="body" className="text-midgray">
        Fix any mistakes or add missing items.
      </Text>
      <Spacer size="medium" />
      {!loading ? (
        <div className="w-full">
          <div className="col-span-12 grid grid-cols-12 items-center mb-1">
            <div className="col-span-5 flex justify-start items-center">
              <Text type="body_semi" className="text-midgray">
                Item Name
              </Text>
            </div>
            <div className="col-span-3 flex justify-center items-center">
              <Text type="body_semi" className="text-midgray">
                Qty
              </Text>
            </div>
            <div className="col-span-3 flex justify-center items-center">
              <Text type="body_semi" className="text-midgray">
                Total Price
              </Text>
            </div>
          </div>
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
                Tax + Fees
              </Text>
            </div>
            <div className="col-span-3 flex justify-center items-center">
              <PriceInput
                value={sharedCharges.value}
                setValue={(value) =>
                  setSharedCharges({
                    value,
                    edited: true,
                  })
                }
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
                  const newPct = parseInt(value || "0");
                  const newDollarAmount = (
                    (currentSubTotal + safeParseFloat(sharedCharges.value)) *
                    (newPct / 100)
                  ).toFixed(2);
                  setAdditionalGratuity({
                    value: newDollarAmount,
                    edited: true,
                  });
                  setAdditionalGratuityPct({
                    value,
                    edited: true,
                  });
                }}
              />
            </div>
            <div className="col-span-3 flex justify-center items-center">
              <PriceInput
                value={additionalGratuity.value}
                setValue={(value) => {
                  const newDollarAmount = safeParseFloat(value);
                  const total =
                    currentSubTotal + safeParseFloat(sharedCharges.value);
                  const newPct =
                    total == 0
                      ? "0"
                      : ((newDollarAmount / total) * 100).toFixed(0);
                  setAdditionalGratuityPct({
                    value: newPct,
                    edited: true,
                  });
                  setAdditionalGratuity({
                    value,
                    edited: true,
                  });
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
          <StickyButton
            label="Table Details"
            onClick={() => setSplitDetailsStep(true)}
            disabled={receiptItems.some((item) => item.name === "")}
            sticky
          />
        </div>
      ) : (
        <div className="flex w-full items-center justify-center">
          <Spinner color="text-primary" />
        </div>
      )}
    </Container>
  );
}

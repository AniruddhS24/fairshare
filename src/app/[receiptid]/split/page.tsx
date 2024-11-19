"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Spacer from "@/components/Spacer";
import Text from "../../../components/Text";
import LineItem from "@/components/LineItem";
import StickyButton from "@/components/StickyButton";
import { useGlobalContext, Permission } from "@/contexts/GlobalContext";
import { getItems } from "@/lib/backend";

interface SplitItems {
  id: string;
  name: string;
  quantity: string;
  price: string;
  isChecked: boolean;
}

export default function SplitPage({
  params,
}: {
  params: { receiptid: string };
}) {
  const { user, invalid_token, getPermission } = useGlobalContext();
  const [receiptItems, setReceiptItems] = useState<SplitItems[]>([]);
  const router = useRouter();
  useEffect(() => {
    if (!user) {
      // set loading
    } else if (invalid_token) {
      router.push(`/user?receiptid=${params.receiptid}&page=split`);
    } else {
      getPermission(params.receiptid).then((permission) => {
        if (permission === Permission.UNAUTHORIZED) {
          router.push(`/unauthorized`);
        }
      });
    }

    getItems(params.receiptid).then((data) => {
      const items = [];
      for (const item of data) {
        items.push({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          isChecked: false,
        });
      }
      setReceiptItems(items);
    });
  }, [invalid_token]);

  const setChecked = (index: number) => {
    const newItems = [...receiptItems];
    newItems[index].isChecked = !newItems[index].isChecked;
    setReceiptItems(newItems);
  };

  const handleSaveSelections = () => {
    const query_params = new URLSearchParams();
    const selectedItems = receiptItems
      .map((item, index) => (item.isChecked ? index : null))
      .filter((index) => index !== null);
    const queryString = selectedItems.join(",");
    query_params.set("selected", queryString);
    router.push(`/${params.receiptid}/adjustments?${query_params.toString()}`);
  };

  return (
    <div className="h-full flex flex-col items-start justify-start bg-white px-2 pb-12">
      <Spacer size="large" />
      <Text type="xl_heading" className="text-darkest">
        My Share
      </Text>
      <Spacer size="small" />
      <Text type="body" className="text-midgray">
        Tap the items you consumed then click next.
      </Text>
      <Spacer size="large" />
      <div className="grid grid-cols-8 w-full">
        {receiptItems.map((item, index) => (
          <div
            className={`col-span-8 grid grid-cols-8 items-center gap-x-1 gap-y-3 py-3 pr-3 cursor-pointer ${
              receiptItems[index].isChecked ? "bg-accentlight" : ""
            }`}
            key={index}
            onClick={() => setChecked(index)} // Trigger toggle on row click
          >
            <div className="col-span-1 flex justify-center items-center ">
              <input
                type="checkbox"
                checked={receiptItems[index].isChecked}
                onChange={(e) => e.stopPropagation()} // Prevent row click when clicking on checkbox
                className="w-4 h-4 accent-primary"
              />
            </div>
            <div className="col-span-7 flex justify-start items-center">
              <LineItem
                label={item.name}
                price={parseFloat(item.price)}
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
}

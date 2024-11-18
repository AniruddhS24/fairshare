"use client";

import { useState, useEffect } from "react";
import Text from "@/components/Text";
import SquareButton from "@/components/SquareButton";
import Image from "next/image";
import Spacer from "@/components/Spacer";
import ModifyButton from "@/components/ModifyButton";
import StickyButton from "@/components/StickyButton";
import { useRouter } from "next/navigation";
import SegmentedToggle from "@/components/Toggle";
import { dummyGetReceiptItems } from "../../lib/backend";
import LineItem from "@/components/LineItem";
import ConsumerBreakdown from "@/components/ConsumerBreakdown";
import ItemBreakdown from "@/components/ItemBreakdown";
import { useGlobalContext, Permission } from "@/contexts/GlobalContext";

export default function ConsumerDashboard({
  params,
}: {
  params: { receiptid: string };
}) {
  const { user, invalid_token, getPermission } = useGlobalContext();
  const [selectedTab, setSelectedTab] = useState(0);
  const [receiptItems, setReceiptItems] = useState([]);

  const router = useRouter();

  useEffect(() => {
    if (!user) {
      // set loading
    } else if (invalid_token) {
      router.push(`/user?receiptid=${params.receiptid}&page=adjustments`);
    } else {
      getPermission(params.receiptid).then((permission) => {
        if (permission === Permission.UNAUTHORIZED) {
          router.push(`/unauthorized`);
        }
      });
    }

    setReceiptItems(dummyGetReceiptItems(params.receiptid));
  }, [user, invalid_token]);

  const markSettled = () => {
    alert("TODO");
  };

  return (
    <div className="h-screen w-full">
      <div className="h-full flex flex-col items-start justify-start bg-white px-2 pb-12">
        <Spacer size="large" />
        <Text type="xl_heading" className="text-darkest">
          Payment Breakdown
        </Text>
        <Spacer size="medium" />
        <SegmentedToggle
          tab1label="My Items"
          tab1icon="fa-utensils"
          tab2label="People"
          tab2icon="fa-users"
          selectedTab={selectedTab}
          setSelectedTab={setSelectedTab}
        />
        <Spacer size="large" />
        {selectedTab === 0 ? (
          <div className="w-full">
            <div className="w-full mb-4">
              <ItemBreakdown
                name="2 Fish & Chips Bowl"
                quantity={1}
                price={10.0}
                consumers={["Ishita"]}
              />
            </div>
            <LineItem
              label="Shared Charges"
              price={0}
              labelColor="text-midgray"
              bold
            />
            <Spacer size="medium" />
            <LineItem
              label="Grand Total"
              price={0}
              labelColor="text-primary"
              bold
            />
            <StickyButton
              label="Pay @Aniruddh-Sriram"
              onClick={markSettled}
              sticky
            />
          </div>
        ) : (
          <div className="w-full">
            <div className="w-full mb-4">
              <ConsumerBreakdown
                consumer="John Doe"
                items={[
                  { item: "Item 1", quantity: 2, split: 3, price: 10 },
                  { item: "Item 2", quantity: 1, split: 2, price: 20 },
                ]}
                sharedCost={10}
                isHost
              />
            </div>
            <div className="w-full mb-4">
              <ConsumerBreakdown
                consumer="manas dhal"
                items={[
                  { item: "Item 1", quantity: 2, split: 3, price: 10 },
                  { item: "Item 2", quantity: 1, split: 2, price: 20 },
                ]}
                sharedCost={10}
              />
            </div>
            <StickyButton
              label="Pay @Aniruddh-Sriram"
              onClick={markSettled}
              sticky
            />
          </div>
        )}
      </div>
    </div>
  );
}

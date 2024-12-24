"use client";

import { useState, useEffect } from "react";
import Text from "@/components/Text";
import Spacer from "@/components/Spacer";
import StickyButton from "@/components/StickyButton";
import SegmentedToggle from "@/components/Toggle";
import LineItem from "@/components/LineItem";
import ConsumerBreakdown from "@/components/ConsumerBreakdown";
import ItemBreakdown from "@/components/ItemBreakdown";
import Container from "@/components/Container";
import { useGlobalContext } from "@/contexts/GlobalContext";

export default function ConsumerDashboard({
  params,
}: {
  params: { receiptid: string };
}) {
  const { status } = useGlobalContext();
  const [selectedTab, setSelectedTab] = useState(0);
  // const [receiptItems, setReceiptItems] = useState([]);

  useEffect(() => {
    // if (status === AuthStatus.CHECKING) {
    //   return;
    // } else if (status === AuthStatus.NO_TOKEN) {
    //   router.push(`/user?receiptid=${params.receiptid}&page=adjustments`);
    // } else if (status === AuthStatus.UNAUTHORIZED) {
    //   router.push(`/unauthorized`);
    // } else if (status === AuthStatus.AUTHORIZED) {
    //   getPermission(params.receiptid).then((permission) => {
    //     if (permission === Permission.UNAUTHORIZED) {
    //       router.push(`/unauthorized`);
    //     }
    //   });
    // }
  }, [status, params.receiptid]);

  const markSettled = () => {
    alert("TODO");
  };

  return (
    <div className="h-screen w-full">
      <Container>
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
                  { name: "Item 1", quantity: 2, split: 3, price: 10 },
                  { name: "Item 2", quantity: 1, split: 2, price: 20 },
                ]}
                sharedCost={10}
                isHost
              />
            </div>
            <div className="w-full mb-4">
              <ConsumerBreakdown
                consumer="manas dhal"
                items={[
                  { name: "Item 1", quantity: 2, split: 3, price: 10 },
                  { name: "Item 2", quantity: 1, split: 2, price: 20 },
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
      </Container>
    </div>
  );
}

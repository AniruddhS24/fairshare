"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Spacer from "@/components/Spacer";
import LogoutSection from "@/components/LogoutSection";
import Text from "@/components/Text";
import DynamicSelection from "@/components/DynamicSelection";
import Container from "@/components/Container";
import Spinner from "@/components/Spinner";
import PaymentBreakdown from "@/components/PaymentBreakdown";
import SegmentedToggle from "@/components/Toggle";
import ConsumerBreakdown from "@/components/ConsumerBreakdown";
import LineItem from "@/components/LineItem";
import StickyButton from "@/components/StickyButton";
import useWebSocket from "react-use-websocket";

import {
  useGlobalContext,
  AuthStatus,
  Permission,
} from "@/contexts/GlobalContext";
import {
  Item,
  User,
  Split,
  Receipt,
  getItems,
  getParticipants,
  getSplits,
  getReceipt,
  markAsSettled,
} from "@/lib/backend";

interface HostActionButtonProps {
  icon: string;
  onClick: () => void;
  className?: string;
}

const HostActionButton: React.FC<HostActionButtonProps> = ({
  icon,
  onClick,
  className,
}) => {
  return (
    <button
      onClick={() => onClick()}
      className={`border p-2 rounded-full text-primary w-10 h-10 ${className} `}
    >
      <i className={`fas ${icon}`}></i>
    </button>
  );
};

export default function LiveReceiptPage({
  params,
}: {
  params: { receiptid: string };
}) {
  const { user, status, getPermission } = useGlobalContext();
  const [loading, setLoading] = useState(true);
  const [receipt, setReceipt] = useState<Receipt>({
    id: "",
    image_url: "",
    shared_cost: "",
    grand_total: "",
    settled: false,
  });
  const [receiptItems, setReceiptItems] = useState<{ [key: string]: Item }>({});
  const [users, setUsers] = useState<{ [key: string]: User }>({});
  const [splits, setSplits] = useState<{ [key: string]: Split }>({});
  const [sharedCharges, setSharedCharges] = useState<number>(0.0);
  const [isHost, setIsHost] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  // const [messages, setMessages] = useState<string[]>([]);

  const [isReminderPopupVisible, setIsReminderPopupVisible] = useState(false);
  const [reminderName, setReminderName] = useState("");
  const [isSettledPopupVisible, setIsSettledPopupVisible] = useState(false);
  const [isSettled, setIsSettled] = useState(false);

  const router = useRouter();
  const { lastMessage } = useWebSocket(
    `wss://uh3gy3opd5.execute-api.us-east-1.amazonaws.com/prod?receiptId=${params.receiptid}`
  );

  const refreshSplits = async () => {
    const split_map: { [key: string]: Split } = {};
    const splits = await getSplits(params.receiptid);
    for (const split of splits) {
      split_map[split.id] = split;
    }
    setSplits(split_map);
  };

  // useEffect(() => {
  //   if (!socketRef.current) {
  //     socketRef.current = new WebSocket(
  //       `wss://uh3gy3opd5.execute-api.us-east-1.amazonaws.com/prod?receiptId=${params.receiptid}`
  //     );

  //     socketRef.current.onopen = () => {
  //       alert("Connected");
  //       console.log("Connected to WebSocket");
  //     };

  //     socketRef.current.onmessage = (event) => {
  //       console.log(event.data);
  //       refreshSplits();
  //     };

  //     socketRef.current.onerror = (error) => {
  //       alert("eror");
  //       console.log("WebSocket error:", error);
  //     };

  //     socketRef.current.onclose = () => {
  //       alert("close");
  //       console.log("WebSocket disconnected");
  //     };
  //   }

  //   return () => {
  //     if (
  //       socketRef.current &&
  //       socketRef.current.readyState === WebSocket.OPEN
  //     ) {
  //       socketRef.current.close();
  //       console.log("WebSocket closed");
  //     }
  //   };
  // }, []);

  const fetchData = async () => {
    const receipt = await getReceipt(params.receiptid);
    setReceipt(receipt);
    setIsSettled(receipt.settled);
    const receipt_items = await getItems(params.receiptid);
    const receipt_items_map: { [key: string]: Item } = {};
    for (const item of receipt_items) {
      receipt_items_map[item.id] = item;
    }
    setReceiptItems(receipt_items_map);

    const user_map: { [key: string]: User } = {};
    const users = await getParticipants(params.receiptid);
    for (const user of users.hosts) {
      user_map[user.id] = user;
    }
    for (const user of users.consumers) {
      user_map[user.id] = user;
    }
    setUsers(user_map);
    setSharedCharges(
      parseFloat(receipt.shared_cost) / Object.keys(user_map).length
    );
    await refreshSplits();
  };

  useEffect(() => {
    fetchData();
  }, [lastMessage]);

  useEffect(() => {
    setLoading(true);

    if (status === AuthStatus.CHECKING) {
      return;
    } else if (status === AuthStatus.NO_TOKEN) {
      router.push(`/user?receiptid=${params.receiptid}&page=live`);
    } else if (status === AuthStatus.BAD_TOKEN) {
      router.push(`/user`);
    } else if (status === AuthStatus.AUTHORIZED) {
      getPermission(params.receiptid).then((permission) => {
        if (permission === Permission.HOST) {
          setIsHost(true);
        } else if (permission === Permission.UNAUTHORIZED) {
          router.push(`/unauthorized`);
        }
      });
    }

    fetchData().then(() => setLoading(false));
  }, [status, params.receiptid, router]);

  const shareBreakdown = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "FairShare",
          text: "View your payment breakdown with FairShare",
          url: `https://splitmyreceipt.com/${params.receiptid}/live`,
        });
        console.log("Content shared successfully");
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      alert("Sharing not supported on this browser.");
    }
  };

  const editReceipt = () => {
    router.push(`/${params.receiptid}/editreceipt`);
  };

  const handleReminder = (name: string) => {
    setIsReminderPopupVisible(true);
    setReminderName(name);
  };

  const markSettled = async () => {
    setIsSettledPopupVisible(false);
    setIsSettled(true);
    await markAsSettled(params.receiptid);
  };

  return (
    <div className="h-screen w-full">
      {isReminderPopupVisible && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-[#1C2B35] opacity-20"></div>{" "}
          {/* Blurred Background */}
          <div className="relative z-10 bg-white p-7 rounded-lg shadow-lg w-64 text-center">
            <p className="text-primary text-lg font-bold">Send Reminder</p>
            {/* <p className="text-darkest text-base font-normal">
            Do you want to send {reminderName} a reminder to send your
            payment?
          </p> */}
            <p className="text-darkest text-base font-normal">
              This will send an SMS reminder to {reminderName}, but this feature
              is not currently supported
            </p>
            <div className="mt-5 flex justify-center space-x-4">
              <button
                className="flex-1 px-4 py-2 bg-white text-midgray font-bold border rounded-full"
                onClick={() => setIsReminderPopupVisible(false)}
              >
                Cancel
              </button>
              <button
                className="flex-1 px-4 py-2 bg-primary text-white font-bold rounded-full"
                onClick={() => setIsReminderPopupVisible(false)}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
      {isSettledPopupVisible && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-[#1C2B35] opacity-20"></div>{" "}
          {/* Blurred Background */}
          <div className="relative z-10 bg-white p-7 rounded-lg shadow-lg w-64 text-center">
            <p className="text-primary text-lg font-bold">Mark as Settled</p>
            {/* <p className="text-darkest text-base font-normal">
            Do you want to send {reminderName} a reminder to send your
            payment?
          </p> */}
            <p className="text-darkest text-base font-normal">
              This will mark the receipt as settled, and no further edits can be
              made. Are you sure?
            </p>
            <div className="mt-5 flex justify-center space-x-4">
              <button
                className="flex-1 px-4 py-2 bg-white text-midgray font-bold border rounded-full"
                onClick={() => setIsSettledPopupVisible(false)}
              >
                Cancel
              </button>
              <button
                className="flex-1 px-4 py-2 bg-primary text-white font-bold rounded-full"
                onClick={markSettled}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
      <Container>
        <LogoutSection></LogoutSection>
        <div className="flex items-center">
          <Text type="xl_heading" className="text-darkest">
            Live Receipt
          </Text>
          {isHost ? (
            <div>
              <HostActionButton
                icon="fa-pen"
                onClick={editReceipt}
                className="ms-3"
              />
              <HostActionButton
                icon="fa-arrow-up-from-bracket"
                onClick={shareBreakdown}
                className="ms-3"
              />
            </div>
          ) : null}
        </div>
        <Spacer size="small" />
        <Text type="body" className="text-midgray">
          Tap the portions you consumed. Note your payment breakdown may not be
          finalized until everyone has added their splits.
        </Text>
        {isHost ? (
          <div className="w-full">
            <Spacer size="small" />
            <SegmentedToggle
              tab1label="Receipt"
              tab1icon="fa-receipt"
              tab2label="Breakdown"
              tab2icon="fa-users"
              selectedTab={selectedTab}
              setSelectedTab={setSelectedTab}
            />
          </div>
        ) : null}
        <Spacer size="medium" />
        {!loading ? (
          selectedTab == 0 ? (
            <div className="w-full">
              <PaymentBreakdown
                items={receiptItems}
                splits={splits}
                user_id={user?.id || ""}
                sharedCharges={sharedCharges.toFixed(2)}
              ></PaymentBreakdown>
              <Spacer size="medium" />
              <DynamicSelection
                receipt_id={params.receiptid}
                items={receiptItems}
                users={users}
                splits={splits}
                setSplits={setSplits}
                disabled={isSettled}
              ></DynamicSelection>
              <LineItem
                label="Subtotal"
                price={
                  parseFloat(receipt.grand_total) -
                  parseFloat(receipt.shared_cost)
                }
                labelColor="text-midgray"
                bold
              ></LineItem>
              <LineItem
                label="Shared Charges"
                price={parseFloat(receipt.shared_cost)}
                labelColor="text-midgray"
                bold
              ></LineItem>
              <LineItem
                label="Grand Total"
                price={parseFloat(receipt.grand_total)}
                labelColor="text-primary"
                bold
              ></LineItem>
              {isHost && !isSettled ? (
                <StickyButton
                  label="Mark as Settled"
                  onClick={() => {
                    setIsSettledPopupVisible(true);
                  }}
                  sticky
                />
              ) : isHost ? (
                <StickyButton
                  label="Share Payment Breakdown"
                  onClick={shareBreakdown}
                  sticky
                />
              ) : null}
            </div>
          ) : (
            <div className="w-full">
              {Object.values(users).map((item, index) => (
                <ConsumerBreakdown
                  key={index}
                  items={receiptItems}
                  splits={splits}
                  user_id={item?.id || ""}
                  user_name={item?.name || ""}
                  sharedCharges={sharedCharges.toFixed(2)}
                  isHost={item?.id == user?.id}
                  handleReminder={handleReminder}
                />
              ))}
              <LineItem
                label="Subtotal"
                price={
                  parseFloat(receipt.grand_total) -
                  parseFloat(receipt.shared_cost)
                }
                labelColor="text-midgray"
                bold
              ></LineItem>
              <LineItem
                label="Shared Charges"
                price={parseFloat(receipt.shared_cost)}
                labelColor="text-midgray"
                bold
              ></LineItem>
              <LineItem
                label="Grand Total"
                price={parseFloat(receipt.grand_total)}
                labelColor="text-primary"
                bold
              ></LineItem>
            </div>
          )
        ) : (
          <div className="flex w-full items-center justify-center">
            <Spinner color="text-primary" />
          </div>
        )}
      </Container>
    </div>
  );
}

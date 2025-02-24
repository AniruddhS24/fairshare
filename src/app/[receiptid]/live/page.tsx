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

const UnclaimedItemsBanner: React.FC<{
  setRemindAll: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({ setRemindAll }) => {
  return (
    <div className="w-full flex justify-center items-center bg-red-200 text-red-700 rounded-md p-2 mb-4">
      <i className={"fas fa-circle-exclamation mr-1 text-red-700"}></i>
      There are still unclaimed items.{" "}
      <button
        className="font-bold text-primary focus:outline-none ms-1"
        onClick={() => setRemindAll(true)}
      >
        Remind all?
      </button>
    </div>
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
    shared_cost: "0.00",
    grand_total: "0.00",
    settled: false,
    addl_gratuity: "0.00",
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
  const [isRemindAllPopupVisible, setIsRemindAllPopupVisible] = useState(false);
  const [unclaimedItems, setUnclaimedItems] = useState(false);

  const router = useRouter();
  const [wsUrl, setWsUrl] = useState<string>(
    "wss://epccxqhta9.execute-api.us-east-1.amazonaws.com/prod"
  );

  const refreshSplits = async () => {
    const split_map: { [key: string]: Split } = {};
    const splits = await getSplits(params.receiptid);
    for (const split of splits) {
      split_map[split.id] = split;
    }
    setSplits(split_map);
  };

  const fetchData = async () => {
    const [receipt, receipt_items, users] = await Promise.all([
      getReceipt(params.receiptid),
      getItems(params.receiptid),
      getParticipants(params.receiptid),
    ]);

    setReceipt(receipt);
    setIsSettled(receipt.settled);

    const receipt_items_map = receipt_items.reduce((acc, item) => {
      acc[item.id] = item;
      return acc;
    }, {} as { [key: string]: Item });
    setReceiptItems(receipt_items_map);

    const user_map = [...users.hosts, ...users.consumers].reduce(
      (acc, user) => {
        acc[user.id] = user;
        return acc;
      },
      {} as { [key: string]: User }
    );
    setUsers(user_map);

    const userCount = Object.keys(user_map).length || 1;
    setSharedCharges(
      (parseFloat(receipt.shared_cost) + parseFloat(receipt.addl_gratuity)) /
        userCount
    );
    refreshSplits();
  };

  const { readyState, lastMessage } = useWebSocket(wsUrl, {
    onOpen: () => console.log("Connection opened"),
    shouldReconnect: () => true,
  });

  useEffect(() => {
    console.log("Message received, refreshing...");
    fetchData();
  }, [readyState, lastMessage]);

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
        setWsUrl(
          `wss://epccxqhta9.execute-api.us-east-1.amazonaws.com/prod?receiptId=${params.receiptid}&userId=${user?.id}`
        );
      });
    }

    fetchData().then(() => setLoading(false));
  }, [status, params.receiptid, router]);

  const shareReceipt = async (onboarding: boolean) => {
    const url = onboarding
      ? `https://splitmyreceipt.com/user?receiptid=${params.receiptid}&onboardConsumer=true`
      : `https://splitmyreceipt.com/${params.receiptid}/live`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "FairShare",
          text: "Split your receipt with FairShare",
          url: url,
        });
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

  const trySettleReceipt = () => {
    const splits_on_items: { [key: string]: { [key: string]: boolean } } = {};
    for (const split of Object.values(splits)) {
      if (!(split.item_id in splits_on_items))
        splits_on_items[split.item_id] = {};
      splits_on_items[split.item_id][split.split_id] = true;
    }
    let is_complete = true;
    for (const item_id of Object.keys(receiptItems)) {
      if (
        !(item_id in splits_on_items) ||
        Object.keys(splits_on_items[item_id]).length !=
          parseInt(receiptItems[item_id].quantity)
      )
        is_complete = false;
    }
    if (Object.keys(splits_on_items).length == 0 || !is_complete)
      setUnclaimedItems(true);
    else setIsSettledPopupVisible(true);
  };

  const markSettled = async () => {
    setIsSettledPopupVisible(false);
    setIsSettled(true);
    await markAsSettled(params.receiptid);
  };

  const claimedItemTotal = () => {
    let total = 0;
    for (const split of Object.values(splits)) {
      if (split.item_id in receiptItems)
        total += parseFloat(receiptItems[split.item_id].price);
    }
    return total;
  };

  return (
    <div className="h-screen w-full">
      {isReminderPopupVisible && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-[#1C2B35] opacity-20"></div>{" "}
          <div className="relative z-10 bg-white p-7 rounded-lg shadow-lg w-64 text-center">
            <p className="text-primary text-lg font-bold">Send Reminder</p>
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
      {isRemindAllPopupVisible && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-[#1C2B35] opacity-20"></div>{" "}
          <div className="relative z-10 bg-white p-7 rounded-lg shadow-lg w-64 text-center">
            <p className="text-primary text-lg font-bold">Send Reminder</p>
            <p className="text-darkest text-base font-normal">
              Would you like to send SMS reminders to all users to check their
              splits?
            </p>
            <div className="mt-5 flex justify-center space-x-4">
              <button
                className="flex-1 px-4 py-2 bg-white text-midgray font-bold border rounded-full"
                onClick={() => setIsRemindAllPopupVisible(false)}
              >
                Cancel
              </button>
              <button
                className="flex-1 px-4 py-2 bg-primary text-white font-bold rounded-full"
                onClick={() => setIsRemindAllPopupVisible(false)}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
      <Container>
        <LogoutSection></LogoutSection>
        {unclaimedItems ? (
          <UnclaimedItemsBanner setRemindAll={setIsRemindAllPopupVisible} />
        ) : null}
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
                onClick={() => shareReceipt(true)}
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
            <Spacer size="medium" />
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
                sharedCharges={isSettled ? sharedCharges.toFixed(2) : null}
              ></PaymentBreakdown>
              <Spacer size="medium" />
              <DynamicSelection
                receipt_id={params.receiptid}
                items={receiptItems}
                users={users}
                splits={splits}
                setSplits={setSplits}
                disabled={isSettled}
                unclaimedItems={unclaimedItems}
                setUnclaimedItems={setUnclaimedItems}
              ></DynamicSelection>
              <LineItem
                label="Subtotal"
                price={
                  parseFloat(receipt.grand_total) -
                  parseFloat(receipt.shared_cost) -
                  parseFloat(receipt.addl_gratuity)
                }
                labelColor="text-midgray"
                bold
              ></LineItem>
              <LineItem
                label="Tax + Other Fees"
                price={parseFloat(receipt.shared_cost)}
                labelColor="text-midgray"
                bold
              ></LineItem>
              {parseFloat(receipt.addl_gratuity) != 0 ? (
                <LineItem
                  label="Tip"
                  price={parseFloat(receipt.addl_gratuity)}
                  labelColor="text-midgray"
                  bold
                ></LineItem>
              ) : null}
              <LineItem
                label="Grand Total"
                price={parseFloat(receipt.grand_total)}
                labelColor="text-primary"
                bold
              ></LineItem>
              {isHost && !isSettled ? (
                <StickyButton
                  label="Mark as Settled"
                  onClick={trySettleReceipt}
                  sticky
                />
              ) : isHost ? (
                <StickyButton
                  label="Share Payment Breakdown"
                  onClick={() => shareReceipt(false)}
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
                  sharedCharges={isSettled ? sharedCharges.toFixed(2) : null}
                  isHost={item?.id == user?.id}
                  handleReminder={handleReminder}
                />
              ))}
              <LineItem
                label="Shared Charges"
                price={
                  parseFloat(receipt.shared_cost) +
                  parseFloat(receipt.addl_gratuity)
                }
                labelColor="text-midgray"
                bold
              ></LineItem>
              <LineItem
                label="Current Total"
                price={claimedItemTotal() + parseFloat(receipt.shared_cost)}
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

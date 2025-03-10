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
import { Banner, BannerProps } from "@/components/Banner";
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
  backend,
  createSplit,
  deleteSplit,
} from "@/lib/backend";

interface HostActionButtonProps {
  icon: string;
  onClick: () => void;
  disabled: boolean;
  className?: string;
}

const HostActionButton: React.FC<HostActionButtonProps> = ({
  icon,
  onClick,
  className,
  disabled = false,
}) => {
  return (
    <button
      onClick={() => onClick()}
      className={`border p-2 rounded-full text-primary w-10 h-10 ${className} `}
      disabled={disabled}
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
    shared_cost: "0.00",
    grand_total: "0.00",
    settled: false,
    addl_gratuity: "0.00",
    item_counter: 0,
  });
  const [receiptItems, setReceiptItems] = useState<{ [key: string]: Item }>({});
  const [users, setUsers] = useState<{ [key: string]: User }>({});
  const [splits, setSplits] = useState<{ [key: string]: Split }>({});
  const [sharedCharges, setSharedCharges] = useState<number>(0.0);

  const [pendingAdditions, setPendingAdditions] = useState<{
    [key: string]: Split;
  }>({});
  const [pendingDeletions, setPendingDeletions] = useState<{
    [key: string]: boolean;
  }>({});

  const [isHost, setIsHost] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  // const [messages, setMessages] = useState<string[]>([]);

  const [isReminderPopupVisible, setIsReminderPopupVisible] = useState(false);
  const [reminderName, setReminderName] = useState("");
  const [isSettledPopupVisible, setIsSettledPopupVisible] = useState(false);
  const [isSettled, setIsSettled] = useState(false);
  const [isRemindAllPopupVisible, setIsRemindAllPopupVisible] = useState(false);
  const [unclaimedItems, setUnclaimedItems] = useState(true);

  const [myTotal, setMyTotal] = useState<number>(0.0);

  const [banner, setBanner] = useState<BannerProps | null>(null);

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
    const [receipt, receipt_items, receipt_splits, users] = await Promise.all([
      getReceipt(params.receiptid),
      getItems(params.receiptid),
      getSplits(params.receiptid),
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

    const split_map = receipt_splits.reduce((acc, item) => {
      acc[item.id] = item;
      return acc;
    }, {} as { [key: string]: Split });
    setSplits(split_map);

    const userCount = Object.keys(user_map).length || 1;
    setSharedCharges(
      (parseFloat(receipt.shared_cost) + parseFloat(receipt.addl_gratuity)) /
        userCount
    );

    const splits_on_items: { [key: string]: { [key: string]: boolean } } = {};
    for (const split of Object.values(split_map)) {
      if (!(split.item_id in splits_on_items))
        splits_on_items[split.item_id] = {};
      splits_on_items[split.item_id][split.split_id] = true;
    }
    let is_complete = true;
    for (const item_id of Object.keys(receipt_items_map)) {
      if (
        !(item_id in splits_on_items) ||
        Object.keys(splits_on_items[item_id]).length !=
          parseInt(receipt_items_map[item_id].quantity)
      )
        is_complete = false;
    }
    if (Object.keys(splits_on_items).length == 0 || !is_complete)
      setUnclaimedItems(true);
    else {
      setUnclaimedItems(false);
    }
  };

  const { readyState, lastMessage } = useWebSocket(wsUrl, {
    onOpen: () => console.log("Connection opened"),
    shouldReconnect: () => true,
  });

  useEffect(() => {
    // alert(lastMessage);
    console.log("Message received, refreshing...");
    fetchData();
  }, [lastMessage, readyState]);

  const mergedSplits = [
    ...Object.values(splits),
    ...Object.values(pendingAdditions),
  ].filter((split) => !pendingDeletions[split.id]);

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
      ? `https://tabify.live/user?receiptid=${params.receiptid}&onboardConsumer=true`
      : `https://tabify.live/${params.receiptid}/live`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Tabify",
          text: "Split your receipt with Tabify",
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

  const saveEdits = async () => {
    const promises = [];
    let all_success = true;
    for (const key in pendingDeletions) {
      promises.push(deleteSplit(params.receiptid, key));
    }
    for (const promise of promises) {
      try {
        await promise;
      } catch {
        all_success = false;
      }
    }
    for (const key in pendingAdditions) {
      promises.push(
        createSplit(
          params.receiptid,
          pendingAdditions[key].item_id,
          pendingAdditions[key].split_id
        )
      );
    }
    for (const promise of promises) {
      try {
        await promise;
      } catch {
        all_success = false;
      }
    }
    refreshSplits();
    setPendingAdditions({});
    setPendingDeletions({});
    if (all_success) {
      setBanner({
        label: "Successfully saved changes!",
        icon: "fa-check",
        type: "success",
      });
    } else {
      setBanner({
        label: "Could not add some splits, please check!",
        icon: "fa-xmark",
        type: "error",
      });
    }
  };

  const markSettled = async () => {
    setBanner(null);
    setIsSettledPopupVisible(false);
    setIsSettled(true);
    await markAsSettled(params.receiptid);
    await backend("GET", `/receipt/${params.receiptid}/refresh`);
  };

  const sendToVenmo = () => {
    // Go to Venmo and fill price to pay with
    const amount = myTotal;
    const note = "Tabify restaurant split";
    const venmoURI = `venmo://paycharge?txn=pay&amount=${amount}&audience=private&note=${note}`;

    // Open the Venmo app (if installed) or the web page
    window.location.href = venmoURI;
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
        {isHost && !unclaimedItems && !isSettled ? (
          <Banner
            label="Settle receipt to finalize payments!"
            icon="fa-check"
            type="success"
          />
        ) : null}
        {banner ? (
          <Banner label={banner.label} icon={banner.icon} type={banner.type} />
        ) : null}
        <div className="flex items-center">
          <Text type="xl_heading" className="text-darkest">
            Live Receipt
          </Text>
          {isHost && !isSettled ? (
            <div>
              <HostActionButton
                icon="fa-pen"
                onClick={editReceipt}
                className="ms-3"
                disabled={isSettled}
              />
              {!unclaimedItems ? (
                <HostActionButton
                  icon="fa-arrow-up-from-bracket"
                  onClick={() => shareReceipt(true)}
                  className="ms-3"
                  disabled={isSettled}
                />
              ) : null}
            </div>
          ) : null}
        </div>
        <Spacer size="small" />
        {isSettled ? (
          <Text type="body" className="text-midgray">
            Receipt has been finalized.
          </Text>
        ) : isHost ? (
          <Text type="body" className="text-midgray">
            Tap the portions you consumed and share receipt link with other
            consumers. Payment will{" "}
            <span className="text-error font-semibold">not be finalized</span>{" "}
            until all portions are claimed.
          </Text>
        ) : (
          <Text type="body" className="text-midgray">
            Tap the portions you consumed. Only pay the host{" "}
            <span className="text-error font-semibold">
              after they have finalized payment.
            </span>
          </Text>
        )}
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
            <div className="w-full pb-20">
              <PaymentBreakdown
                items={receiptItems}
                splits={mergedSplits}
                user_id={user?.id || ""}
                sharedCharges={isSettled ? sharedCharges.toFixed(2) : null}
                total={myTotal}
                setTotal={setMyTotal}
                isSettled={isSettled}
              ></PaymentBreakdown>
              <Spacer size="medium" />
              <DynamicSelection
                receipt_id={params.receiptid}
                items={receiptItems}
                users={users}
                splits={splits}
                pendingAdds={pendingAdditions}
                setPendingAdditions={setPendingAdditions}
                pendingDeletions={pendingDeletions}
                setPendingDeletions={setPendingDeletions}
                disabled={isSettled}
                onSplitChange={() => {
                  setBanner(null);
                }}
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
              {Object.keys(pendingAdditions).length > 0 ||
              Object.keys(pendingDeletions).length > 0 ? (
                <StickyButton
                  label="Save changes"
                  icon="fa-floppy-disk"
                  onClick={saveEdits}
                  sticky
                  secondary
                />
              ) : isHost && !unclaimedItems && !isSettled ? (
                <StickyButton
                  label="Finalize Payment"
                  onClick={() => setIsSettledPopupVisible(true)}
                  sticky
                />
              ) : isHost && !isSettled ? (
                <StickyButton
                  label="Share Receipt Link"
                  icon="fa-arrow-up-from-bracket"
                  onClick={() => shareReceipt(true)}
                  sticky
                />
              ) : !isHost && isSettled ? (
                <StickyButton
                  label="Pay Host"
                  icon="venmo"
                  onClick={sendToVenmo}
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
                  splits={mergedSplits}
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

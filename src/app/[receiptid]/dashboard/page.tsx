"use client";

import { useState, useEffect } from "react";
import LogoutSection from "@/components/LogoutSection";
import Text from "@/components/Text";
import Spacer from "@/components/Spacer";
import StickyButton from "@/components/StickyButton";
import { useRouter } from "next/navigation";
import SegmentedToggle from "@/components/Toggle";
import LineItem from "@/components/LineItem";
import ConsumerBreakdown from "@/components/ConsumerBreakdown";
import ItemBreakdown from "@/components/ItemBreakdown";
import Container from "@/components/Container";
import Spinner from "@/components/Spinner";
import {
  useGlobalContext,
  AuthStatus,
  Permission,
} from "@/contexts/GlobalContext";
import {
  getParticipants,
  getReceipt,
  getItems,
  getSplits,
  User,
  markAsSettled,
} from "@/lib/backend";

interface ReceiptItem {
  id: string;
  name: string;
  quantity: string;
  price: string;
  consumers: string[];
}

interface ConsumerItem {
  name: string;
  items: {
    name: string;
    quantity: number;
    split: number;
    price: number;
  }[];
  host: boolean;
}

export default function Dashboard({
  params,
}: {
  params: { receiptid: string };
}) {
  const { status, getPermission, user } = useGlobalContext();
  const [selectedTab, setSelectedTab] = useState(0);
  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([]);
  const [myItems, setMyItems] = useState<{
    [key: string]: { [key: string]: number };
  }>({});
  const [myTotal, setMyTotal] = useState(0.0);
  const [consumerItems, setConsumerItems] = useState<ConsumerItem[]>([]);
  const [numConsumers, setNumConsumers] = useState(0);
  const [sharedCost, setSharedCost] = useState<string>("0.0");
  const [totalCost, setTotalCost] = useState(0.0);
  const [isReminderPopupVisible, setIsReminderPopupVisible] = useState(false);
  const [reminderName, setReminderName] = useState("");
  const [loading, setLoading] = useState(true);
  const [isHost, setIsHost] = useState(false);
  const [isSettledPopupVisible, setIsSettledPopupVisible] = useState(false);
  const [isSettled, setIsSettled] = useState(false);

  const router = useRouter();
  const receipt_id = params.receiptid;

  useEffect(() => {
    setLoading(true);

    if (status === AuthStatus.CHECKING) {
      return;
    } else if (status === AuthStatus.NO_TOKEN) {
      router.push(`/user?receiptid=${receipt_id}&page=dashboard`);
    } else if (status === AuthStatus.BAD_TOKEN) {
      router.push(`/user`);
    } else if (status === AuthStatus.AUTHORIZED) {
      getPermission(receipt_id).then((permission) => {
        if (permission === Permission.HOST) {
          setIsHost(true);
        } else if (permission === Permission.UNAUTHORIZED) {
          router.push(`/unauthorized`);
        }
      });
    }

    const fetchReceipt = async () => {
      return await getReceipt(receipt_id);
    };

    const fetchUsers = async () => {
      const participants = await getParticipants(receipt_id);
      const users: { [key: string]: User & { host: boolean } } = {};
      for (const user of participants.hosts) {
        users[user.id] = { ...user, host: true };
      }
      for (const user of participants.consumers) {
        users[user.id] = { ...user, host: false };
      }
      return users;
    };

    const fetchItems = async () => {
      return await getItems(receipt_id);
    };

    const fetchSplits = async () => {
      const receipt_splits = await getSplits(receipt_id);
      const splits = [];
      for (const split of receipt_splits) {
        splits.push(split);
      }
      return splits;
    };

    const fetchData = async () => {
      const [receipt, user_map, splits, items] = await Promise.all([
        fetchReceipt(),
        fetchUsers(),
        fetchSplits(),
        fetchItems(),
      ]);

      setIsSettled(receipt.settled);

      const receipt_items: {
        [key: string]: ReceiptItem;
      } = {};
      const consumer_items: {
        [key: string]: ConsumerItem;
      } = {};
      let total_cost = 0.0;

      for (const item of items) {
        total_cost += parseInt(item.quantity) * parseFloat(item.price);
        receipt_items[item.id] = {
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          consumers: [],
        };
      }

      for (const user_id in user_map) {
        consumer_items[user_id] = {
          name: user_map[user_id].name,
          items: [],
          host: user_map[user_id].host,
        };
      }
      const automatic_split: { [key: string]: number } = {};
      for (const split of splits) {
        if (
          automatic_split.hasOwnProperty(split.item_id) &&
          split.split == "0"
        ) {
          automatic_split[split.item_id] += 1;
        } else if (split.split == "0") {
          automatic_split[split.item_id] = 1;
        }
      }
      for (const item_id in receipt_items) {
        if (!automatic_split.hasOwnProperty(item_id)) {
          automatic_split[item_id] = Object.keys(user_map).length;
        }
      }

      const my_items: { [key: string]: { [key: string]: number } } = {};
      let my_total = 0.0;
      for (const split of splits) {
        const split_amount =
          split.split == "0"
            ? automatic_split[split.item_id].toString()
            : split.split;
        if (split.user_id == user?.id) {
          if (!my_items.hasOwnProperty(split.item_id)) {
            my_items[split.item_id] = { quantity: 0, split: 0 };
          }
          my_items[split.item_id].quantity = parseInt(split.quantity);
          my_items[split.item_id].split = parseInt(split_amount);
          my_total +=
            (parseInt(split.quantity) *
              parseFloat(receipt_items[split.item_id].price)) /
            parseInt(split_amount);
        }
        receipt_items[split.item_id].consumers.push(
          user_map[split.user_id].name
        );
        consumer_items[split.user_id].items.push({
          name: receipt_items[split.item_id].name,
          quantity: parseInt(split.quantity),
          split: parseInt(split_amount),
          price: parseFloat(receipt_items[split.item_id].price),
        });
      }

      setMyItems(my_items);
      setMyTotal(
        my_total +
          parseFloat(receipt.shared_cost) / Object.keys(user_map).length
      );
      setReceiptItems(Object.values(receipt_items));
      setConsumerItems(Object.values(consumer_items));
      setSharedCost(receipt.shared_cost);
      setNumConsumers(Object.keys(user_map).length);
      setTotalCost(total_cost + parseFloat(receipt.shared_cost));
    };

    fetchData().then(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, receipt_id]);

  const markSettled = async () => {
    setIsSettledPopupVisible(false);
    setIsSettled(true);
    await markAsSettled(receipt_id);
  };

  const shareBreakdown = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "FairShare",
          text: "View your payment breakdown with FairShare",
          url: `https://splitmyreceipt.com/${receipt_id}/dashboard`,
        });
        console.log("Content shared successfully");
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      alert("Sharing not supported on this browser.");
    }
  };

  const handleReminder = (name: string) => {
    setIsReminderPopupVisible(true);
    setReminderName(name);
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
        <Text type="xl_heading" className="text-darkest">
          Payment Breakdown
        </Text>
        <Spacer size="small" />
        {isHost ? (
          <Text type="body" className="text-midgray">
            Share the receipt link with your group, view what they owe, and send
            payment reminders!
          </Text>
        ) : (
          <Text type="body" className="text-midgray">
            View your payment breakdown and pay the host.
          </Text>
        )}
        <Spacer size="medium" />
        <SegmentedToggle
          tab1label="Items"
          tab1icon="fa-utensils"
          tab2label="People"
          tab2icon="fa-users"
          selectedTab={selectedTab}
          setSelectedTab={setSelectedTab}
        />
        <Spacer size="large" />
        {!loading ? (
          selectedTab === 0 ? (
            isHost ? (
              <div className="w-full">
                {receiptItems.map((item, index) => (
                  <div key={index} className="w-full mb-4">
                    <ItemBreakdown
                      name={item.name}
                      quantity={parseInt(item.quantity)}
                      price={parseFloat(item.price)}
                      consumers={item.consumers}
                    />
                  </div>
                ))}
                <LineItem
                  label="Shared Charges"
                  price={parseFloat(sharedCost)}
                  labelColor="text-primary"
                  bold
                />
                <Spacer size="small" />
                <LineItem
                  label="Grand Total"
                  price={totalCost}
                  labelColor="text-primary"
                  bold
                />
                {!isSettled ? (
                  <StickyButton
                    label="Mark as Settled"
                    onClick={() => {
                      setIsSettledPopupVisible(true);
                    }}
                    sticky
                  />
                ) : (
                  <StickyButton
                    label="Share Payment Breakdown"
                    onClick={shareBreakdown}
                    sticky
                  />
                )}
              </div>
            ) : (
              <div className="w-full">
                {receiptItems
                  .filter((item) => item.id in myItems)
                  .map((item, index) => (
                    <div key={index} className="w-full mb-4">
                      <ItemBreakdown
                        name={item.name}
                        quantity={parseInt(item.quantity)}
                        price={parseFloat(item.price)}
                        consumers={item.consumers}
                        override_price={
                          (myItems[item.id].quantity * parseFloat(item.price)) /
                          myItems[item.id].split
                        }
                      />
                    </div>
                  ))}
                <LineItem
                  label="My Shared Charges"
                  price={parseFloat(sharedCost) / numConsumers}
                  labelColor="text-primary"
                  bold
                />
                <Spacer size="small" />
                <LineItem
                  label="My Total"
                  price={myTotal}
                  labelColor="text-primary"
                  bold
                />
                {/* <StickyButton
                  label="Venmo Host"
                  onClick={markSettled}
                  sticky
                /> */}
              </div>
            )
          ) : (
            <div className="w-full">
              {consumerItems.map((item, index) =>
                item.host ? (
                  <div key={index}>
                    <ConsumerBreakdown
                      consumer={item.name}
                      items={item.items}
                      sharedCost={parseFloat(sharedCost) / numConsumers}
                      isHost
                    />
                  </div>
                ) : (
                  <div
                    className="col-span-10 grid grid-cols-10 items-start gap-y-3 mt-3"
                    key={index}
                  >
                    {isHost ? (
                      <>
                        <div className="col-span-1 flex justify-start items-center">
                          <button
                            className="duration-150 ease-in-out active:scale-95"
                            onClick={() => handleReminder(item.name)}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="32"
                              height="32"
                              viewBox="0 0 32 32"
                              fill="none"
                            >
                              <rect
                                width="32"
                                height="32"
                                rx="16"
                                fill="#087A87"
                              />
                              <path
                                d="M21.7477 18.3564C21.6959 18.2894 21.645 18.2224 21.595 18.1578C20.9081 17.2669 20.4925 16.7291 20.4925 14.2069C20.4925 12.9011 20.2012 11.8297 19.627 11.0261C19.2036 10.4325 18.6313 9.98214 17.8769 9.64933C17.8672 9.64354 17.8586 9.63594 17.8513 9.6269C17.58 8.65257 16.8375 8 16.0001 8C15.1627 8 14.4205 8.65257 14.1491 9.62589C14.1419 9.63462 14.1334 9.64198 14.1238 9.64766C12.3635 10.4248 11.5079 11.9157 11.5079 14.2059C11.5079 16.7291 11.093 17.2669 10.4054 18.1568C10.3555 18.2214 10.3046 18.2871 10.2527 18.3554C10.1189 18.5285 10.034 18.7392 10.0083 18.9624C9.98256 19.1856 10.017 19.4121 10.1075 19.615C10.3002 20.0502 10.7108 20.3204 11.1795 20.3204H20.8241C21.2906 20.3204 21.6984 20.0506 21.8917 19.6173C21.9826 19.4144 22.0174 19.1877 21.9919 18.9642C21.9664 18.7407 21.8816 18.5298 21.7477 18.3564ZM16.0001 23C16.4513 22.9996 16.894 22.8683 17.2812 22.6199C17.6684 22.3716 17.9857 22.0155 18.1995 21.5894C18.2095 21.569 18.2145 21.5461 18.2139 21.523C18.2133 21.4999 18.2071 21.4774 18.196 21.4576C18.1849 21.4378 18.1692 21.4215 18.1504 21.4101C18.1317 21.3988 18.1105 21.3928 18.0889 21.3929H13.9118C13.8903 21.3928 13.8691 21.3987 13.8502 21.41C13.8314 21.4213 13.8157 21.4377 13.8045 21.4575C13.7934 21.4773 13.7872 21.4998 13.7866 21.5229C13.7859 21.5461 13.7909 21.569 13.801 21.5894C14.0147 22.0154 14.332 22.3715 14.7192 22.6198C15.1063 22.8682 15.5489 22.9995 16.0001 23Z"
                                fill="white"
                              />
                            </svg>
                          </button>
                        </div>
                        <div className="col-span-9 flex justify-center items-center">
                          <ConsumerBreakdown
                            consumer={item.name}
                            items={item.items}
                            sharedCost={parseFloat(sharedCost) / numConsumers}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="col-span-10 flex justify-center items-center">
                        <ConsumerBreakdown
                          consumer={item.name}
                          items={item.items}
                          sharedCost={parseFloat(sharedCost) / numConsumers}
                        />
                      </div>
                    )}
                  </div>
                )
              )}
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

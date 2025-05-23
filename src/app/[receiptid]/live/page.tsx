"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Spacer from "@/components/Spacer";
import Text from "@/components/Text";
import DynamicSelection from "@/components/DynamicSelection";
import Container from "@/components/Container";
import Spinner from "@/components/Spinner";
import PaymentBreakdown from "@/components/PaymentBreakdown";
import SegmentedToggle from "@/components/Toggle";
import ConsumerBreakdown from "@/components/ConsumerBreakdown";
import LineItem from "@/components/LineItem";
import StickyButton from "@/components/StickyButton";
import ModifyButton from "@/components/ModifyButton";
import TextInput from "@/components/TextInput";
import useWebSocket from "react-use-websocket";
import { Banner, BannerProps } from "@/components/Banner";
import { QRCodeCanvas } from "qrcode.react";

import {
  useGlobalContext,
  AuthStatus,
  Permission,
} from "@/contexts/GlobalContext";
import {
  Item,
  User,
  Split,
  getItems,
  getParticipants,
  getSplits,
  getReceipt,
  markAsSettled,
  backend,
  createSplit,
  deleteSplit,
  markRoleDone,
  hostCreateUser,
  hostDeleteUser,
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
  const { user, status, getRole, receipt, setReceipt, role, setRole } =
    useGlobalContext();
  const [loading, setLoading] = useState(true);
  // const [receipt, setReceipt] = useState<Receipt>({
  //   id: "",
  //   image_url: "",
  //   shared_cost: "0.00",
  //   grand_total: "0.00",
  //   settled: false,
  //   addl_gratuity: "0.00",
  //   item_counter: 0,
  // });
  const [receiptItems, setReceiptItems] = useState<{ [key: string]: Item }>({});
  const [users, setUsers] = useState<{ [key: string]: User }>({});
  const [isCreatePersonPopupVisible, setIsCreatePersonPopupVisible] =
    useState(false);
  const [isDeletePersonPopupVisible, setIsDeletePersonPopupVisible] =
    useState(false);
  const [newPersonName, setNewPersonName] = useState("");
  const [hostEditingUser, setHostEditingUser] = useState<string | null>(
    user?.id || null
  );
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
  const [unclaimedItems, setUnclaimedItems] = useState(true);

  const [banner, setBanner] = useState<BannerProps | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isQRCode, setIsQRCode] = useState<boolean>(false);

  const router = useRouter();
  const [wsUrl, setWsUrl] = useState<string>(
    "wss://tx3jw6v7dj.execute-api.us-east-1.amazonaws.com/prod"
  );

  const cleanKey = (key: string) => {
    const parts = key.split("_");
    return `${parts[0]}_${parts[1].replace("temp", "")}_${parts[2]}`;
  };

  const fetchData = async () => {
    const [_receipt, receipt_items, receipt_splits, users] = await Promise.all([
      receipt || getReceipt(params.receiptid),
      getItems(params.receiptid),
      getSplits(params.receiptid),
      getParticipants(params.receiptid),
    ]);
    setReceipt(_receipt);
    setIsSettled(_receipt.settled);

    const receipt_items_map = receipt_items.reduce((acc, item) => {
      acc[item.id] = item;
      return acc;
    }, {} as { [key: string]: Item });
    setReceiptItems(receipt_items_map);

    const split_map = receipt_splits.reduce((acc, item) => {
      if (
        item.item_id in receipt_items_map &&
        !receipt_items_map[item.item_id].global_split
      )
        acc[item.id] = item;
      return acc;
    }, {} as { [key: string]: Split });
    setSplits(split_map);

    setPendingAdditions((prev) => {
      const newAdds = { ...prev };
      for (const key in newAdds) {
        if (cleanKey(key) in split_map) delete newAdds[key];
      }
      return newAdds;
    });

    setPendingDeletions((prev) => {
      const newDeletions = { ...prev };
      for (const key in newDeletions) {
        if (!(cleanKey(key) in split_map)) delete newDeletions[key];
      }
      return newDeletions;
    });

    const user_map = [...users.hosts, ...users.consumers].reduce(
      (acc, user) => {
        acc[user.id] = user;
        return acc;
      },
      {} as { [key: string]: User }
    );
    setUsers(user_map);

    const unique_users = new Set(receipt_splits.map((split) => split.user_id));
    const userCount = unique_users.size;

    setSharedCharges(
      parseFloat(_receipt.shared_cost) + parseFloat(_receipt.addl_gratuity)
    );

    const splits_on_items: { [key: string]: { [key: string]: boolean } } = {};
    for (const split of Object.values(split_map)) {
      if (!(split.item_id in splits_on_items))
        splits_on_items[split.item_id] = {};
      splits_on_items[split.item_id][split.split_id] = true;
    }
    let is_complete = true;
    for (const item_id in receipt_items_map) {
      if (receipt_items_map[item_id].global_split) continue;
      if (
        !(item_id in splits_on_items) ||
        Object.keys(splits_on_items[item_id]).length !=
          parseInt(receipt_items_map[item_id].quantity)
      )
        is_complete = false;
    }
    if (
      Object.keys(splits_on_items).length == 0 ||
      !is_complete ||
      userCount < _receipt.consumers
    )
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
    if (lastMessage) {
      console.log(
        `New message received: ${lastMessage.data}. Refreshing data...`
      );
    } else {
      console.log(
        `Connection state changed: ${readyState}. Checking status...`
      );
    }
    fetchData();
  }, [lastMessage, readyState]);

  const mergedSplits = [
    ...Object.values(splits),
    ...Object.values(pendingAdditions),
  ].filter((split) => !pendingDeletions[split.id]);

  const remainingUsers = () => {
    return (receipt?.consumers || 0) - Object.keys(users).length;
  };

  const individualTotal = (user_id: string) => {
    const split_counts: { [key: string]: number } = {};
    const my_items: { [key: string]: { name: string; price: string } } = {};
    const items = receiptItems;
    const consumers = receipt?.consumers || 1;
    const splits = mergedSplits;

    for (const id in items) {
      if (items[id].global_split)
        my_items[`${id}_0`] = {
          name: `${items[id].quantity} ${items[id].name} / ${consumers}`,
          price: (parseFloat(items[id].price) / consumers).toFixed(2),
        };
    }
    if (!user_id) return my_items;
    for (const split of splits) {
      const split_key = `${split.item_id}_${split.split_id}`;
      if (split_key in split_counts) {
        split_counts[split_key] += 1;
      } else {
        split_counts[split_key] = 1;
      }
    }
    for (const split of splits) {
      if (!(split.item_id in items)) continue;
      const split_key = `${split.item_id}_${split.split_id}`;
      if (split.user_id == user_id) {
        let name = items[split.item_id].name;
        if (split_counts[split_key] > 1)
          name += " / " + split_counts[split_key].toString();
        const unit_price =
          parseFloat(items[split.item_id].price) /
          parseFloat(items[split.item_id].quantity);
        my_items[split_key] = {
          name: name,
          price: (unit_price / split_counts[split_key]).toFixed(2),
        };
      }
    }

    return my_items;
  };

  const individualSharedCost = (user_id: string) => {
    const total = individualTotal(user_id);
    const total_price = Object.values(total).reduce((sum, item) => {
      return sum + parseFloat(item.price);
    }, 0);
    const subtotal = subTotal();
    const proportional_shared_cost = (total_price / subtotal) * sharedCharges;
    return proportional_shared_cost;
  };

  const subTotal = () => {
    return receipt
      ? parseFloat(receipt.grand_total) -
          parseFloat(receipt.shared_cost) -
          parseFloat(receipt.addl_gratuity)
      : 0;
  };

  useEffect(() => {
    setLoading(true);

    if (status === AuthStatus.CHECKING) {
      return;
    } else if (status === AuthStatus.NO_TOKEN) {
      router.push(`/user?receiptid=${params.receiptid}&page=live`);
    } else if (status === AuthStatus.BAD_TOKEN) {
      router.push(`/user`);
    } else if (status === AuthStatus.AUTHORIZED) {
      getRole(params.receiptid).then((role) => {
        if (role.permission === Permission.HOST) {
          setIsHost(true);
          setHostEditingUser(user?.id || null);
        } else if (role.permission === Permission.UNAUTHORIZED) {
          router.push(
            `/user?receiptid=${params.receiptid}&onboardConsumer=true`
          );
        }
        setWsUrl(
          `wss://tx3jw6v7dj.execute-api.us-east-1.amazonaws.com/prod?receiptId=${params.receiptid}&userId=${user?.id}`
        );
      });
    }

    fetchData().then(() => setLoading(false));
  }, [status, params.receiptid, router]);

  const shareReceipt = async (onboarding: boolean) => {
    const url = onboarding
      ? `https://payven.app/user?receiptid=${params.receiptid}&onboardConsumer=true`
      : `https://payven.app/${params.receiptid}/live`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Payven",
          text: "Split your receipt with Payven",
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
    router.push(`/${params.receiptid}/edit`);
  };

  const handleReminder = (name: string) => {
    setIsReminderPopupVisible(true);
    setReminderName(name);
  };

  const saveEdits = async () => {
    // const promises = [];
    // let all_success = true;
    if (role && !role.done) {
      markRoleDone(params.receiptid, true);
      setRole({ ...role, done: true });
    }

    const addsToProcess = pendingAdditions;
    const deletesToProcess = pendingDeletions;

    Object.keys(deletesToProcess).forEach(async (id) => {
      try {
        await deleteSplit(params.receiptid, id);
      } catch (error) {
        console.error("Failed to delete:", id, error);
        setPendingDeletions((prev) => {
          const newDeletes = { ...prev };
          for (const key in prev) if (key === id) delete newDeletes[key];
          return newDeletes;
        });
        setBanner({
          label: "Could not delete some splits, please check!",
          icon: "fa-xmark",
          type: "error",
        });
      }
    });

    Object.values(addsToProcess).forEach(async (item) => {
      try {
        await createSplit(
          params.receiptid,
          hostEditingUser || user?.id || "",
          item.item_id,
          item.split_id
        );
      } catch (error) {
        console.error("Failed to add:", item.id, error);
        setPendingAdditions((prev) => {
          const newAdds = { ...prev };
          for (const key in prev) if (key === item.id) delete newAdds[key];
          return newAdds;
        });
        setBanner({
          label: "Could not add some splits, please check!",
          icon: "fa-xmark",
          type: "error",
        });
      }
    });

    setIsEditing(false);
  };

  const markSettled = async () => {
    setBanner(null);
    setIsSettledPopupVisible(false);
    setIsSettled(true);
    await markAsSettled(params.receiptid);
    await backend("GET", `/receipt/${params.receiptid}/broadcast`);
  };

  const addPerson = async () => {
    setIsCreatePersonPopupVisible(false);
    const userId = `addperson-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 10)}`;
    const fakePhone = `guest-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 10)}`;
    const new_person_name = newPersonName;
    setUsers((prev) => ({
      ...prev,
      [userId]: {
        id: userId,
        name: new_person_name,
        phone: fakePhone,
        venmo_handle: "",
      },
    }));
    setHostEditingUser(userId);
    await hostCreateUser(params.receiptid, userId, new_person_name, fakePhone);
  };

  const deletePerson = async () => {
    setIsDeletePersonPopupVisible(false);
    if (!hostEditingUser) return;
    setHostEditingUser(user?.id || null);
    setUsers((prev) => {
      const newUsers = { ...prev };
      delete newUsers[hostEditingUser];
      return newUsers;
    });
    const splitsToDelete: string[] = [];
    for (const split of Object.values(splits)) {
      if (split.user_id == hostEditingUser) {
        splitsToDelete.push(split.id);
        deleteSplit(params.receiptid, split.id);
      }
    }
    setSplits((prev) => {
      const newSplits = { ...prev };
      for (const id of splitsToDelete) delete newSplits[id];
      return newSplits;
    });
    await hostDeleteUser(params.receiptid, hostEditingUser);
    // const new_person_name = newPersonName;
    // const new_user = await createUser(params.receiptid, new_person_name);
    // setBanner({
    //   label: "Person added successfully!",
    //   icon: "fa-check",
    //   type: "success",
    // });
  };

  const sendToVenmo = () => {
    // Go to Venmo and fill price to pay with
    const amount = individualTotal(user?.id || "");
    const note = "Payven restaurant split";
    const venmoURI = `venmo://paycharge?txn=pay&amount=${amount}&audience=private&note=${note}`;

    // Open the Venmo app (if installed) or the web page
    window.location.href = venmoURI;
  };

  return (
    <div className="w-full">
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
      {isCreatePersonPopupVisible && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-[#1C2B35] opacity-20"></div>{" "}
          {/* Blurred Background */}
          <div className="relative z-10 bg-white p-7 rounded-lg shadow-lg w-full mx-4 text-center">
            <p className="text-primary text-lg font-bold">Add Person</p>
            <p className="text-darkest text-base font-normal mb-2">
              Add a new consumer to the receipt and select their items.
            </p>
            <TextInput
              placeholder="Name"
              value={newPersonName}
              setValue={setNewPersonName}
            />
            <div className="mt-5 flex justify-center space-x-4">
              <button
                className="flex-1 px-4 py-2 bg-white text-midgray font-bold border rounded-full"
                onClick={() => setIsCreatePersonPopupVisible(false)}
              >
                Cancel
              </button>
              <button
                className="flex-1 px-4 py-2 bg-primary text-white font-bold rounded-full disabled:opacity-50"
                onClick={addPerson}
                disabled={newPersonName.length == 0}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
      {isDeletePersonPopupVisible && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-[#1C2B35] opacity-20"></div>{" "}
          {/* Blurred Background */}
          <div className="relative z-10 bg-white p-7 rounded-lg shadow-lg w-full mx-4 text-center">
            <p className="text-primary text-lg font-bold">Delete Person</p>
            <p className="text-darkest text-base font-normal mb-2">
              Are you sure you want to delete{" "}
              {hostEditingUser ? users[hostEditingUser].name : ""} from the
              receipt?
            </p>
            <div className="mt-5 flex justify-center space-x-4">
              <button
                className="flex-1 px-4 py-2 bg-white text-midgray font-bold border rounded-full"
                onClick={() => setIsDeletePersonPopupVisible(false)}
              >
                Cancel
              </button>
              <button
                className="flex-1 px-4 py-2 bg-primary text-white font-bold rounded-full disabled:opacity-50"
                onClick={deletePerson}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {isQRCode ? (
        <Container header onBack={() => setIsQRCode(!isQRCode)}>
          <Text type="xl_heading" className="text-darkest">
            QR Code
          </Text>
          <Text type="body" className="text-midgray">
            Scan this QR code to join the receipt as a consumer.
          </Text>
          <Spacer size="large"></Spacer>
          <div className="w-full flex justify-center items-center">
            <div className="bg-white shadow-[0px_0px_16px_0px_rgba(0,0,0,0.15)] rounded-2xl p-4 w-full max-w-full flex justify-center items-center">
              <QRCodeCanvas
                value={`https://payven.app/user?receiptid=${params.receiptid}&onboardConsumer=true`}
                className="w-full h-full"
                size={Math.min(
                  window.innerWidth * 0.8,
                  window.innerHeight * 0.8
                )} // Adjust to make it square
              />
            </div>
          </div>
          <StickyButton
            label="Share Receipt Link"
            icon="fa-arrow-up-from-bracket"
            onClick={() => shareReceipt(true)}
            sticky
          />
        </Container>
      ) : (
        <Container header>
          {isHost && !unclaimedItems && !isSettled ? (
            <Banner
              label="Settle receipt to finalize payments!"
              icon="fa-check"
              type="success"
              disappear={false}
            />
          ) : null}
          {banner ? (
            <Banner
              label={banner.label}
              icon={banner.icon}
              type={banner.type}
              disappear={true}
            />
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
                <HostActionButton
                  icon="fa-arrow-up-from-bracket"
                  onClick={() => setIsQRCode(true)}
                  className="ms-3"
                  disabled={isSettled}
                />
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
              Tap the portions you consumed and share receipt link with all
              consumers.
            </Text>
          ) : (
            <Text type="body" className="text-midgray">
              Tap the portions you consumed. Only pay the host{" "}
              <b>after they have settled the receipt.</b>
            </Text>
          )}
          {isHost ? (
            <div className="w-full">
              {!isSettled && (
                <div className="w-full mb-2">
                  {remainingUsers() > 0 ? (
                    <div className="w-full flex justify-between items-center mt-1 mb-2">
                      <div className="flex items-center">
                        <Text type="body_bold" className="mr-2">
                          Waiting for
                        </Text>
                        <span className="px-1.5 font-bold text-error bg-red-50 rounded-s rounded-e">
                          <i className="fa-solid fa-user fa-xs"></i>{" "}
                          {remainingUsers()} people
                        </span>
                      </div>
                      <ModifyButton
                        label="Add Person"
                        icon="fa-plus"
                        onClick={() => setIsCreatePersonPopupVisible(true)}
                      />
                    </div>
                  ) : (
                    <div className="w-full flex justify-between items-center mt-1 mb-2">
                      <div className="flex items-center">
                        <Text type="body_bold" className="mr-2">
                          Waiting for
                        </Text>
                        <span className="px-1.5 font-bold text-accent bg-teal-50 rounded-s rounded-e">
                          <i className="fa-solid fa-user fa-xs"></i>{" "}
                          {remainingUsers()} people
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="w-full flex flex-wrap gap-2">
                    {Object.values(users).map((person, index) => (
                      <div
                        className={`relative px-2 h-10 rounded-lg flex items-center justify-center ${
                          person.id === hostEditingUser
                            ? "bg-lightestgray text-primary text-base font-bold"
                            : "text-midgray text-base font-medium"
                        }`}
                        key={index}
                        onClick={() => setHostEditingUser(person.id)}
                      >
                        <span>{person.name}</span>
                        {person.id !== user?.id &&
                          person.id === hostEditingUser && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsDeletePersonPopupVisible(true);
                              }}
                              className="absolute -top-2 -right-2 w-5 h-5 bg-white rounded-full border border-lightestgray flex items-center justify-center shadow-sm hover:bg-gray-50 transition-transform duration-200 active:scale-90"
                            >
                              <i className="fas fa-minus text-primary text-xs"></i>
                            </button>
                          )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
              <div className="w-full pb-20">
                <PaymentBreakdown
                  consumer_items={individualTotal(user?.id || "")}
                  sharedCharges={individualSharedCost(user?.id || "")}
                ></PaymentBreakdown>
                <Spacer size="medium" />
                <DynamicSelection
                  receipt_id={params.receiptid}
                  items={receiptItems}
                  activeUserId={hostEditingUser || user?.id || null}
                  users={users}
                  splits={splits}
                  pendingAdds={pendingAdditions}
                  setPendingAdditions={setPendingAdditions}
                  pendingDeletions={pendingDeletions}
                  setPendingDeletions={setPendingDeletions}
                  disabled={isSettled}
                  onSplitChange={() => {
                    setBanner(null);
                    setIsEditing(true);
                  }}
                ></DynamicSelection>
                {/* {isHost ? (
                <LineItem
                  label="Claimed Amount"
                  price={currentTotal()}
                  labelColor="text-accent"
                  bold
                ></LineItem>
              ) : null} */}
                <LineItem
                  label="Subtotal"
                  price={subTotal()}
                  labelColor="text-midgray"
                  bold
                ></LineItem>
                <LineItem
                  label="Tax + Fees"
                  price={receipt ? parseFloat(receipt.shared_cost) : 0}
                  labelColor="text-midgray"
                  bold
                ></LineItem>
                {parseFloat(receipt ? receipt.addl_gratuity : "0") != 0 ? (
                  <LineItem
                    label="Tip"
                    price={receipt ? parseFloat(receipt.addl_gratuity) : 0}
                    labelColor="text-midgray"
                    bold
                  ></LineItem>
                ) : null}
                <LineItem
                  label="Grand Total"
                  price={receipt ? parseFloat(receipt.grand_total) : 0}
                  labelColor="text-primary"
                  bold
                ></LineItem>
                {isEditing &&
                (Object.keys(pendingAdditions).length > 0 ||
                  Object.keys(pendingDeletions).length > 0) ? (
                  <StickyButton
                    label="Save changes"
                    icon="fa-floppy-disk"
                    onClick={saveEdits}
                    sticky
                    secondary
                  />
                ) : isHost && !unclaimedItems && !isSettled ? (
                  <StickyButton
                    label="Settle Receipt"
                    onClick={() => setIsSettledPopupVisible(true)}
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
                {Object.values(users).map((person, index) => (
                  <ConsumerBreakdown
                    key={index}
                    consumer_items={individualTotal(person?.id)}
                    user_name={person?.name || ""}
                    sharedCharges={individualSharedCost(person?.id)}
                    isHost={person?.id == user?.id}
                    handleReminder={handleReminder}
                  />
                ))}
                {/* {isHost ? (
                <LineItem
                  label="Claimed Amount"
                  price={currentTotal()}
                  labelColor="text-accent"
                  bold
                ></LineItem>
              ) : null} */}
                <LineItem
                  label="Subtotal"
                  price={subTotal()}
                  labelColor="text-midgray"
                  bold
                ></LineItem>
                <LineItem
                  label="Shared Charges"
                  price={
                    receipt
                      ? parseFloat(receipt.shared_cost) +
                        parseFloat(receipt.addl_gratuity)
                      : 0
                  }
                  labelColor="text-midgray"
                  bold
                ></LineItem>
                <LineItem
                  label="Grand Total"
                  price={receipt ? parseFloat(receipt.grand_total) : 0}
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
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Spacer from "@/components/Spacer";
import LogoutSection from "@/components/LogoutSection";
import Text from "@/components/Text";
import DynamicSelection from "@/components/DynamicSelection";
import Container from "@/components/Container";
import Spinner from "@/components/Spinner";

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
} from "@/lib/backend";

export default function LiveReceiptPage({
  params,
}: {
  params: { receiptid: string };
}) {
  const { status, getPermission } = useGlobalContext();
  const [loading, setLoading] = useState(true);
  const [receiptItems, setReceiptItems] = useState<{ [key: string]: Item }>({});
  const [users, setUsers] = useState<{ [key: string]: User }>({});
  const [splits, setSplits] = useState<{ [key: string]: Split }>({});

  // const [messages, setMessages] = useState<string[]>([]);

  const router = useRouter();

  const refreshSplits = async () => {
    const split_map: { [key: string]: Split } = {};
    const splits = await getSplits(params.receiptid);
    for (const split of splits) {
      split_map[split.id] = split;
    }
    setSplits(split_map);
  };

  useEffect(() => {
    setLoading(true);

    if (status === AuthStatus.CHECKING) {
      return;
    } else if (status === AuthStatus.NO_TOKEN) {
      router.push(`/user?receiptid=${params.receiptid}&page=split`);
    } else if (status === AuthStatus.BAD_TOKEN) {
      router.push(`/user`);
    } else if (status === AuthStatus.AUTHORIZED) {
      getPermission(params.receiptid).then((permission) => {
        if (permission === Permission.UNAUTHORIZED) {
          router.push(`/unauthorized`);
        }
      });
    }
    const fetchData = async () => {
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

      await refreshSplits();
    };

    fetchData().then(() => setLoading(false));

    const socket = new WebSocket(
      `wss://uh3gy3opd5.execute-api.us-east-1.amazonaws.com/prod?receiptId=${params.receiptid}`
    );

    socket.onopen = () => {
      console.log("Connected to WebSocket");
    };

    socket.onmessage = (event) => {
      console.log(event.data);
      refreshSplits();
    };

    socket.onerror = (error) => {
      console.log("WebSocket error:", error);
    };

    socket.onclose = () => {
      console.log("WebSocket disconnected");
    };

    return () => {
      socket.close(); // Cleanup on unmount
    };
  }, [status, params.receiptid, router]);

  return (
    <Container>
      <LogoutSection></LogoutSection>
      <Text type="xl_heading" className="text-darkest">
        Live Receipt
      </Text>
      <Spacer size="large" />
      {!loading ? (
        <div className="w-full">
          <DynamicSelection
            receipt_id={params.receiptid}
            items={receiptItems}
            users={users}
            splits={splits}
            setSplits={setSplits}
          ></DynamicSelection>
        </div>
      ) : (
        <div className="flex w-full items-center justify-center">
          <Spinner color="text-primary" />
        </div>
      )}
    </Container>
  );
}

"use client";

import { useEffect } from "react";
import Text from "@/components/Text";
import SquareButton from "@/components/SquareButton";
import Spacer from "@/components/Spacer";
import Container from "@/components/Container";
import { useRouter } from "next/navigation";
import {
  useGlobalContext,
  AuthStatus,
  Permission,
} from "@/contexts/GlobalContext";

export default function ShareReceiptPage({
  params,
}: {
  params: { receiptid: string };
}) {
  const { status, getPermission } = useGlobalContext();
  const router = useRouter();

  useEffect(() => {
    if (status === AuthStatus.CHECKING) {
      return;
    } else if (status === AuthStatus.NO_TOKEN) {
      router.push(`/user?receiptid=${params.receiptid}&page=share`);
    } else if (status === AuthStatus.UNAUTHORIZED) {
      router.push(`/unauthorized`);
    } else if (status === AuthStatus.AUTHORIZED) {
      getPermission(params.receiptid).then((permission) => {
        if (permission === Permission.UNAUTHORIZED) {
          router.push(`/unauthorized`);
        }
      });
    }
  }, [status]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "FairShare",
          text: "Split your receipt with FairShare",
          url: `https://main.d3o7tn3uwoluhy.amplifyapp.com/user?receiptid=${params.receiptid}&onboardConsumer=true`, // URL to share (should be link/user?receiptid=...&onboardConsumer=true&page=split)
        });
        console.log("Content shared successfully");
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      alert("Sharing not supported on this browser.");
    }
  };

  const handleDashboard = () => {
    router.push(`/${params.receiptid}/hostdashboard`);
  };

  return (
    <Container>
      <Spacer size="large" />
      <Text type="xl_heading" className="text-darkest">
        Share and Settle
      </Text>
      <Spacer size="small" />
      <Text type="body" className="text-midgray">
        To continue,{" "}
        <Text type="body_bold" className="text-darkest">
          share your receipt link
        </Text>{" "}
        with the consumers splitting this bill with you. Once everyone in the
        party has added their consumed items, you will receive a text to view
        the final breakdown on the{" "}
        <Text type="body_bold" className="text-darkest">
          Host Dashboard
        </Text>
        .
      </Text>
      <Spacer size="large" />
      <div className="w-full grid grid-cols-2 gap-4">
        <SquareButton
          label="Share Receipt Link"
          color="accent"
          icon="fa-arrow-up-from-bracket"
          onClick={handleShare}
        />
        <SquareButton
          label="Host Dashboard"
          color="primary"
          icon="fa-table-columns"
          onClick={handleDashboard}
        />
      </div>
    </Container>
  );
}

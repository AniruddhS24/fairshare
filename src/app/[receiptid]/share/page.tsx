"use client";

import { useState } from "react";
import Text from "@/components/Text";
import SquareButton from "@/components/SquareButton";
import Image from "next/image";
import Spacer from "@/components/Spacer";
import ModifyButton from "@/components/ModifyButton";
import StickyButton from "@/components/StickyButton";
import { useRouter } from "next/navigation";

export default function ShareReceiptPage({
  params,
}: {
  params: { receiptid: string };
}) {
  const router = useRouter();
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "FairShare",
          text: "Split your receipt with FairShare",
          url: "https://example.com", // URL to share
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
    <div className="h-full flex flex-col items-start justify-start bg-white px-2 pb-12">
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
    </div>
  );
}

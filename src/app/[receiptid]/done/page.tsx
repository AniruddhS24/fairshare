"use client";

import { useState, useEffect } from "react";
import Text from "@/components/Text";
import SquareButton from "@/components/SquareButton";
import Image from "next/image";
import Spacer from "@/components/Spacer";
import ModifyButton from "@/components/ModifyButton";
import StickyButton from "@/components/StickyButton";
import { useRouter } from "next/navigation";
import { useGlobalContext } from "@/contexts/GlobalContext";

export default function DoneReceiptPage({
  params,
}: {
  params: { receiptid: string };
}) {
  const { user } = useGlobalContext();
  const router = useRouter();

  return (
    <div className="flex flex-col h-full items-center justify-center">
      <Spacer size="large" />
      <div
        className="flex flex-col items-center justify-center text-center rounded-md bg-white p-4 m-4"
        style={{ boxShadow: "0px 0px 15px 0px #0000001F" }}
      >
        <Text type="m_heading" className="text-primary">
          Done for now!
        </Text>
        <Spacer size="small" />
        <Text type="m_body" className="text-darkest">
          The host has been notified that you have added your consumed items!
          Once everyone else in your party has also done so, you will receive a
          text to view and send the final payment amount.
        </Text>
      </div>
    </div>
  );
}

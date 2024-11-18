"use client";

import { useEffect, useState } from "react";
import Text from "../../components/Text";
import SquareButton from "../../components/SquareButton";
import Image from "next/image";
import Spacer from "@/components/Spacer";
import ModifyButton from "@/components/ModifyButton";
import StickyButton from "@/components/StickyButton";
import { useRouter } from "next/navigation";
import { useGlobalContext, Permission } from "@/contexts/GlobalContext";
import { backend } from "@/lib/backend";

export default function UnauthorizedPage() {
  return (
    <div className="h-full flex flex-col items-center justify-start bg-white px-5">
      <Spacer size="large" />
      <Image src="/logo.png" alt="Logo" width={250} height={100} />
      <Spacer size="large" />
      <Text type="m_heading" className="text-darkest">
        Unauthorized
      </Text>
      <Text type="body" className="text-darkest">
        You are not authorized to view this page.
      </Text>
    </div>
  );
}

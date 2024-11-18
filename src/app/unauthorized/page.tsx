"use client";

import Text from "../../components/Text";
import Image from "next/image";
import Spacer from "@/components/Spacer";

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

"use client";

import { useEffect } from "react";
import { useGlobalContext, AuthStatus } from "@/contexts/GlobalContext";
import { useRouter } from "next/navigation";

export default function Home() {
  const { status } = useGlobalContext();
  const router = useRouter();

  useEffect(() => {
    if (status === AuthStatus.CHECKING) {
      return;
    } else if (status === AuthStatus.AUTHORIZED) {
      router.push(`/upload`);
    } else {
      router.push(`/user`);
    }
  }, [status]);

  return (
    <div className="h-full flex flex-col items-center justify-start bg-white px-5"></div>
  );
}

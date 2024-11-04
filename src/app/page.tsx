"use client";

import Spacer from "@/components/Spacer";
import StickyButton from "@/components/StickyButton";
import { useGlobalContext } from "@/contexts/GlobalContext";
import { useRouter } from "next/navigation";

export default function Home() {
  const { logout } = useGlobalContext();
  const router = useRouter();

  return (
    <div className="h-full flex flex-col items-center justify-start bg-white px-5">
      <Spacer size="large" />
      <StickyButton
        label="Logout"
        onClick={() => {
          logout();
          router.push("/host");
        }}
      />
    </div>
  );
}

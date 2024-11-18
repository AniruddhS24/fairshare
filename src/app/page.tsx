"use client";

import Spacer from "@/components/Spacer";
import StickyButton from "@/components/StickyButton";
import { useGlobalContext } from "@/contexts/GlobalContext";
import { useRouter } from "next/navigation";
import { backend } from "@/lib/backend";

export default function Home() {
  const { logout } = useGlobalContext();
  const router = useRouter();

  const testBackendRequest = async () => {
    const response = await backend("GET", "/test");
    console.log(response);
  };

  return (
    <div className="h-full flex flex-col items-center justify-start bg-white px-5">
      <Spacer size="large" />
      <StickyButton
        label="Logout"
        onClick={() => {
          logout();
          router.push("/user");
        }}
      />
      <StickyButton
        label="Test Request"
        onClick={() => {
          testBackendRequest();
        }}
      />
    </div>
  );
}

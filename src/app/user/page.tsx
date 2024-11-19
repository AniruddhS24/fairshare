"use client";

import { useState, useEffect, Suspense } from "react";
import Text from "../../components/Text";
import TextInput from "../../components/TextInput";
import PhoneInput from "../../components/PhoneInput";
import StickyButton from "../../components/StickyButton";
import Image from "next/image";
import Spacer from "@/components/Spacer";
import { useRouter, useSearchParams } from "next/navigation";
import { useGlobalContext, Permission } from "@/contexts/GlobalContext";
import { backend } from "@/lib/backend";

function UserOnboardingPage() {
  const { user, login } = useGlobalContext();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [name, setName] = useState<string>("");
  // const [venmoHandle, setVenmoHandle] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");

  const goToPage = () => {
    if (searchParams.has("receiptid")) {
      const receipt_id = searchParams.get("receiptid");
      if (searchParams.has("onboardConsumer")) {
        backend("POST", `/receipt/${receipt_id}/role`, {
          role: Permission.CONSUMER,
        }).then(() => {
          router.push(`/${receipt_id}/split`);
        });
      } else if (searchParams.has("page")) {
        router.push(`/${receipt_id}/${searchParams.get("page")}`);
      }
    } else {
      router.push("/upload");
    }
  };

  useEffect(() => {
    if (user) {
      console.log(user);
      goToPage();
    }
  }, [user]);

  const handleNext = async () => {
    const userData = {
      id: null,
      name: name,
      phone: phoneNumber,
    };
    await login(userData);
    goToPage();
  };

  return (
    <div className="h-full flex flex-col items-center justify-start bg-white px-5">
      <Spacer size="large" />
      <Image src="/logo.png" alt="Logo" width={250} height={100} />
      <Spacer size="large" />
      <Text type="m_heading" className="text-darkest">
        Enter Information
      </Text>
      <Text type="body" className="text-center text-midgray">
        Please enter your name and phone number to get started
      </Text>
      <Spacer size="large" />
      <TextInput placeholder="Name" value={name} setValue={setName} />
      {/* <Spacer size="medium" />
      <TextInput
        placeholder="@venmo-handle"
        value={venmoHandle}
        setValue={setVenmoHandle}
      /> */}
      <Spacer size="medium" />
      <PhoneInput
        placeholder="Phone number"
        value={phoneNumber}
        setValue={setPhoneNumber}
      />
      <Spacer size="large" />
      <StickyButton
        label="Next"
        onClick={() => {
          handleNext();
        }}
      />
    </div>
  );
}

export default function UserOnboarding() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UserOnboardingPage />
    </Suspense>
  );
}

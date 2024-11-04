"use client";

import { useState, useEffect } from "react";
import Text from "../../components/Text";
import TextInput from "../../components/TextInput";
import PhoneInput from "../../components/PhoneInput";
import StickyButton from "../../components/StickyButton";
import Image from "next/image";
import Spacer from "@/components/Spacer";
import { useRouter } from "next/navigation";
import { useGlobalContext } from "@/contexts/GlobalContext";

export default function HostOnboardingPage() {
  const { user, login } = useGlobalContext();
  const router = useRouter();
  const [name, setName] = useState<string>("");
  const [venmoHandle, setVenmoHandle] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");

  useEffect(() => {
    if (user) {
      console.log(`You are already logged in ${user.name} ${user.phone}`);
      router.push("/upload");
    }
  }, [user]);

  const handleNext = () => {
    const userData = {
      name: name,
      phone: phoneNumber,
    };
    login(userData);
    router.push("/upload");
  };

  return (
    <div className="h-full flex flex-col items-center justify-start bg-white px-5">
      <Spacer size="large" />
      <Image src="/logo.png" alt="Logo" width={250} height={100} />
      <Spacer size="large" />
      <Text type="m_heading" className="text-darkest">
        Host Information
      </Text>
      <Text type="body" className="text-center text-midgray">
        Please enter your phone nuber and Venmo handle to get started
      </Text>
      <Spacer size="large" />
      <TextInput placeholder="Name" value={name} setValue={setName} />
      <Spacer size="medium" />
      <TextInput
        placeholder="@venmo-handle"
        value={venmoHandle}
        setValue={setVenmoHandle}
      />
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

"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Text from "../../components/Text";
import TextInput from "../../components/TextInput";
import PhoneInput from "../../components/PhoneInput";
import StickyButton from "../../components/StickyButton";
import Image from "next/image";
import Spacer from "@/components/Spacer";
import Container from "@/components/Container";
import Spinner from "@/components/Spinner";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useGlobalContext,
  Permission,
  AuthStatus,
} from "@/contexts/GlobalContext";
import { backend } from "@/lib/backend";

function UserOnboardingPage() {
  const { status, login } = useGlobalContext();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");

  const receipt_id = searchParams.get("receiptid");
  const onboardConsumer = searchParams.get("onboardConsumer");
  const page = searchParams.get("page");

  const goToPage = useCallback(() => {
    if (receipt_id) {
      if (onboardConsumer) {
        backend("POST", `/receipt/${receipt_id}/role`, {
          role: Permission.CONSUMER,
        }).then(() => {
          router.push(`/${receipt_id}/split`);
        });
      } else if (page) {
        router.push(`/${receipt_id}/${page}`);
      }
    } else {
      router.push("/upload");
    }
  }, [router, receipt_id, onboardConsumer, page]);

  useEffect(() => {
    if (status === AuthStatus.CHECKING) {
      setLoading(true);
    } else if (status === AuthStatus.AUTHORIZED) {
      goToPage();
    } else {
      setLoading(false);
    }
  }, [status, goToPage]);

  const handleNext = async () => {
    const userData = {
      id: null,
      name: name,
      phone: phoneNumber,
    };
    await login(userData);
    goToPage();
  };

  const isNextDisabled = !name || !phoneNumber;

  return loading ? (
    <div className="flex w-full items-center justify-center">
      <Spinner color="text-primary" />
    </div>
  ) : (
    <Container centered>
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
        disabled={isNextDisabled}
      />
    </Container>
  );
}

export default function UserOnboarding() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UserOnboardingPage />
    </Suspense>
  );
}

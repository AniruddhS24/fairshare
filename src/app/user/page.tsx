"use client";

import { useState, useEffect, useRef, Suspense } from "react";
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
import { createRole, getUserRole, createOTP, verifyOTP } from "@/lib/backend";

interface PhoneVerificationProps {
  phoneNumber: string;
  code: string;
  setCode: React.Dispatch<React.SetStateAction<string>>;
  handleCode: (code: string) => void;
}

const PhoneVerification: React.FC<PhoneVerificationProps> = ({
  phoneNumber,
  code,
  setCode,
  handleCode,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [resentCode, setResentCode] = useState(false);

  // Update the code when the user types
  const handleInputChange = (value: string) => {
    const sanitizedValue = value.replace(/\D/g, "").slice(0, 6); // Allow only digits, max length 6
    setCode(sanitizedValue);
  };

  // Focus the hidden input when the user clicks on the container
  const handleSlotClick = () => {
    inputRef.current?.focus();
  };

  return (
    <Container centered>
      <Spacer size="large" />
      <Text type="m_heading" className="text-darkest">
        Verify Your Phone Number
      </Text>
      <Text type="body" className="text-center text-midgray">
        Enter the 6-digit code sent to your phone number.
      </Text>
      <Spacer size="large" />
      {/* Hidden input to capture all user input */}
      <input
        ref={inputRef}
        type="tel"
        value={code}
        onChange={(e) => handleInputChange(e.target.value)}
        className="absolute opacity-0 w-0 h-0"
        maxLength={6}
      />
      {/* Visual representation of slots */}
      <div className="flex justify-center gap-2" onClick={handleSlotClick}>
        {Array(6)
          .fill("")
          .map((_, index) => (
            <div
              key={index}
              className={`w-12 h-12 border border-lightgray rounded-xl flex items-center justify-center text-lg text-darkest font-medium ${
                index < code.length ? "text-primary" : "text-midgray"
              }`}
            >
              {code[index] || ""}
            </div>
          ))}
      </div>
      <Spacer size="large" />
      <StickyButton
        label="Verify"
        onClick={async () => handleCode(code)}
        disabled={code.length !== 6}
      />
      <Spacer size="medium" />
      {!resentCode ? (
        <div className="w-full flex justify-center items-center">
          <Text type="body">Did not receive a code? </Text>
          <button
            onClick={async () => {
              setResentCode(true);
              await createOTP(phoneNumber);
            }}
            className={`items-center justify-center ms-2 rounded-full`}
          >
            <Text type="body_bold" className="text-primary">
              Resend
            </Text>
          </button>
        </div>
      ) : null}
    </Container>
  );
};

function UserOnboardingPage() {
  const { status, login } = useGlobalContext();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [venmoHandle] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [waitingForCode, setWaitingForCode] = useState(false);
  const [newUserSignup, setNewUserSignup] = useState(false);

  const receipt_id = searchParams.get("receiptid");
  const onboardConsumer = searchParams.get("onboardConsumer");
  const page = searchParams.get("page");

  useEffect(() => {
    const goToNextPage = async () => {
      if (receipt_id) {
        if (onboardConsumer) {
          try {
            await getUserRole(receipt_id);
          } catch {
            await createRole(receipt_id, Permission.CONSUMER);
          }
          router.push(`/${receipt_id}/live`);
        } else if (page) {
          router.push(`/${receipt_id}/${page}`);
        }
      } else {
        router.push("/upload");
      }
    };

    if (status === AuthStatus.CHECKING) {
      setLoading(true);
    } else if (status === AuthStatus.AUTHORIZED) {
      goToNextPage();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, receipt_id, page, onboardConsumer]);

  const handleNext = async () => {
    // if (!OTP_ENABLED) {
    //   const userData = {
    //     id: null,
    //     name: name,
    //     phone: phoneNumber,
    //     venmo_handle: venmoHandle.replace("@", ""),
    //   };
    //   await login(userData);
    // } else {
    //   await createOTP(phoneNumber);
    //   setWaitingForCode(true);
    // }
    await createOTP(phoneNumber);
    setWaitingForCode(true);
  };

  const handleSignupNext = async () => {
    const userData = {
      id: null,
      name: name,
      phone: phoneNumber,
      venmo_handle: venmoHandle.replace("@", ""),
    };
    await login(userData);
  };

  const handleCode = async (code: string) => {
    try {
      const response = await verifyOTP(phoneNumber, parseInt(code));
      const userData = {
        id: null,
        name: name,
        phone: phoneNumber,
        venmo_handle: venmoHandle.replace("@", ""),
      };
      if (!response.user_exists) {
        setNewUserSignup(true);
      } else {
        await login(userData);
      }
    } catch {
      setCode("");
    }
  };

  return loading ? (
    <div className="flex w-full items-center justify-center">
      <Spinner color="text-primary" />
    </div>
  ) : !waitingForCode ? (
    <Container centered>
      <Spacer size="large" />
      <Image src="/logo.png" alt="Logo" width={250} height={100} />
      <Spacer size="large" />
      <Text type="m_heading" className="text-darkest">
        Sign In
      </Text>
      <Text type="body" className="text-center text-midgray">
        Get started splitting receipts seamlessly
      </Text>
      <Spacer size="large" />
      <PhoneInput
        placeholder="Phone number"
        value={phoneNumber}
        setValue={setPhoneNumber}
      />
      {/* <Spacer size="medium" />
      <TextInput
        placeholder="Venmo Handle (optional)"
        value={venmoHandle}
        setValue={setVenmoHandle}
      /> */}
      <Spacer size="large" />
      <StickyButton label="Next" onClick={handleNext} disabled={!phoneNumber} />
      <Spacer size="large" />
      <Text type="body" className="text-center text-midgray text-xs">
        By providing your phone number, you consent to receive SMS messages from
        FairShare. Message and data rates may apply. You may opt-out at any
        time.{" "}
        <a
          className="underline"
          href="https://www.freeprivacypolicy.com/live/b3b3f6bb-e1e7-4c47-99d4-70af72330916"
        >
          Privacy policy
        </a>
      </Text>
    </Container>
  ) : newUserSignup ? (
    <Container centered>
      <Spacer size="large" />
      <Image src="/logo.png" alt="Logo" width={250} height={100} />
      <Spacer size="large" />
      <Text type="m_heading" className="text-darkest">
        Enter Information
      </Text>
      <Text type="body" className="text-center text-midgray">
        Enter your name to create an account
      </Text>
      <Spacer size="large" />
      <PhoneInput
        placeholder="Phone number"
        value={phoneNumber}
        setValue={setPhoneNumber}
        disabled
      />
      <Spacer size="medium" />
      <TextInput placeholder="Name" value={name} setValue={setName} />
      {/* <Spacer size="medium" />
      <TextInput
        placeholder="Venmo Handle (optional)"
        value={venmoHandle}
        setValue={setVenmoHandle}
      /> */}
      <Spacer size="large" />
      <StickyButton label="Next" onClick={handleSignupNext} disabled={!name} />
    </Container>
  ) : (
    <PhoneVerification
      phoneNumber={phoneNumber}
      code={code}
      setCode={setCode}
      handleCode={handleCode}
    />
  );
}

export default function UserOnboarding() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UserOnboardingPage />
    </Suspense>
  );
}

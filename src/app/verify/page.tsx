"use client";

import React, { useState, useRef } from "react";
import Text from "../../components/Text";
import StickyButton from "../../components/StickyButton";
import Spacer from "@/components/Spacer";
import Container from "@/components/Container";
import { useRouter } from "next/navigation";

const PhoneVerification = () => {
  const [code, setCode] = useState<string>(""); // Single string for the code
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Update the code when the user types
  const handleInputChange = (value: string) => {
    const sanitizedValue = value.replace(/\D/g, "").slice(0, 6); // Allow only digits, max length 6
    setCode(sanitizedValue);
  };

  const handleSubmit = () => {
    console.log("Verification code entered:", code);
    router.push("/next-step"); // Replace with your next step route
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
        onClick={handleSubmit}
        disabled={code.length !== 6}
      />
    </Container>
  );
};

export default PhoneVerification;

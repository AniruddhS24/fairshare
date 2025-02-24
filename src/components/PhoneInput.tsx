"use client";

import React from "react";

interface InputProps {
  placeholder?: string;
  value: string;
  setValue: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

const PhoneInput: React.FC<InputProps> = ({
  placeholder = "Enter text...",
  value,
  setValue,
  className = "",
  disabled,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const phoneNumber = inputValue.replace(/\D/g, "").slice(0, 10);
    const formatted = phoneNumber.replace(
      /(\d{1,3})(\d{1,3})?(\d{1,4})?/,
      (_, p1, p2, p3) => {
        let result = `(${p1}`;
        if (p2) result += `) ${p2}`;
        if (p3) result += `-${p3}`;
        return result;
      }
    );
    setValue(formatted);
  };

  return (
    <input
      type="tel"
      placeholder={placeholder}
      value={value}
      onChange={handleChange}
      className={`w-full font-normal text-darkest border border-lightgray placeholder-midgray rounded-xl py-2 px-4 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent ${className}`}
      disabled={disabled}
    />
  );
};

export default PhoneInput;

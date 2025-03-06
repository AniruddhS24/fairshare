"use client";

import React from "react";

interface InputProps {
  placeholder?: string;
  value: string;
  setValue: (value: string) => void;
  className?: string; // Allow additional Tailwind classes
  setFocused?: (focused: boolean) => void;
}

const TextInput: React.FC<InputProps> = ({
  placeholder = "Enter text...",
  value,
  setValue,
  className = "",
  setFocused,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  return (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={handleChange}
      className={`w-full font-normal text-darkest bg-lightestgray placeholder-midgray rounded-xl py-2 px-4 focus:outline-none ${className}`}
      onFocus={() => setFocused?.(true)}
      onBlur={() => {
        setTimeout(() => {
          setFocused?.(false);
        }, 50);
      }}
    />
  );
};

export default TextInput;

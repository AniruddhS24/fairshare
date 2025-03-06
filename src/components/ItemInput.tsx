"use client";

import React from "react";

interface InputProps {
  placeholder?: string;
  value: string;
  setValue: (value: string) => void;
  className?: string; // Allow additional Tailwind classes
}

const ItemInput: React.FC<InputProps> = ({
  placeholder = "Enter text...",
  value,
  setValue,
  className = "",
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
      className={`w-full font-normal text-darkest bg-lightestgray placeholder-midgray rounded-xl py-2 px-3 focus:outline-none ${className}`}
    />
  );
};

export default ItemInput;

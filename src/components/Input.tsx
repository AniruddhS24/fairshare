"use client";

import React from 'react';

interface InputProps {
  placeholder?: string;
  value: string;
  setValue: (value: string) => void;
  className?: string; // Allow additional Tailwind classes
}

const Input: React.FC<InputProps> = ({
  placeholder = 'Enter text...',
  value,
  setValue,
  className = '',
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
      className={`w-full font-normal text-darkest border border-lightgray placeholder-midgray rounded-xl py-2 px-4 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent ${className}`}
    />
  );
};

export default Input;

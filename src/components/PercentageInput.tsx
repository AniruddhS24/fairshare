"use client";

import React, { useState } from "react";

interface PercentageInputProps {
  value: string;
  setValue: (value: string) => void;
  className?: string; // Allow additional Tailwind classes
}

const PercentageInput: React.FC<PercentageInputProps> = ({
  value,
  setValue,
  className = "",
}) => {
  const [startedEdit, setStartedEdit] = useState(false);
  const [prevValue, setPrevValue] = useState(value);

  const formatPercentage = (val: string) => {
    const formatted = val.replace(/\D/g, ""); // Remove any non-numeric characters
    if (formatted === "") {
      return "0";
    }
    let parsedValue = parseInt(formatted, 10);
    if (parsedValue > 100) parsedValue = parsedValue % 100;
    return parsedValue.toString();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = e.target.value;
    let diffChar = inputVal[inputVal.length - 1];
    for (let i = 0; i < inputVal.length; i++) {
      if (inputVal[i] !== prevValue[i]) {
        diffChar = inputVal[i];
        break;
      }
    }
    setPrevValue(inputVal);
    if (startedEdit) {
      const formattedValue = formatPercentage(diffChar);
      setValue(formattedValue);
      setStartedEdit(false);
    } else {
      setValue(formatPercentage(inputVal));
    }
  };

  const handleFocus = () => {
    setStartedEdit(true);
  };

  const handleBlur = () => {
    setStartedEdit(false);
  };

  return (
    <div className="relative">
      <input
        type="tel"
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={`w-full pl-3 font-normal text-darkest border border-lightgray placeholder-midgray rounded-xl py-2 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent ${className}`}
        placeholder="0"
      />
      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
        %
      </span>
    </div>
  );
};

export default PercentageInput;

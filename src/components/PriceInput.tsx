"use client";

import React, { useState } from "react";

interface PriceInputProps {
  value: string;
  setValue: (value: string) => void;
  className?: string; // Allow additional Tailwind classes
}

const PriceInput: React.FC<PriceInputProps> = ({
  value,
  setValue,
  className = "",
}) => {
  const [startedEdit, setStartedEdit] = useState(false);
  const [prevValue, setPrevValue] = useState(value);

  const formatPrice = (val: string) => {
    let formatted = val.replace(/\D/g, "");
    if (formatted === "") {
      return "0.00";
    }
    let parsedValue = parseInt(formatted, 10);
    let dollarValue = (parsedValue / 100).toFixed(2);
    return dollarValue;
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
      const formattedValue = formatPrice(diffChar);
      setValue(formattedValue);
      setStartedEdit(false);
    } else {
      setValue(formatPrice(inputVal));
    }
  };

  const handleFocus = () => {
    setStartedEdit(true); // Set editing to true when focused
  };

  const handleBlur = () => {
    setStartedEdit(false); // Reset editing state when the input loses focus
  };

  return (
    <div className="relative">
      <span className="absolute left-1.5 top-1/2 transform -translate-y-1/2 text-gray-500">
        $
      </span>
      <input
        type="tel"
        value={value}
        onChange={handleChange}
        onFocus={handleFocus} // Set editing state when the input is focused
        onBlur={handleBlur} // Reset editing state when the input loses focus
        className={`w-full pl-4 font-normal text-darkest shadow-custom-light placeholder-midgray rounded-xl py-2 px-4 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent ${className}`}
        placeholder="0.00"
        style={{ textAlign: startedEdit ? "right" : "left" }} // Align text based on editing state
      />
    </div>
  );
};

export default PriceInput;

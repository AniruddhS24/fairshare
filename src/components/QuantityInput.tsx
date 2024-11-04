"use client";

import React from "react";

interface QuantityInputProps {
  value: string;
  setValue: (value: number) => void;
  className?: string; // Allow additional Tailwind classes
}

const QuantityInput: React.FC<QuantityInputProps> = ({
  value,
  setValue,
  className = "",
}) => {
  const handleDecrease = () => {
    if (parseInt(value) > 1) {
      setValue(parseInt(value) - 1);
    }
  };

  const handleIncrease = () => {
    if (value == "") {
      setValue(1);
      return;
    }
    setValue(parseInt(value) + 1);
  };

  return (
    <div className={`flex items-center ${className}`}>
      <button onClick={handleDecrease}>
        <i className="fas fa-minus p-1 text-midgray transition-transform duration-200 active:scale-90"></i>{" "}
      </button>
      <input
        type="number"
        value={value}
        readOnly
        className="w-full font-normal text-darkest shadow-custom-light placeholder-midgray rounded-xl p-2 text-center focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
      />
      <button onClick={handleIncrease}>
        <i className="fas fa-plus p-1 text-midgray transition-transform duration-200 active:scale-90"></i>{" "}
      </button>
    </div>
  );
};

export default QuantityInput;

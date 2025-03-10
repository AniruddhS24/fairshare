import React, { useState, useRef } from "react";

interface PriceInputProps {
  value: string;
  setValue: (value: string) => void;
  className?: string;
}

const PriceInput: React.FC<PriceInputProps> = ({
  value,
  setValue,
  className = "",
}) => {
  const [startedEdit, setStartedEdit] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null); // Ref to input

  const formatPrice = (val: string) => {
    const formatted = val.replace(/\D/g, ""); // Remove non-numeric characters
    if (formatted === "") {
      return "0.00";
    }
    const parsedValue = parseInt(formatted, 10);
    return (parsedValue / 100).toFixed(2);
  };

  const handleFocus = () => {
    if (!startedEdit) {
      setValue(""); // Clear input when first tapped
      setStartedEdit(true);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(formatPrice(e.target.value));
  };

  const handleBlur = () => {
    if (value === "") {
      setValue("0.00"); // Reset to 0.00 if empty
    }
    setStartedEdit(false);
  };

  // Move cursor to the end after every change
  const moveCursorToEnd = () => {
    if (inputRef.current) {
      const length = inputRef.current.value.length;
      inputRef.current.setSelectionRange(length, length); // Set the cursor at the end
    }
  };

  // Update cursor position when the value changes
  React.useEffect(() => {
    if (startedEdit && inputRef.current) {
      moveCursorToEnd();
    }
  }, [value, startedEdit]); // Only when value changes

  return (
    <div className="relative">
      <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">
        $
      </span>
      <input
        ref={inputRef}
        type="tel"
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={`w-full pl-4 pr-2 font-normal text-darkest bg-lightestgray placeholder-midgray rounded-xl py-2 ps-5 focus:outline-none ${className}`}
        placeholder="0.00"
      />
    </div>
  );
};

export default PriceInput;

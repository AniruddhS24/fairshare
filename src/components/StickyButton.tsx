// StickyButton.tsx
import React from 'react';
import Text from './Text';

interface StickyButtonProps {
  label: string;
  onClick: () => void;
  sticky?: boolean; // Prop to determine if the button should be sticky
}

const StickyButton: React.FC<StickyButtonProps> = ({ label, onClick, sticky = false }) => {
  return (
    <button
    onClick={onClick}
    className={`w-full max-w-[300px] bg-primary p-2.5 rounded-full transition-colors duration-150 ease-in-out active:bg-primarydark ${
        sticky ? 'fixed bottom-4 left-1/2 transform -translate-x-1/2 z-10 max-w-[90%]' : ''
    }`}
    >
        <Text type="button">{label}</Text>
    </button>
  );
};

export default StickyButton;

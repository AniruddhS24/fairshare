// StickyButton.tsx
import React from 'react';
import Text from './Text';

interface SquareButtonProps {
  label: string;
  color: 'primary' | 'accent';
  icon: string;
  onClick: () => void;
}

const SquareButton: React.FC<SquareButtonProps> = ({ label, color, icon, onClick}) => {
  
  const squareColors = {
    primary: {
        bg: 'bg-[#087A874D]',
        text: 'text-[#035660]',
        },
    accent: {
        bg: 'bg-[#B3D2A34D]',
        text: 'text-[#215C11]',
    },
  };

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center w-full px-4 pt-8 pb-4 ${squareColors[color].bg} rounded-lg transition-colors duration-150 ease-in-out active:scale-95`}
    >
      <i className={`fa-solid ${icon} fa-2xl ${squareColors[color].text}`}></i>
      <Text type="body_semi" className={`${squareColors[color].text} mt-6`}>
        {label}
      </Text>
    </button>

  );
};

export default SquareButton;

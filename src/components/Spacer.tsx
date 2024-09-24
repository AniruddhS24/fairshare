// Spacer.tsx
import React from 'react';

interface SpacerProps {
  size?: 'small' | 'medium' | 'large';
}

const sizeMap = {
  small: 'mb-2',     // 0.5rem (8px)
  medium: 'mb-4',    // 1rem (16px)
  large: 'mb-6',     // 1.5rem (24px)
};

const Spacer: React.FC<SpacerProps> = ({ size = 'medium' }) => {
  return <div className={sizeMap[size]} />;
};

export default Spacer;
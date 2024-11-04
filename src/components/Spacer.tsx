// Spacer.tsx
import React from 'react';

interface SpacerProps {
  size?: 'small' | 'medium' | 'large';
}

const sizeMap = {
  small: 'mb-2',
  medium: 'mb-4',
  large: 'mb-6',
};

const Spacer: React.FC<SpacerProps> = ({ size = 'medium' }) => {
  return <div className={sizeMap[size]} />;
};

export default Spacer;
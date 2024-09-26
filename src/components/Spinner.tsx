import React from 'react';
import Text from './Text';

interface SpinnerProps {
  color: string;
}

const Spinner: React.FC<SpinnerProps> = ({ color }) => {
  return (
    <div className={`animate-spin inline-block size-6 border-[3px] border-current border-t-transparent rounded-full ${color}`} role="status" aria-label="loading">
        <span className="sr-only">Loading...</span>
    </div>
  )
};

export default Spinner;

import React, { useState, useRef, useEffect } from 'react';

interface SegmentedToggleProps {
  tab1label: string;
  tab1icon: string;
  tab2label: string;
  tab2icon: string;
  selectedTab: number;
  setSelectedTab: (tab: number) => void;
}

const SegmentedToggle: React.FC<SegmentedToggleProps> = ({
  tab1label,
  tab1icon,
  tab2label,
  tab2icon,
  selectedTab,
  setSelectedTab
}) => {
  const tab1Ref = useRef<HTMLButtonElement>(null);
  const tab2Ref = useRef<HTMLButtonElement>(null);
  const [activeTabStyles, setActiveTabStyles] = useState({ width: 0, left: 0 });

  useEffect(() => {
    // Get the active tab's DOM node and its dimensions
    const activeTabRef = selectedTab === 0 ? tab1Ref.current : tab2Ref.current;
    
    if (activeTabRef) {
      const { offsetWidth, offsetLeft } = activeTabRef;
      setActiveTabStyles({
        width: offsetWidth,
        left: offsetLeft
      });
    }
  }, [selectedTab]);

  return (
    <div className={`rounded-full flex justify-between relative border border-lightgray`}>
      <div
        className="absolute top-0 h-full bg-primary rounded-full transition-all duration-300"
        style={{
          width: `${activeTabStyles.width}px`,
          left: `${activeTabStyles.left}px`
        }}
      ></div>

      <button
        ref={tab1Ref}
        onClick={() => setSelectedTab(0)}
        className={`z-10 text-center py-2 px-4 rounded-full transition-colors duration-300 ${
          selectedTab === 0 ? 'text-white font-medium' : 'text-midgray'
        }`}
      >
        <i className={`fas ${tab1icon} mr-2`}></i>
        {tab1label}
      </button>

      <button
        ref={tab2Ref}
        onClick={() => setSelectedTab(1)}
        className={`z-10 text-center py-2 px-4 rounded-full transition-colors duration-300 ${
          selectedTab === 1 ? 'text-white font-medium' : 'text-midgray'
        }`}
      >
        <i className={`fas ${tab2icon} mr-2`}></i>
        {tab2label}
      </button>
    </div>
  );
};

export default SegmentedToggle;

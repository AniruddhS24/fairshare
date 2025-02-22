import React from "react";

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
  setSelectedTab,
}) => {
  return (
    <div className="w-full h-10 bg-gray-100 rounded-md p-1">
      {/* Inner container with padding */}
      <div className="w-full h-full flex rounded-md relative">
        {/* Active background */}
        <div
          className={`absolute top-0 left-0 w-1/2 h-full rounded-md bg-white transition-all duration-300`}
          style={{
            transform:
              selectedTab === 0 ? "translateX(0%)" : "translateX(100%)",
          }}
        ></div>

        {/* Tab 1 */}
        <button
          onClick={() => setSelectedTab(0)}
          className={`flex-1 h-full flex items-center justify-center font-medium text-sm transition-colors duration-300 z-10 ${
            selectedTab === 0 ? "text-primary" : "text-gray-500"
          }`}
        >
          <i className={`fas ${tab1icon} mr-2`}></i>
          {tab1label}
        </button>

        {/* Tab 2 */}
        <button
          onClick={() => setSelectedTab(1)}
          className={`flex-1 h-full flex items-center justify-center font-medium text-sm transition-colors duration-300 z-10 ${
            selectedTab === 1 ? "text-primary" : "text-gray-500"
          }`}
        >
          <i className={`fas ${tab2icon} mr-2`}></i>
          {tab2label}
        </button>
      </div>
    </div>
  );
};

export default SegmentedToggle;

import React from "react";

interface ContainerProps {
  centered?: boolean;
  children: React.ReactNode;
}

const Container: React.FC<ContainerProps> = ({ children, centered }) => {
  return (
    <div
      className={`h-full flex flex-col ${
        centered ? "items-center" : "items-start"
      } justify-start bg-white px-4 pb-12`}
    >
      {children}
    </div>
  );
};

export default Container;

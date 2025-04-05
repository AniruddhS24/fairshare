import React from "react";
import Header from "@/components/Header";

interface ContainerProps {
  header?: boolean;
  onBack?: () => void;
  centered?: boolean;
  children: React.ReactNode;
}

const Container: React.FC<ContainerProps> = ({
  header,
  onBack,
  children,
  centered,
}) => {
  return (
    <>
      {header ? <Header onBack={onBack} /> : null}
      <div
        className={`h-full flex flex-col ${
          centered ? "items-center" : "items-start"
        } justify-start bg-white px-4 pb-12`}
      >
        {children}
      </div>
    </>
  );
};

export default Container;

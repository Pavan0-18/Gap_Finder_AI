import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = "",
  onClick,
  interactive,
}) => {
  const isInteractive = interactive ?? !!onClick;
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl p-6 ${
        isInteractive ? "glass-panel-interactive cursor-pointer" : "glass-panel"
      } ${className}`}
    >
      {children}
    </div>
  );
};

import React from 'react';
import { Bot } from 'lucide-react';

interface BrandBotProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const BrandBot = ({ size = "md", className = "" }: BrandBotProps) => {
  const sizes = {
    sm: "w-8 h-8 rounded-lg",
    md: "w-12 h-12 rounded-xl",
    lg: "w-32 h-32 rounded-[32px]",
    xl: "w-56 h-56 rounded-[48px]"
  };
  
  const iconSizes = {
    sm: "w-5 h-5",
    md: "w-8 h-8",
    lg: "w-20 h-20",
    xl: "w-36 h-36"
  };

  return (
    <div className={`${sizes[size]} bg-brand-accent flex items-center justify-center shrink-0 ${className} shadow-lg shadow-brand-accent/20`}>
      <Bot className={`${iconSizes[size]} text-black`} strokeWidth={2.5} />
    </div>
  );
};

export default BrandBot;

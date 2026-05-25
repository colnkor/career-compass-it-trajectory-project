import React from 'react';

interface StepCardProps {
  icon: string;
  title: string;
  description: string;
  stepNumber: number;
}

export const StepCard: React.FC<StepCardProps> = ({ icon, title, description, stepNumber }) => (
  <div className="min-h-[228px] p-[27px] rounded-[22px] flex flex-col bg-[rgba(17,19,24,0.52)] border border-white/[0.08] backdrop-blur-xl transition-all duration-200 hover:-translate-y-1 hover:border-accent-light/[0.28] hover:bg-[rgba(19,21,29,0.7)]">
    {/* Icon */}
    <div className="w-[43px] h-[43px] mb-[17px] grid place-items-center rounded-[13px] text-accent-light bg-accent/15 border border-accent-light/[0.14] text-[1.2rem] shrink-0">
      {icon}
    </div>

    {/* Step number */}
    <span className="text-[0.7rem] font-semibold tracking-[0.15em] uppercase text-muted mb-2">
      Шаг {stepNumber}
    </span>

    {/* Title */}
    <h3 className="font-display font-bold text-text text-[1.05rem] tracking-[-0.025em] mb-3">
      {title}
    </h3>

    {/* Description */}
    <p className="text-muted text-[0.86rem] leading-relaxed flex-1">
      {description}
    </p>
  </div>
);
import React from 'react';

interface StepCardProps {
  icon: string;
  title: string;
  description: string;
  stepNumber: number;
}

export const StepCard: React.FC<StepCardProps> = ({ icon, title, description, stepNumber }) => {
  return (
    <div className="relative bg-[#0b0c10] border border-white/5 rounded-2xl p-6 flex flex-col justify-between h-[240px] hover:border-white/10 transition-colors">
      <div>
        <div className="text-2xl mb-4 bg-white/5 w-10 h-10 flex items-center justify-center rounded-xl">{icon}</div>
        <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
        <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
      </div>
      <div className="text-xs text-gray-600 font-medium uppercase tracking-widest mt-4">
        Шаг {stepNumber}
      </div>
    </div>
  );
};
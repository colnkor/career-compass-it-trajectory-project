import React from 'react';

interface StepProgressDotsProps {
  totalSteps: number;
  currentStepIndex: number;
  answeredIndices: Set<number>;
}

export const StepProgressDots: React.FC<StepProgressDotsProps> = ({
  totalSteps,
  currentStepIndex,
  answeredIndices,
}) => {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: totalSteps }).map((_, idx) => {
        const isActive = idx === currentStepIndex;
        const isAnswered = answeredIndices.has(idx);

        return (
          <React.Fragment key={idx}>
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold border transition-all duration-200
                ${isAnswered
                  ? 'bg-emerald-500 border-emerald-500 text-white'
                  : isActive
                    ? 'bg-transparent border-[#6366f1] text-[#6366f1]'
                    : 'bg-transparent border-white/20 text-gray-500'
                }`}
            >
              {isAnswered ? '✓' : idx + 1}
            </div>
            {idx < totalSteps - 1 && (
              <div className={`h-px w-6 transition-all duration-200 ${isAnswered ? 'bg-emerald-500/50' : 'bg-white/10'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
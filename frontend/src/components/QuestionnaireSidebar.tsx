import React from 'react';

interface SidebarStep {
  label: string;
  icon: string;
}

interface SidebarProps {
  steps: SidebarStep[];
  currentStepIndex: number;
  answeredIndices: Set<number>;
  onStepClick: (index: number) => void;
}

export const QuestionnaireSidebar: React.FC<SidebarProps> = ({
  steps,
  currentStepIndex,
  answeredIndices,
  onStepClick,
}) => {
  return (
    <aside className="w-64 hidden lg:flex flex-col gap-6 pr-8 border-r border-white/5">
      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600">Разделы</span>
      <nav className="flex flex-col gap-1">
        {steps.map((step, idx) => {
          const isActive = idx === currentStepIndex;
          const isCompleted = answeredIndices.has(idx);

          return (
            <button
              key={idx}
              onClick={() => onStepClick(idx)}
              className={`flex items-center justify-between px-4 py-3 rounded-xl text-xs font-medium transition-all duration-200 text-left w-full cursor-pointer
                ${isActive
                  ? 'bg-[#11121a] text-white font-semibold'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-base">{step.icon}</span>
                <span>{step.label}</span>
              </div>
              {isCompleted && (
                <span className="text-emerald-500 text-sm font-bold">✓</span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
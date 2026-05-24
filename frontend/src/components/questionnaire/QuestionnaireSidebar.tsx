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
  mobile?: boolean; // ← новый проп
}

export const QuestionnaireSidebar: React.FC<SidebarProps> = ({
  steps, currentStepIndex, answeredIndices, onStepClick, mobile = false,
}) => {
  const nav = (
    <nav className="flex flex-col gap-1">
      {steps.map((step, idx) => {
        const isActive = idx === currentStepIndex;
        const isCompleted = answeredIndices.has(idx);
        return (
          <button
            key={idx}
            onClick={() => onStepClick(idx)}
            className={`flex items-center justify-between px-4 py-3 rounded-xl text-xs font-medium transition-all duration-200 text-left w-full cursor-pointer
              ${isActive ? 'bg-[#11121a] text-white font-semibold' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-base shrink-0">{step.icon}</span>
              {/* truncate вместо slice — CSS обрезает без переноса */}
              <span className="truncate">{step.label.replace('…', '')}</span>
            </div>
            {isCompleted && <span className="text-emerald-500 text-sm font-bold shrink-0 ml-2">✓</span>}
          </button>
        );
      })}
    </nav>
  );

  if (mobile) return nav; // ← для мобильного — просто nav без aside

  return (
    <aside className="w-64 hidden lg:flex flex-col gap-6 pr-8 border-r border-white/5">
      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600">Разделы</span>
      {nav}
    </aside>
  );
};
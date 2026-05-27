import React from 'react';
import type { RoadmapPhase } from '../../types/roadmap';

interface PhaseSidebarProps {
  professionName: string;
  phases: RoadmapPhase[];
  activePhaseId: number;
  completedTopics: Set<number>;
  onPhaseClick: (id: number) => void;
  // Mobile
  isOpen: boolean;
  onClose: () => void;
}

export const PhaseSidebar: React.FC<PhaseSidebarProps> = ({
  professionName,
  phases,
  activePhaseId,
  completedTopics,
  onPhaseClick,
  isOpen,
  onClose,
}) => {
  const handlePhaseClick = (id: number) => {
    onPhaseClick(id);
    onClose(); // на мобиле закрываем после выбора
  };

  const content = (
    <div className="flex flex-col gap-6 h-full">
      {/* Header */}
      <div className="flex items-start justify-between pb-4 border-b border-border-soft">
        <h1 className="font-display font-bold text-text text-lg leading-tight pr-4">
          {professionName}
        </h1>
        <button
          onClick={onClose}
          className="lg:hidden shrink-0 text-muted hover:text-text transition-colors text-lg leading-none mt-0.5"
        >
          ✕
        </button>
      </div>

      {/* Phase list */}
      <nav className="flex flex-col gap-1 overflow-y-auto flex-1 scrollbar-none">
        {phases.map((phase, i) => {
          const isActive = phase.id === activePhaseId;
          const doneCount = phase.topics.filter((t) => completedTopics.has(t.id)).length;
          const total = phase.topics.length;
          const allDone = total > 0 && doneCount === total;

          return (
            <button
              key={phase.id}
              onClick={() => handlePhaseClick(phase.id)}
              className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 border ${
                isActive
                  ? 'bg-accent/15 border-accent-light/30'
                  : 'border-transparent hover:bg-white/[0.04]'
              }`}
            >
              <span className={`text-[10px] font-semibold tracking-[0.15em] uppercase ${
                isActive ? 'text-accent-light' : 'text-muted/60'
              }`}>
                Фаза {i + 1}
              </span>
              <p className={`text-sm font-semibold mt-0.5 ${
                isActive ? 'text-text' : 'text-muted'
              }`}>
                {phase.title}
              </p>
              <p className={`text-xs mt-0.5 ${
                isActive ? 'text-accent-light/70' : 'text-muted/50'
              }`}>
                {allDone ? '✓ Завершено' : `${doneCount} / ${total} топиков`}
              </p>
            </button>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      {/* Desktop — статичный */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col">
        {content}
      </aside>

      {/* Mobile — backdrop */}
      <div
        className={`lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      {/* Mobile — sliding panel */}
      <aside
        className={`lg:hidden fixed left-0 top-0 h-full w-72 z-50 bg-card-strong border-r border-border-soft p-6 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {content}
      </aside>
    </>
  );
};
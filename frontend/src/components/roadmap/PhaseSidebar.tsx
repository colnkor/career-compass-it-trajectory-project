import React from 'react';
import type { RoadmapPhase } from '../../types/roadmap';

interface PhaseSidebarProps {
  professionName: string;
  phases: RoadmapPhase[];
  activePhaseId: number;
  completedTopics: Set<number>;
  onPhaseClick: (id: number) => void;
}

export const PhaseSidebar: React.FC<PhaseSidebarProps> = ({
  professionName,
  phases,
  activePhaseId,
  completedTopics,
  onPhaseClick,
}) => (
  <aside className="w-64 shrink-0 flex flex-col gap-6">
    {/* Profession name */}
    <div className="pb-4 border-b border-white/[0.08]">
      <h1 className="text-xl font-bold text-white leading-tight">{professionName}</h1>
    </div>

    {/* Phase list */}
    <nav className="flex flex-col gap-1">
      {phases.map((phase, i) => {
        const isActive = phase.id === activePhaseId;
        const doneCount = phase.topics.filter((t) => completedTopics.has(t.id)).length;
        const total = phase.topics.length;
        const allDone = total > 0 && doneCount === total;

        return (
          <button
            key={phase.id}
            onClick={() => onPhaseClick(phase.id)}
            className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 ${
              isActive
                ? 'bg-[#6366f1]/15 border border-[#6366f1]/30'
                : 'hover:bg-white/[0.04] border border-transparent'
            }`}
          >
            <span
              className={`text-[10px] font-semibold tracking-[0.15em] uppercase ${
                isActive ? 'text-[#818cf8]' : 'text-gray-600'
              }`}
            >
              Фаза {i + 1}
            </span>
            <p
              className={`text-sm font-semibold mt-0.5 ${
                isActive ? 'text-white' : 'text-gray-400'
              }`}
            >
              {phase.title}
            </p>
            <p className={`text-xs mt-0.5 ${isActive ? 'text-[#818cf8]/70' : 'text-gray-600'}`}>
              {allDone ? '✓ Завершено' : `${doneCount} / ${total} топиков`}
            </p>
          </button>
        );
      })}
    </nav>
  </aside>
);
import React from 'react';
import { ProfessionCard } from './ProfessionCard';
import { HowItWorks } from './HowItWorks';
import type { ProfessionResult } from '../../types/profession';

interface ProfessionsResultProps {
  results: ProfessionResult[];
}

export const ProfessionsResult: React.FC<ProfessionsResultProps> = ({ results }) => (
  <main className="w-[min(1400px,100%)] mx-auto px-7 py-14 flex flex-col gap-12">
    {/* Heading */}
    <div className="flex flex-col gap-2 z-2">
      <h1 className="font-display font-extrabold text-text tracking-[-0.04em] text-[clamp(1.8rem,3vw,2.4rem)]">
        Твои профессии
      </h1>
      <p className="text-muted text-base">
        На основе ответов система подобрала{' '}
        <span className="text-accent-light font-medium">
          {results.length}{' '}
          {results.length === 1 ? 'наиболее подходящее направление' : 'наиболее подходящих направления'}
        </span>
      </p>
    </div>

    {/* Cards grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[18px]">
      {results.map((result, i) => (
        <ProfessionCard
          key={result.profession.id}
          profession={result.profession}
          confidence={result.confidence}
          index={i}
        />
      ))}
    </div>

    <HowItWorks />
  </main>
);
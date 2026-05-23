import React from 'react';
import { ProfessionCard } from './ProfessionCard';
import { HowItWorks } from './HowItWorks';
import type { ProfessionResult } from '../../types/profession';

interface ProfessionsResultProps {
  results: ProfessionResult[];
}

export const ProfessionsResult: React.FC<ProfessionsResultProps> = ({ results }) => (
  <main className="max-w-7xl mx-auto px-6 py-14 flex flex-col gap-12">
    <div className="flex flex-col gap-2">
      <h1 className="text-4xl font-bold tracking-tight text-white">Твои профессии</h1>
      <p className="text-gray-400 text-base">
        На основе ответов система подобрала{' '}
        <span className="text-[#818cf8] font-medium">
          {results.length}{' '}
          {results.length === 1 ? 'наиболее подходящее направление' : 'наиболее подходящих направления'}
        </span>
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {results.map((result, i) => (
        <ProfessionCard key={result.profession.id} result={result} index={i} />
      ))}
    </div>

    <HowItWorks />
  </main>
);
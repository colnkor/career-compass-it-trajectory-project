import { createFileRoute } from '@tanstack/react-router';
import { Questionnaire } from '../components/Questionnaire'; // Укажи свой путь к компоненту
import type { Question } from '../types/questionnaire';

export const Route = createFileRoute('/questionnaire')({
  // Лоадер для предварительной загрузки данных с бэкенда
  loader: async (): Promise<Question[]> => {
    const response = await fetch('/api/questionnaire/');
    
    if (!response.ok) {
      console.log(response.status);
      throw new Error('Не удалось загрузить данные опросника');
    }
    
    const data: Question[] = await response.json();

    // Сортируем и фильтруем данные на этапе загрузки
    return data
      .filter((q) => q.is_active)
      .sort((a, b) => a.order - b.order);
  },
  
  // Компонент, который отрендерится при успешной загрузке
  component: Questionnaire,
  
  // Опционально: красивое состояние загрузки прямо в роутере
  pendingComponent: () => (
    <div className="min-h-screen bg-[#0a0b10] flex items-center justify-center">
      <div className="text-[#6366f1] text-sm tracking-wider animate-pulse flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#6366f1] animate-ping" />
        Загрузка конфигурации опроса...
      </div>
    </div>
  ),
  
  // Опционально: обработка ошибок (например, если бэк упал)
  errorComponent: ({ error }) => (
    <div className="min-h-screen bg-[#0a0b10] flex items-center justify-center flex-col gap-4">
      <div className="text-red-400 text-sm">Упс! Произошла ошибка при загрузке.</div>
      <pre className="text-xs text-gray-500 bg-white/5 p-4 rounded-xl">{error.message}</pre>
    </div>
  ),
});
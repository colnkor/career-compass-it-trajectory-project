import { createFileRoute, Link } from '@tanstack/react-router';
import { Header } from '../components/Header';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { StatCard } from '../components/StatCard';
import { StepCard } from '../components/StepCard';

export const Route = createFileRoute('/')({
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050508] text-white flex flex-col font-sans selection:bg-[#6366f1]/30">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 pt-16 pb-24 flex flex-col items-center justify-center">
        
        {/* HERO SECTION */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <Badge>Бесплатно · Без регистрации</Badge>
          
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white mt-6 mb-6 leading-[1.15]">
            Найди свою профессию <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-[#a5b4fc] to-[#6366f1]">
              в IT за 5 минут
            </span>
          </h1>
          
          <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Ответь на вопросы про навыки, интересы и приоритеты — получи 3 подходящих профессии и персональную дорожную карту на 12 месяцев
          </p>
          
          {/* Кнопки действий с роутингом */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            {/* TanStack Link для перехода на страницу опроса */}
            <Link to="/questionnaire" className="w-full sm:w-auto">
              <Button variant="primary" className="w-full sm:w-auto px-8 py-4 text-base">
                Пройти опрос →
              </Button>
            </Link>
            
            <Button variant="secondary" className="w-full sm:w-auto px-8 py-4 text-base">
              Смотреть профессии
            </Button>
          </div>
        </div>

        {/* STATS SECTION */}
        <div className="w-full max-w-4xl bg-[#090a0f] border border-white/5 rounded-2xl grid grid-cols-2 md:grid-cols-4 p-2 mb-16 shadow-2xl">
          <StatCard value="12+" label="IT-профессий в базе" />
          <StatCard value="50+" label="Ресурсов для обучения" />
          <StatCard value="12" label="Месяцев план действий" />
          <StatCard value="5 мин" label="Длина опросника" />
        </div>

        {/* STEPS SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
          <StepCard 
            icon="📝"
            title="Умный опросник"
            description="5 блоков вопросов: навыки, интересы, приоритеты, время и опыт. Алгоритм учитывает реальный спрос рынка."
            stepNumber={1}
          />
          <StepCard 
            icon="🎯"
            title="3 профессии под тебя"
            description="Прозрачный алгоритм с объяснением — почему именно эти профессии подходят тебе по навыкам и интересам."
            stepNumber={2}
          />
          <StepCard 
            icon="🗺️"
            title="Дорожная карта на год"
            description="Что учить, в каком порядке, какие ресурсы использовать, в каких хакатонах участвовать и куда отправлять резюме."
            stepNumber={3}
          />
        </div>

      </main>
    </div>
  );
}
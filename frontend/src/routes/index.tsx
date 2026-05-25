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
    <div className="relative min-h-screen bg-bg text-text font-body overflow-x-hidden">
      {/* Aurora animated background */}
      <div className="aurora-bg" />

      {/* Content above aurora */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />

        <main className="flex-1 w-[min(1400px,100%)] mx-auto px-7 pt-[clamp(42px,7vw,78px)] pb-[62px] flex flex-col items-center">

          {/* ── Hero ──────────────────────────────────────────────────────── */}
          <div className="max-w-[850px] w-full text-center mb-[50px]">
            <Badge>Выбери профессию прямо сейчас</Badge>

            <h1 className="font-display font-extrabold text-text leading-[1.04] tracking-[-0.07em] text-[clamp(2.8rem,6.8vw,5.15rem)] mt-[30px] mb-[17px]">
              Найди свою профессию{' '}
              <br className="hidden sm:block" />
              <span className="hero-accent-gradient">в IT за 5 минут</span>
            </h1>

            <p className="max-w-[650px] mx-auto text-muted leading-[1.7] text-[clamp(0.98rem,1.4vw,1.08rem)]">
              Ответь на вопросы про навыки, интересы и приоритеты — получи 3 подходящих профессии и персональную дорожную карту на 12 месяцев
            </p>

            <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-[14px]">
              <Link to="/questionnaire" className="w-full sm:w-auto">
                <Button variant="primary" className="w-full min-h-[52px] px-[30px] text-[0.95rem]">
                  Пройти опрос
                </Button>
              </Link>
              <Link to="/professions" className="w-full sm:w-auto">
                <Button variant="secondary" className="w-full min-h-[52px] px-[30px] text-[0.95rem]">
                  Смотреть профессии
                </Button>
              </Link>
            </div>
          </div>

          {/* ── Stats panel ───────────────────────────────────────────────── */}
          <div className="w-[min(930px,100%)] mb-[38px] rounded-[22px] grid grid-cols-2 md:grid-cols-4 overflow-hidden border border-white/[0.08] bg-card backdrop-blur-xl shadow-glass">
            <StatCard value="12+" label="IT-профессий в базе" />
            <StatCard value="50+" label="Ресурсов для обучения" />
            <StatCard value="12"  label="Месяцев план действий" />
            <StatCard value="5 мин" label="Длина опросника" />
          </div>

          {/* ── Feature grid ──────────────────────────────────────────────── */}
          <div className="w-[min(1060px,100%)] grid grid-cols-1 md:grid-cols-3 gap-[18px]">
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
    </div>
  );
}
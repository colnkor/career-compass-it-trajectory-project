import React, { useState } from 'react';
import { Link, useRouteContext } from '@tanstack/react-router';
import { Button } from './ui/Button';
import { AuthModal } from './AuthModal';

function getInitials(name: string): string {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

export const Header: React.FC = () => {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');

  const { auth } = useRouteContext({ from: '__root__' });

  const openAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  return (
    <header className="w-full max-w-7xl mx-auto px-6 py-4 flex items-center justify-between border-b border-white/5">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 text-white font-bold text-lg tracking-tight">
        <span className="text-[#6366f1]">✦</span> Карьерный компас
      </Link>

      {/* Nav — only when authenticated */}
      {auth.isAuthenticated && (
        <nav className="hidden md:flex items-center gap-8 text-sm text-gray-400">
          <Link to="/questionnaire" className="hover:text-white transition-colors">Опросник</Link>
          <Link to="/professions"   className="hover:text-white transition-colors">Профессии</Link>
        </nav>
      )}

      {/* Right side */}
      <div className="flex items-center gap-4">
        {auth.isAuthenticated ? (
          <Link
            to="/profile"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.07] transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-[#6366f1]/20 flex items-center justify-center text-[10px] font-bold text-[#818cf8]">
              {auth.user ? getInitials(auth.user.full_name) : 'U'}
            </div>
            <span className="text-sm text-gray-300">Мой профиль</span>
          </Link>
        ) : (
          <>
            <Button variant="outline" className="px-4 py-2" onClick={() => openAuth('login')}>
              Войти
            </Button>
            <Button variant="primary" className="px-4 py-2" onClick={() => openAuth('register')}>
              Начать бесплатно →
            </Button>
          </>
        )}
      </div>

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        mode={authMode}
        onModeChange={setAuthMode}
        showOAuth={false}
      />
    </header>
  );
};
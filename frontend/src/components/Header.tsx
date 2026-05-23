import React, { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Button } from './ui/Button';
import { AuthModal } from './AuthModal';

export const Header: React.FC = () => {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');

  const openAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  return (
    <header className="w-full max-w-7xl mx-auto px-6 py-4 flex items-center justify-between border-b border-white/5">
      {/* Логотип */}
      <Link to="/" className="flex items-center gap-2 text-white font-bold text-lg tracking-tight">
        <span className="text-[#6366f1]">✦</span> Карьерный компас
      </Link>

      {/* Навигация */}
      <nav className="hidden md:flex items-center gap-8 text-sm text-gray-400">
        <Link to="/professions" className="hover:text-white transition-colors">Профессии</Link>
        <Link to="/about" className="hover:text-white transition-colors">О проекте</Link>
      </nav>

      {/* Кнопки авторизации */}
      <div className="flex items-center gap-4">
        <Button variant="outline" className="px-4 py-2" onClick={() => { openAuth('login') }}>Войти</Button>
        <Button variant="primary" className="px-4 py-2" onClick={() => { openAuth('register'); }}>Начать бесплатно →</Button>
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
import React, { useState } from 'react';
import { Link, useRouteContext } from '@tanstack/react-router';
import { Button } from './ui/Button';
import { AuthModal } from './AuthModal';
import { LogoutModal } from './profile/modals/LogoutAccountModal';

function getInitials(name: string): string {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

export const Header: React.FC = () => {
  const [authOpen, setAuthOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');

  const { auth } = useRouteContext({ from: '__root__' });

  const openAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  const openLogout = () => {
    setLogoutOpen(true);
  };

  return (
    <header className="w-full max-w-[min(1400px,calc(100%-56px))] mx-auto min-h-[82px] py-[22px] pb-[18px] flex items-center justify-between gap-4 border-b border-white/[0.06] relative">
 
      {/* Logo */}
      <Link to="/" className="logo-gradient inline-flex items-center gap-2 font-display font-extrabold text-[clamp(1.1rem,1.45vw,1.55rem)] tracking-[-0.045em] shrink-0">
        <span className="text-accent-light drop-shadow-[0_0_12px_rgba(175,169,236,0.65)]">✦</span>
        <span className="hidden min-[960px]:inline">
          Карьерный компас
        </span>
      </Link>
 
      <nav className="flex absolute left-1/2 -translate-x-1/2 items-center gap-8 text-muted text-[0.86rem] font-medium gap-8">
        <Link to="/questionnaire" className="hover:text-text transition-colors duration-180">Опросник</Link>
        <Link to="/professions"   className="hover:text-text transition-colors duration-180">Профессии</Link>
      </nav>
 
      {/* Right side */}
      <div className="ml-auto flex items-center gap-3">
        {auth.isAuthenticated ? (
          <>
            <Link
              to="/profile"
              className="flex items-center gap-2 px-[15px] pl-2 py-[6px] rounded-full border border-white/10 bg-[rgba(30,33,48,0.65)] text-[#d9dce5] transition-all duration-180 hover:border-accent-light/34 hover:bg-[rgba(38,39,55,0.85)]"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent to-accent-light flex items-center justify-center text-[0.7rem] font-bold text-white shrink-0">
                {auth.user ? getInitials(auth.user.full_name) : '?'}
              </div>
              <span className="text-sm hidden sm:block">Мой профиль</span>
            </Link>
            <Button variant="outline" className="px-4 py-2" onClick={() => openLogout()}>
              Выйти
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" className="px-4 py-2" onClick={() => openAuth('login')}>
              Войти
            </Button>
            <Button variant="primary" className="px-4 py-2" onClick={() => openAuth('register')}>
              Зарегистироваться
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
      <LogoutModal
        isOpen={logoutOpen}
        onClose={() => setLogoutOpen(false)}
      />
    </header>
  );
};
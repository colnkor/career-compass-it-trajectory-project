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
  
  // Новое состояние для мобильного меню
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { auth } = useRouteContext({ from: '__root__' });

  const openAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setAuthOpen(true);
    setIsMobileMenuOpen(false); // Закрываем меню на мобильном при клике
  };

  const openLogout = () => {
    setLogoutOpen(true);
    setIsMobileMenuOpen(false); // Закрываем меню на мобильном при клике
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="w-full max-w-[min(1400px,calc(100%-56px))] mx-auto min-h-[82px] py-[22px] pb-[18px] flex items-center justify-between gap-4 border-b border-white/[0.06] relative z-50">
      
      {/* Logo */}
      <Link to="/" className="logo-gradient inline-flex items-center gap-2 font-display font-extrabold text-[clamp(1.1rem,1.45vw,1.55rem)] tracking-[-0.045em] shrink-0" onClick={closeMobileMenu}>
        <span className="text-accent-light drop-shadow-[0_0_12px_rgba(175,169,236,0.65)]">✦</span>
        <span className="hidden min-[960px]:inline">
          Карьерный компас
        </span>
      </Link>

      {/* Desktop Navigation (скрыта на мобильных) */}
      <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center text-muted text-[0.86rem] font-medium gap-8">
        <Link to="/questionnaire" className="hover:text-text transition-colors duration-180">Опросник</Link>
        <Link to="/professions" className="hover:text-text transition-colors duration-180">Профессии</Link>
      </nav>

      {/* Desktop Right side (скрыт на мобильных) */}
      <div className="hidden md:flex ml-auto items-center gap-3">
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
              Зарегистрироваться
            </Button>
          </>
        )}
      </div>

      {/* Mobile Hamburger Button (виден только на мобильных) */}
      <button 
        className="ml-auto md:hidden p-2 text-muted hover:text-white transition-colors focus:outline-none"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="absolute top-[82px] left-0 w-full bg-[#181a25] border-b border-x border-white/[0.06] rounded-b-2xl shadow-2xl flex flex-col gap-5 p-5 md:hidden z-40 backdrop-blur-xl">
          <nav className="flex flex-col gap-4 text-[1rem] font-medium text-muted">
            <Link to="/questionnaire" onClick={closeMobileMenu} className="hover:text-white transition-colors">Опросник</Link>
            <Link to="/professions" onClick={closeMobileMenu} className="hover:text-white transition-colors">Профессии</Link>
          </nav>
          
          <div className="h-[1px] w-full bg-white/[0.06]"></div>
          
          <div className="flex flex-col gap-3">
            {auth.isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  onClick={closeMobileMenu}
                  className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-[rgba(30,33,48,0.65)] text-[#d9dce5]"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent to-accent-light flex items-center justify-center text-[0.85rem] font-bold text-white shrink-0">
                    {auth.user ? getInitials(auth.user.full_name) : '?'}
                  </div>
                  <span className="font-medium">Мой профиль</span>
                </Link>
                <Button variant="outline" className="w-full justify-center py-3" onClick={() => openLogout()}>
                  Выйти
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" className="w-full justify-center py-3" onClick={() => openAuth('login')}>
                  Войти
                </Button>
                <Button variant="primary" className="w-full justify-center py-3" onClick={() => openAuth('register')}>
                  Зарегистрироваться
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
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
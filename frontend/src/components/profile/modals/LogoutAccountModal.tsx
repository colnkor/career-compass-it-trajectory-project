import React, { useState, useEffect } from 'react';
import { Button } from '../../ui/Button';
import { useNavigate } from '@tanstack/react-router';

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LogoutModal: React.FC<LogoutModalProps> = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Закрытие по нажатию на Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleLogout = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail ?? 'Не удалось выйти из аккаунта');
      }

      // Очищаем токены, если они хранятся в localStorage
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');

      onClose();
      navigate({ to: '/' });
      window.location.reload(); // Перезагружаем страницу для полного сброса стейта приложения
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Card */}
      <div className="relative w-full max-w-md bg-[rgba(15,17,25,0.95)] border border-border-soft rounded-[23px] p-8 flex flex-col gap-0 shadow-glass backdrop-blur-xl">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-muted hover:text-text transition-colors text-lg leading-none"
        >
          ✕
        </button>

        {/* Logo */}
        <div className="font-display font-extrabold text-[1.1rem] tracking-[-0.04em] mb-6">
          <span className="logo-gradient">Карьерный компас</span>
        </div>

        {/* Title & Description */}
        <h2 className="font-display font-extrabold text-text text-[1.55rem] tracking-[-0.04em] leading-tight">
          Выйти из аккаунта
        </h2>
        <p className="text-muted text-sm mt-1 mb-6">
          Вы уверены, что хотите выйти? Для доступа к вашему прогрессу и дорожным картам потребуется повторная авторизация.
        </p>

        {/* Error Handling */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-danger/10 border border-danger/25 text-danger text-sm">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-2">
          <Button
            variant="outline"
            className="flex-1 py-3 text-sm"
            onClick={onClose}
            disabled={loading}
          >
            Отмена
          </Button>
          <button
            onClick={handleLogout}
            disabled={loading}
            className="flex-1 py-3 text-sm font-medium rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-200 hover:bg-zinc-700 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Выходим…' : 'Выйти'}
          </button>
        </div>
      </div>
    </div>
  );
};
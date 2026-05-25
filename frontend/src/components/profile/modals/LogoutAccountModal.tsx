import React, { useState } from 'react';
import { ModalBase } from './ModalBase';
import { Button } from '../../ui/Button';
import { useNavigate } from '@tanstack/react-router';

interface LogoutModalProps {
  onClose: () => void;
}

export const LogoutModal: React.FC<LogoutModalProps> = ({ onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogout = async () => {
    setLoading(true);
    setError(null);
    try {
      // Отправляем запрос на выход (обычно POST)
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (!res.ok) throw new Error('Не удалось выйти из аккаунта');
      
      // Перенаправляем пользователя на главную или страницу входа
      navigate({ to: '/' });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
      setLoading(false);
    }
  };

  return (
    <ModalBase title="Выйти из аккаунта" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <p className="text-gray-400 text-sm leading-relaxed">
          Вы уверены, что хотите выйти? Для повторного доступа к вашему прогрессу и дорожным картам потребуется снова авторизоваться.
        </p>
        
        {error && <p className="text-red-400 text-sm">{error}</p>}
        
        <div className="flex gap-3 justify-end">
          <Button variant="outline" className="px-4 py-2" onClick={onClose}>
            Отмена
          </Button>
          <button
            onClick={handleLogout}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-200 hover:bg-zinc-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Выходим…' : 'Выйти'}
          </button>
        </div>
      </div>
    </ModalBase>
  );
};
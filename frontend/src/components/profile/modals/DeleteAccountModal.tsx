import React, { useState } from 'react';
import { ModalBase } from './ModalBase';
import { Button } from '../../ui/Button';
import { useNavigate } from '@tanstack/react-router';

interface DeleteAccountModalProps {
  onClose: () => void;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({ onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/users/me', { method: 'DELETE' });
      if (!res.ok) throw new Error('Не удалось удалить аккаунт');
      navigate({ to: '/' });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
      setLoading(false);
    }
  };

  return (
    <ModalBase title="Удалить аккаунт" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <p className="text-gray-400 text-sm leading-relaxed">
          Это действие необратимо. Все данные, включая прогресс по дорожным картам, будут удалены без возможности восстановления.
        </p>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <div className="flex gap-3 justify-end">
          <Button variant="outline" className="px-4 py-2" onClick={onClose}>Отмена</Button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="px-4 py-2 text-sm rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
          >
            {loading ? 'Удаляем…' : 'Удалить аккаунт'}
          </button>
        </div>
      </div>
    </ModalBase>
  );
};
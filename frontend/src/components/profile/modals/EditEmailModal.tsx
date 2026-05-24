import React, { useState } from 'react';
import { ModalBase } from './ModalBase';
import { InputField } from '../../ui/InputField';
import { Button } from '../../ui/Button';
import authFetch from '../../../utils/api';

interface EditEmailModalProps {
  currentEmail: string;
  onClose: () => void;
  onSuccess: (newEmail: string) => void;
}

export const EditEmailModal: React.FC<EditEmailModalProps> = ({
  currentEmail,
  onClose,
  onSuccess,
}) => {
  const [value, setValue] = useState(currentEmail);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!value.trim() || !value.includes('@')) { setError('Введи корректный email'); return; }

    setLoading(true);
    setError(null);
    try {
      const res = await authFetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: value.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail === 'Email already registered' ? 'Этот email уже занят' : data.detail ?? 'Ошибка');
      }
      onSuccess(value.trim());
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось сохранить');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalBase title="Изменить email" onClose={onClose}>
      <InputField
        label="Email"
        type="email"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="you@example.com"
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
      />
      {error && <p className="text-red-400 text-sm -mt-2">{error}</p>}
      <div className="flex gap-3 justify-end">
        <Button variant="outline" className="px-4 py-2" onClick={onClose}>Отмена</Button>
        <Button variant="primary" className="px-4 py-2" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Сохраняем…' : 'Сохранить'}
        </Button>
      </div>
    </ModalBase>
  );
};
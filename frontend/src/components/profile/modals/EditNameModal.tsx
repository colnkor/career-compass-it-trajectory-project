import React, { useState } from 'react';
import { ModalBase } from './ModalBase';
import { InputField } from '../../ui/InputField';
import { Button } from '../../ui/Button';
import authFetch from '../../../utils/api';

interface EditNameModalProps {
  currentName: string;
  onClose: () => void;
  onSuccess: (newName: string) => void;
}

export const EditNameModal: React.FC<EditNameModalProps> = ({
  currentName,
  onClose,
  onSuccess,
}) => {
  const [value, setValue] = useState(currentName);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!value.trim()) { setError('Имя не может быть пустым'); return; }

    setLoading(true);
    setError(null);
    try {
      const res = await authFetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: value.trim() }),
      });
      if (!res.ok) throw new Error((await res.json()).detail ?? 'Ошибка');
      onSuccess(value.trim());
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось сохранить');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalBase title="Изменить имя" onClose={onClose}>
      <InputField
        label="Полное имя"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Иван Иванов"
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
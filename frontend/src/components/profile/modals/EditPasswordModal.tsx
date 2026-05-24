import React, { useState } from 'react';
import { ModalBase } from './ModalBase';
import { InputField } from '../../ui/InputField';
import { Button } from '../../ui/Button';
import authFetch from '../../../utils/api';

interface EditPasswordModalProps {
  onClose: () => void;
}

export const EditPasswordModal: React.FC<EditPasswordModalProps> = ({ onClose }) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!oldPassword) { setError('Введи текущий пароль'); return; }
    if (newPassword.length < 8) { setError('Новый пароль — минимум 8 символов'); return; }
    if (newPassword !== confirm) { setError('Пароли не совпадают'); return; }

    setLoading(true);
    setError(null);
    try {
      const res = await authFetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(
          data.detail === 'Incorrect old password' ? 'Неверный текущий пароль' : data.detail ?? 'Ошибка'
        );
      }
      setSuccess(true);
      setTimeout(onClose, 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось сохранить');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalBase title="Сменить пароль" onClose={onClose}>
      {success ? (
        <p className="text-emerald-400 text-sm text-center py-2">✓ Пароль успешно изменён</p>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            <InputField
              label="Текущий пароль"
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="••••••••"
            />
            <InputField
              label="Новый пароль"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Минимум 8 символов"
            />
            <InputField
              label="Повтори новый пароль"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>
          {error && <p className="text-red-400 text-sm -mt-1">{error}</p>}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" className="px-4 py-2" onClick={onClose}>Отмена</Button>
            <Button variant="primary" className="px-4 py-2" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Сохраняем…' : 'Сменить пароль'}
            </Button>
          </div>
        </>
      )}
    </ModalBase>
  );
};
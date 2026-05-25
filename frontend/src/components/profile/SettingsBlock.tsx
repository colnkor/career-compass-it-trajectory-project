import React, { useState } from 'react';
import type { User } from '../../types/user';
import { EditNameModal } from './modals/EditNameModal';
import { EditEmailModal } from './modals/EditEmailModal';
import { EditPasswordModal } from './modals/EditPasswordModal';
import { DeleteAccountModal } from './modals/DeleteAccountModal';

type Modal = 'name' | 'email' | 'password' | 'delete' | null;

interface SettingsBlockProps {
  user: User;
  onUserUpdate: (updated: Partial<User>) => void;
}

export const SettingsBlock: React.FC<SettingsBlockProps> = ({ user, onUserUpdate }) => {
  const [modal, setModal] = useState<Modal>(null);

  return (
    <>
      <div className="rounded-2xl border border-white/[0.08] bg-[#0d0e18] p-6 flex flex-col gap-5">
        <h2 className="text-white font-semibold flex items-center gap-2">
          <span className="text-[#818cf8]">⚙</span> Настройки
        </h2>

        <div className="flex flex-col gap-1">
          <SettingRow
            label="Имя"
            value={user.full_name}
            action="Изменить"
            onAction={() => setModal('name')}
          />
          <SettingRow
            label="Email"
            value={user.email}
            action="Изменить"
            onAction={() => setModal('email')}
          />
          <SettingRow
            label="Пароль"
            value="••••••••"
            action="Сменить"
            onAction={() => setModal('password')}
          />
        </div>

        {/* Danger zone */}
        <div className="pt-4 border-t border-white/[0.06]">
          <button
            onClick={() => setModal('delete')}
            className="cursor-pointer text-sm text-red-400/70 hover:text-red-400 transition-colors"
          >
            Удалить аккаунт
          </button>
        </div>
      </div>

      {/* Modals */}
      {modal === 'name' && (
        <EditNameModal
          currentName={user.full_name}
          onClose={() => setModal(null)}
          onSuccess={(full_name) => onUserUpdate({ full_name })}
        />
      )}
      {modal === 'email' && (
        <EditEmailModal
          currentEmail={user.email}
          onClose={() => setModal(null)}
          onSuccess={(email) => onUserUpdate({ email })}
        />
      )}
      {modal === 'password' && (
        <EditPasswordModal onClose={() => setModal(null)} />
      )}
      {modal === 'delete' && (
        <DeleteAccountModal onClose={() => setModal(null)} />
      )}
    </>
  );
};

function SettingRow({
  label,
  value,
  action,
  onAction,
}: {
  label: string;
  value: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/[0.05] last:border-0">
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-gray-500">{label}</span>
        <span className="text-sm text-gray-300">{value}</span>
      </div>
      <button
        onClick={onAction}
        className="cursor-pointer text-xs text-[#818cf8] hover:text-white transition-colors"
      >
        {action}
      </button>
    </div>
  );
}
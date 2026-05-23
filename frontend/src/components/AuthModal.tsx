import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { InputField } from './ui/InputField';

type AuthMode = 'login' | 'register';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  showOAuth?: boolean;
  onSuccess?: (token: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  mode = 'register',
  onModeChange,
  showOAuth = false,
  onSuccess,
}) => {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState<Partial<typeof form>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setForm({ name: '', email: '', password: '' });
    setErrors({});
    setApiError(null);
  }, [mode]);

  if (!isOpen) return null;

  const handleChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
    setApiError(null);
  };

  const validate = (): boolean => {
    const newErrors: Partial<typeof form> = {};
    if (mode === 'register' && !form.name.trim()) newErrors.name = 'Введите имя и фамилию';
    if (!form.email.trim()) newErrors.email = 'Введите email';
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Некорректный email';
    if (!form.password) newErrors.password = 'Введите пароль';
    else if (form.password.length < 6) newErrors.password = 'Минимум 6 символов';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Логин — form-urlencoded (OAuth2PasswordRequestForm ожидает именно это)
  const loginRequest = async () => {
    const body = new URLSearchParams();
    body.append('username', form.email); // FastAPI OAuth2 использует поле `username` для email
    body.append('password', form.password);

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(
        data.detail === 'Incorrect email or password'
          ? 'Неверный email или пароль'
          : data.detail ?? 'Ошибка входа'
      );
    }

    const data = await res.json();
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    onSuccess?.(data.access_token);
    onClose();
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setApiError(null);

    try {
      if (mode === 'register') {
        // Регистрация — JSON
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: form.email,
            password: form.password,
            full_name: form.name,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(
            data.detail === 'Email already registered'
              ? 'Этот email уже зарегистрирован'
              : data.detail ?? 'Ошибка регистрации'
          );
        }

        // После регистрации — сразу логинимся
        await loginRequest();
      } else {
        await loginRequest();
      }
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-md bg-[#0d0e16] border border-white/10 rounded-3xl p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all cursor-pointer"
        >
          ✕
        </button>

        <div className="text-center mb-6">
          <span className="text-xl font-bold text-white">
            Карьерный <span className="text-[#6366f1]">компас</span>
          </span>
        </div>

        <h2 className="text-2xl font-bold text-white mb-1">
          {mode === 'register' ? 'Создать аккаунт' : 'Войти в аккаунт'}
        </h2>
        <p className="text-sm text-gray-400 border-l-2 border-[#6366f1] pl-3 mb-6">
          {mode === 'register' ? 'Начни свой карьерный трек в IT бесплатно' : 'Рады видеть тебя снова'}
        </p>

        <div className="flex flex-col gap-4">
          {mode === 'register' && (
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5 block">Имя и фамилия</label>
              <InputField placeholder="Алексей Смирнов" value={form.name} onChange={handleChange('name')} />
              {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
            </div>
          )}

          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5 block">Электронная почта</label>
            <InputField type="email" placeholder="hello@example.com" value={form.email} onChange={handleChange('email')} />
            {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5 block">Пароль</label>
            <InputField type="password" placeholder="минимум 6 символов" value={form.password} onChange={handleChange('password')} />
            {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password}</p>}
          </div>
        </div>

        {apiError && (
          <div className="mt-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
            {apiError}
          </div>
        )}

        <Button
          variant="primary"
          className="w-full mt-6 py-4 text-base"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Подождите...' : mode === 'register' ? 'Зарегистрироваться' : 'Войти'}
        </Button>

        {showOAuth && (
          <>
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-gray-500">Или через</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>
            <div className="flex justify-center gap-3">
              <button className="w-12 h-12 rounded-full bg-[#11121a] border border-white/10 hover:border-white/20 flex items-center justify-center transition-all cursor-pointer">
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </button>
              <button className="w-12 h-12 rounded-full bg-[#11121a] border border-white/10 hover:border-white/20 flex items-center justify-center transition-all cursor-pointer">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                </svg>
              </button>
            </div>
          </>
        )}

        <p className="text-center text-xs text-gray-500 mt-6">
          {mode === 'register' ? 'Уже есть аккаунт?' : 'Нет аккаунта?'}{' '}
          <button
            onClick={() => onModeChange(mode === 'register' ? 'login' : 'register')}
            className="text-[#6366f1] hover:underline cursor-pointer"
          >
            {mode === 'register' ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </p>
      </div>
    </div>
  );
};
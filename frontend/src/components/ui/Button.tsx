import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', children, className = '', ...props }) => {
  // В base оставляем только толщину border, но не задаем его цвет!
  const base =
    'min-h-[43px] px-[22px] inline-flex items-center justify-center gap-2 ' +
    'rounded-full border text-[0.88rem] font-semibold ' +
    'cursor-pointer transition-all duration-200 ' +
    'disabled:opacity-55 disabled:cursor-not-allowed';
 
  const variants = {
    primary:
      'border-transparent bg-gradient-to-br from-accent to-accent-light text-white ' +
      'shadow-accent hover:enabled:shadow-accent-hover hover:enabled:-translate-y-px',
    secondary:
      'border-white/10 bg-[rgba(30,33,48,0.62)] backdrop-blur text-[#d6d9e3] ' +
      'hover:enabled:bg-[rgba(39,42,58,0.82)] hover:enabled:border-accent-light/30 hover:enabled:text-white hover:enabled:-translate-y-px',
    outline:
      'border-white/20 bg-transparent text-[#d6d9e3] ' + // Классический outline с прозрачным фоном
      'hover:enabled:bg-white/5 hover:enabled:border-accent-light/30 hover:enabled:text-white hover:enabled:-translate-y-px',
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};
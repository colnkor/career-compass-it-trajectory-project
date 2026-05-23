import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', children, className = '', ...props }) => {
  const baseStyles = 'px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 text-sm cursor-pointer';
  
  const variants = {
    primary: 'bg-[#6366f1] hover:bg-[#4f46e5] text-white shadow-[0_0_20px_rgba(99,102,241,0.3)]',
    secondary: 'bg-[#11121a] hover:bg-[#1a1b26] text-white border border-gray-800',
    outline: 'border border-gray-800 text-gray-300 hover:text-white hover:bg-white/5',
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};
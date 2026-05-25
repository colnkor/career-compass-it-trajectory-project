import React from 'react';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const InputField: React.FC<InputFieldProps> = ({ label, className = '', ...props }) => (
  <div className="w-full flex flex-col gap-2">
    {label && (
      <span className="text-sm font-medium text-muted">
        {label}
      </span>
    )}
    <input
      className={`
        w-full px-5 py-4 rounded-2xl
        bg-card border border-border-soft text-text
        placeholder:text-muted/50
        backdrop-blur-sm
        focus:outline-none focus:border-accent-light/50 focus:shadow-[0_0_0_3px_rgba(175,169,236,0.12)]
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      {...props}
    />
  </div>
);
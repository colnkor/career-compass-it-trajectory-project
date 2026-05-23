import React from 'react';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const InputField: React.FC<InputFieldProps> = ({ label, className = '', ...props }) => {
  return (
    <div className="w-full flex flex-col gap-2">
      {label && <span className="text-sm text-gray-400 font-medium">{label}</span>}
      <input
        className={`w-full px-5 py-4 rounded-xl bg-[#11121a] border border-gray-800 text-white placeholder-gray-600 
          focus:outline-none focus:border-[#6366f1] focus:shadow-[0_0_15px_rgba(99,102,241,0.15)] 
          transition-all duration-200 ${className}`}
        {...props}
      />
    </div>
  );
};
import React from 'react';

interface CheckboxFieldProps {
  id: string | number;
  text: string;
  icon?: string;
  checked: boolean;
  onChange: () => void;
}

export const CheckboxField: React.FC<CheckboxFieldProps> = ({ id, text, icon, checked, onChange }) => {
  return (
    <label
      htmlFor={String(id)}
      className={`w-full flex items-center justify-between p-4 rounded-xl cursor-pointer border transition-all duration-200
        ${checked 
          ? 'bg-[#6366f1]/5 border-[#6366f1]' 
          : 'bg-[#11121a]/40 border-white/5 hover:border-gray-800'
        }`}
    >
      <div className="flex items-center gap-4">
        {icon && <span className="text-xl">{icon}</span>}
        <span className="text-sm font-medium text-gray-200">{text}</span>
      </div>
      <input
        type="checkbox"
        id={String(id)}
        checked={checked}
        onChange={onChange}
        className="hidden"
      />
      {/* Кастомный Чекбокс */}
      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-200
        ${checked ? 'bg-[#6366f1] border-[#6366f1]' : 'border-gray-800 bg-[#0e0f14]'}`}
      >
        {checked && (
          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
    </label>
  );
};
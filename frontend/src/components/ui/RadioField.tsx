import React from 'react';

interface RadioFieldProps {
  id: string | number;
  name: string;
  text: string;
  icon?: string;
  checked: boolean;
  onChange: () => void;
}

export const RadioField: React.FC<RadioFieldProps> = ({ id, name, text, icon, checked, onChange }) => {
  return (
    <label
      htmlFor={String(id)}
      className={`w-full flex items-center justify-between p-4 rounded-xl cursor-pointer border transition-all duration-200
        ${checked 
          ? 'bg-[#6366f1]/5 border-[#6366f1] shadow-[0_0_15px_rgba(99,102,241,0.1)]' 
          : 'bg-[#11121a]/60 border-transparent hover:border-gray-800'
        }`}
    >
      <div className="flex items-center gap-4">
        {icon && <span className="text-xl">{icon}</span>}
        <span className="text-sm font-medium text-gray-200">{text}</span>
      </div>
      <input
        type="radio"
        id={String(id)}
        name={name}
        checked={checked}
        onChange={onChange}
        className="hidden"
      />
      {/* Кастомный Radio круг */}
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200
        ${checked ? 'border-[#6366f1]' : 'border-gray-700'}`}
      >
        {checked && <div className="w-2.5 h-2.5 rounded-full bg-[#6366f1]" />}
      </div>
    </label>
  );
};
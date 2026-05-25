import React from 'react';

interface CheckboxFieldProps {
  id: string | number;
  text: string;
  icon?: string;
  checked: boolean;
  onChange: () => void;
}

export const CheckboxField: React.FC<CheckboxFieldProps> = ({ id, text, icon, checked, onChange }) => (
  <label
    htmlFor={String(id)}
    className={`
      w-full flex items-center justify-between gap-4
      px-5 py-4 rounded-2xl border cursor-pointer
      backdrop-blur-sm transition-all duration-200
      ${checked
        ? 'bg-accent/10 border-accent-light/40 shadow-[0_0_0_1px_rgba(175,169,236,0.15)]'
        : 'bg-card border-border-soft hover:border-accent-light/20 hover:bg-[rgba(83,74,183,0.07)]'
      }
    `}
  >
    <input
      type="checkbox"
      id={String(id)}
      checked={checked}
      onChange={onChange}
      className="sr-only"
    />

    <div className="flex items-center gap-3 min-w-0">
      {icon && <span className="text-xl shrink-0">{icon}</span>}
      <span className={`text-sm font-medium leading-snug transition-colors duration-200 ${checked ? 'text-text' : 'text-[#c4c8d8]'}`}>
        {text}
      </span>
    </div>

    {/* Custom checkbox */}
    <div className={`
      w-5 h-5 shrink-0 rounded-md border-2 flex items-center justify-center transition-all duration-200
      ${checked
        ? 'bg-accent border-accent-light'
        : 'bg-transparent border-border'
      }
    `}>
      {checked && (
        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
    </div>
  </label>
);
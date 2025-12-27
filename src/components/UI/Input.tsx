import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  isActive?: boolean;
}

export const Input: React.FC<InputProps> = ({ 
  label, 
  error, 
  id, 
  className, 
  isActive, 
  ...props 
}) => {
  return (
    <div className="w-full space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={id}
      
        {...props} 
        className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all
          ${error ? 'border-red-500' : 'border-slate-300'}
          ${className || ''}
        `}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
};
import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utilidad para mezclar clases
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 1. Definimos las propiedades que acepta nuestro componente
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  fullWidth?: boolean;
  isActive?: boolean; // Agregamos esta por si React Router u otro la envía
}

export const Button: React.FC<ButtonProps> = ({ 
  className, 
  variant = 'primary', 
  fullWidth, 
  isActive, // 2. SACAMOS isActive, variant y fullWidth de aquí...
  children, 
  ...props  // 3. ...para que NO queden dentro de 'props'
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-teal-600 text-white hover:bg-teal-700 focus:ring-teal-500 shadow-sm",
    secondary: "bg-slate-800 text-white hover:bg-slate-900 focus:ring-slate-500 shadow-sm",
    outline: "border border-slate-300 bg-transparent hover:bg-slate-50 text-slate-700"
  };

  return (
    <button
      {...props} // 4. Ahora 'props' solo tiene cosas legales (onClick, type, etc.)
      className={cn(
        baseStyles,
        variants[variant],
        fullWidth && "w-full",
        className
      )}
    >
      {children}
    </button>
  );
};
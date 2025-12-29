import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utilidad para mezclar clases
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 1. Expandimos la interfaz para aceptar 'ghost' y 'size'
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'; // Agregado 'ghost'
  size?: 'sm' | 'md' | 'lg'; // Agregado 'size'
  fullWidth?: boolean;
  isActive?: boolean; 
}

export const Button: React.FC<ButtonProps> = ({ 
  className, 
  variant = 'primary', 
  size = 'md', // Valor por defecto
  fullWidth, 
  isActive, 
  children, 
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-teal-600 text-white hover:bg-teal-700 focus:ring-teal-500 shadow-sm",
    secondary: "bg-slate-800 text-white hover:bg-slate-900 focus:ring-slate-500 shadow-sm",
    outline: "border border-slate-300 bg-transparent hover:bg-slate-50 text-slate-700",
    ghost: "bg-transparent hover:bg-slate-100 text-slate-600 hover:text-teal-600" // Estilo para 'ghost'
  };

  const sizes = {
    sm: "px-2.5 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };

  return (
    <button
      type={props.type || "button"} // Buena práctica por defecto
      {...props}
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size], // Aplicamos el tamaño aquí
        fullWidth && "w-full",
        className
      )}
    >
      {children}
    </button>
  );
};
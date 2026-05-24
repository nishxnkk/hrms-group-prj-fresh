import React from 'react';
import { Loader2 } from 'lucide-react';

const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    disabled,
    className = '',
    ...props
}) => {
    const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";

    const variants = {
  primary:
    "bg-[var(--rn-primary)] text-white hover:bg-[var(--rn-primary-hover)] focus:ring-[var(--rn-primary)] dark:bg-[var(--rn-primary)] dark:focus:ring-[var(--rn-primary)]",

  secondary:
    "bg-[var(--rn-gold)] text-white hover:bg-[#a86d24] focus:ring-[var(--rn-gold)] dark:bg-[var(--rn-gold)] dark:text-white dark:hover:bg-[#a86d24] dark:focus:ring-[var(--rn-gold)]",

  outline:
    "border border-[var(--rn-border)] bg-transparent text-[var(--rn-primary)] hover:bg-[var(--rn-soft)] focus:ring-[var(--rn-primary)] dark:border-[#7a3a35] dark:text-[#ffd6cc] dark:hover:bg-[#3a1d1b] dark:focus:ring-[var(--rn-primary)]",

  ghost:
    "bg-transparent text-[var(--rn-muted)] hover:bg-[var(--rn-soft)] hover:text-[var(--rn-ink)] dark:text-[#ffd6cc] dark:hover:bg-[#3a1d1b] dark:hover:text-white",

  danger:
    "bg-red-600 text-white hover:bg-red-700 focus:ring-red-600 dark:hover:bg-red-700 dark:focus:ring-red-500",
};


    const sizes = {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {children}
        </button>
    );
};

export default Button;

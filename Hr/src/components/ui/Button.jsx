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
    "bg-[#020839] text-white hover:opacity-90 focus:ring-[#020839] dark:bg-[#2C50AB] dark:focus:ring-[#88AAFF]",

  secondary:
    "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-600 dark:bg-[#88AAFF] dark:text-black dark:hover:bg-[#88AAFF] dark:focus:ring-[#88AAFF]",

  outline:
    "border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50 focus:ring-gray-300 dark:border-[#88AAFF] dark:text-[#88AAFF] dark:hover:bg-[#2C50AB] dark:focus:ring-[#88AAFF]",

  ghost:
    "bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-[#88AAFF] dark:hover:bg-[#2C50AB] dark:hover:text-white",

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

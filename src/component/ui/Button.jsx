import React from 'react';

const variants = {
    primary: "bg-[#14BEF0] hover:bg-[#14BEF0] text-white shadow shadow-[#14BEF0]/50",
    secondary: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 ",
    danger: "bg-red-600 hover:bg-red-700 text-white shadow shadow-red-500/30",
    ghost: "bg-slate-200 hover:bg-slate-300 text-slate-600 shadow shadow-slate-200/50",
};

const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
};

const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    loading = false,
    disabled = false,
    ...props
}) => {
    return (
        <button
            className={`
        inline-flex items-center justify-center cursor-pointer font-medium transition-all duration-200 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 :ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-xs shadow-lg
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
            disabled={disabled || loading}
            {...props}
        >
            {loading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            )}
            {children}
        </button>
    );
};

export default Button;

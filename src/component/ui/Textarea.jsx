import React from 'react';

const Textarea = ({
    label,
    error,
    className = '',
    containerClassName = '',
    rows = 3,
    ...props
}) => {
    return (
        <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
            {label && (
                <label className="text-sm font-medium text-slate-700 ">
                    {label}
                </label>
            )}
            <textarea
                className={`
          w-full px-3 py-2 bg-white  border rounded-lg shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 resize-y
          ${error
                        ? 'border-red-300  text-red-900  focus:ring-red-200'
                        : 'border-slate-300  text-slate-900 '
                    }
          ${className}
        `}
                rows={rows}
                {...props}
            />
            {error && (
                <p className="text-xs text-red-600  mt-0.5">{error}</p>
            )}
        </div>
    );
};

export default Textarea;

import React from "react";

const Card = ({ children, className = "", title, action, ...props }) => {
  return (
    <div
      className={`bg-white rounded-sm shadow-sm border border-slate-200 transition-all duration-200 ${className}`}
      {...props}
    >
      {(title || action) && (
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          {title && (
            <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
          )}
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
};

export default Card;

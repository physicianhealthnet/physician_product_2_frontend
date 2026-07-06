import React from 'react';

const PageLoader = () => {
    return (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-white  z-50">
            <div className="relative">
                {/* Outer Glow */}
                <div className="absolute inset-0 bg-primary-500/20 blur-2xl rounded-full animate-pulse"></div>

                {/* Spinner */}
                <div className="relative flex flex-col items-center gap-6">
                    <div className="w-16 h-16 border-4 border-slate-100  border-t-primary-500 rounded-full animate-spin"></div>

                    <div className="flex flex-col items-center gap-2">
                        <h2 className="text-xl font-black text-slate-800  tracking-widest uppercase animate-pulse">
                            Loading
                        </h2>
                        <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Branding at bottom */}
        </div>
    );
};

export default PageLoader;

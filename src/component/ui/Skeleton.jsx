import React from 'react';

export const Skeleton = ({ className = '', variant = 'rect', ...props }) => {
    const baseClass = "animate-pulse bg-slate-200 ";

    let variantClass = "";
    switch (variant) {
        case 'circle':
            variantClass = "rounded-full";
            break;
        case 'text':
            variantClass = "rounded h-4 w-full";
            break;
        case 'rect':
        default:
            variantClass = "rounded-xl";
            break;
    }

    return (
        <div
            className={`${baseClass} ${variantClass} ${className}`}
            {...props}
        />
    );
};

export const CardSkeleton = () => (
    <div className="bg-white/40  backdrop-blur-md rounded-2xl border border-slate-200/60  p-6 flex flex-col gap-4">
        <div className="flex justify-between items-start">
            <div className="flex flex-col gap-2 w-2/3">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-4 w-1/3" />
            </div>
            <Skeleton className="w-10 h-10 rounded-xl" />
        </div>
        <div className="space-y-3">
            <Skeleton className="h-3 w-1/4" />
            <div className="grid grid-cols-2 gap-2">
                <Skeleton className="h-4 w-full shadow-sm" />
                <Skeleton className="h-4 w-full shadow-sm" />
                <Skeleton className="h-4 w-full shadow-sm" />
                <Skeleton className="h-4 w-full shadow-sm" />
            </div>
        </div>
        <div className="pt-4 border-t border-slate-100  flex justify-between">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/4" />
        </div>
    </div>
);

export const TableSkeleton = ({ rows = 5 }) => (
    <div className="w-full overflow-hidden rounded-3xl border border-slate-200  bg-white  shadow-xl">
        <div className="px-6 py-5 border-b border-slate-100  flex gap-4">
            {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-4 flex-1" />
            ))}
        </div>
        <div className="p-0">
            {[...Array(rows)].map((_, i) => (
                <div key={i} className="px-6 py-4 flex items-center gap-4 border-b border-slate-50  last:border-0">
                    <div className="flex flex-col gap-2 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-4 flex-1" />
                    <div className="flex gap-2 justify-end w-24">
                        <Skeleton className="w-8 h-8 rounded-lg" />
                        <Skeleton className="w-8 h-8 rounded-lg" />
                    </div>
                </div>
            ))}
        </div>
    </div>
);

export const PageSkeleton = () => (
    <div className="flex flex-col gap-8 p-4 md:p-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex flex-col gap-2 w-full md:w-1/3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-4 w-2/3" />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-24" />
            </div>
        </div>

        <div className="flex gap-4">
            <Skeleton className="h-12 flex-1 rounded-2xl" />
            <Skeleton className="h-12 w-1/3 rounded-2xl" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
                <CardSkeleton key={i} />
            ))}
        </div>
    </div>
);

// export default Skeleton;

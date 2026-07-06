import React, { useEffect, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../Navbar/Navbar';
import Sidebar from '../sidebar/Sidebar';
import { useSelector, useDispatch } from 'react-redux';
import { setTheme } from '../../redux/slices/themeSlice';
import { toggleSidebar } from '../../redux/slices/toggleSlice';
import { PageSkeleton } from '../ui/Skeleton';

const MainLayout = () => {
    const isOpen = useSelector((state) => state.toggle.isOpen);
    const theme = useSelector((state) => state.theme.theme);
    const dispatch = useDispatch();

    // Always ensure light theme (no dark class)
    useEffect(() => {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    }, []);

    return (
        <div className="flex h-screen w-full bg-slate-50  overflow-hidden font-sans text-slate-900  transition-colors duration-300">
            {/* Sidebar - self-managed width based on Redux state */}
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 lg:hidden backdrop-blur-sm transition-opacity duration-300"
                    onClick={() => dispatch(toggleSidebar())} // Close on click
                />
            )}

            <Sidebar />

            {/* Main Content Wrapper */}
            <div className={`flex flex-col flex-1 h-full min-w-0 overflow-hidden relative bg-slate-50  transition-colors duration-300`}>
                <Navbar />

                {/* Scrollable Page Content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 scroll-smooth relative z-10 w-full">
                    {/* Max width container for large screens to prevent stretching */}
                    <div className="mx-auto w-full max-w-[1600px] pb-10">
                        <Suspense fallback={<PageSkeleton />}>
                            <Outlet />
                        </Suspense>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default MainLayout;

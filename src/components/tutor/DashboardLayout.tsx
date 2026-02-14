'use client';

import { LayoutDashboard, Menu, X, ChevronRight, LogOut, BookOpen, Users, Clock, Settings } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from './Sidebar';

import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/authClient';
import LoadingScreen from '@/components/common/LoadingScreen';

interface DashboardLayoutProps {
    children: React.ReactNode;
    hideSidebar?: boolean;
    hideHeader?: boolean;
    isLoading?: boolean;
    allowAdmin?: boolean;
}

export default function DashboardLayout({ children, hideSidebar = false, hideHeader = false, isLoading = false, allowAdmin = false }: DashboardLayoutProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [authLoading, setAuthLoading] = useState(true);


    const router = useRouter();

    useEffect(() => {
        // Protect the route - simple client-side check
        const checkAuth = async () => {
            try {
                const user = await getCurrentUser();
                if (!user) {
                    router.push('/login');
                } else if (user.role !== 'tutor') {
                    if (user.role === 'admin') {
                        if (!allowAdmin) router.push('/admin/dashboard');
                    } else if (user.role === 'student') {
                        router.push('/student/dashboard');
                    }
                }
            } finally {
                setAuthLoading(false);
            }
        };
        checkAuth();
    }, [router]);

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {(authLoading || isLoading) && <LoadingScreen />}
            {/* Sidebar with visibility control */}
            {!hideSidebar && (
                <>
                    {/* Mobile Sidebar Backdrop */}
                    {isSidebarOpen && (
                        <div
                            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
                            onClick={() => setIsSidebarOpen(false)}
                        />
                    )}

                    {/* Sidebar */}
                    <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
                </>
            )}

            {/* Main Content */}
            <main className={`flex-1 ${!hideSidebar ? 'md:ml-64' : ''} ${hideSidebar && hideHeader ? 'h-screen overflow-hidden' : 'min-h-screen'} flex flex-col`}>


                {!hideHeader && (
                    <>
                        {/* Mobile Header */}
                        <header className="md:hidden sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between">
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="p-2 text-gray-500 hover:text-primary transition-colors"
                            >
                                <Menu size={24} />
                            </button>
                            <Link href="/tutor/dashboard" className="flex items-center gap-2">
                                <span className="text-xl font-black text-gray-900 tracking-tight">KHRIEN</span>
                            </Link>
                            <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200" />
                        </header>

                        {/* Desktop Header */}
                        <header className="hidden md:flex sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100 px-8 py-4 items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-xl text-primary">
                                    <LayoutDashboard size={20} />
                                </div>
                                <div>
                                    <h1 className="text-sm font-black text-gray-900 uppercase tracking-widest">Tutor Dashboard</h1>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">LMS Management System</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="flex flex-col items-end">
                                    <span className="text-xs font-black text-gray-900">Tutor Panel</span>
                                    <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Active System</span>
                                </div>
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-purple-600 shadow-lg shadow-primary/20" />
                            </div>
                        </header>
                    </>
                )}

                {/* Page Content */}
                <div className={`flex-1 ${hideHeader ? 'p-0' : 'p-4 md:p-8'} overflow-x-hidden`}>
                    {children}
                </div>

            </main>
        </div>
    );
}

"use client";

import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { Menu, X } from 'lucide-react';
import { getCurrentUser } from '@/lib/authClient';
import { useRouter } from 'next/navigation';

import LoadingScreen from '@/components/common/LoadingScreen';

interface DashboardLayoutProps {
    children: React.ReactNode;
    isLoading?: boolean;
}

export default function DashboardLayout({ children, isLoading = false }: DashboardLayoutProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [authLoading, setAuthLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const user = await getCurrentUser();
                if (!user || user.role !== 'admin') {
                    router.push('/login');
                }
            } finally {
                setAuthLoading(false);
            }
        };
        checkAuth();
    }, [router]);

    return (
        <div className="flex min-h-screen bg-[#f9f9f9] font-sans text-gray-900">
            {(authLoading || isLoading) && <LoadingScreen />}
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[45] md:hidden transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 flex items-center px-6 z-40">
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-2 -ml-2 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
                >
                    {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
                <div className="ml-4 font-bold text-lg tracking-tight">Khrien Admin</div>
            </div>

            {/* Left Sidebar */}
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            {/* Main Content Area */}
            <main className={`flex-1 min-w-0 transition-all duration-300 md:ml-64 pt-16 md:pt-0`}>
                <div className="px-6 py-8 md:px-12 bg-gray-50 min-h-screen">
                    {children}
                </div>
            </main>
        </div>
    );
}

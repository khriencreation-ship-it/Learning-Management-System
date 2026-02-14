'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Home, PlaySquare, BookOpen, Users, LogOut, LayoutGrid, UserCircle } from 'lucide-react';
import { logout } from '@/lib/authClient';

interface SidebarProps {
    isOpen?: boolean;
    onClose?: boolean | (() => void);
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const handleClose = () => typeof onClose === 'function' && onClose();

    const handleLogout = async () => {
        try {
            await logout();
            router.push('/login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <aside className={`fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-100 flex flex-col py-6 z-50 transition-all duration-300 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'
            }`}>
            {/* Logo / Brand */}
            <div className="mb-8 px-6 flex items-center gap-3">
                <div className="relative w-8 h-8">
                    <Image
                        src="/icon.png"
                        alt="Khrien Logo"
                        fill
                        className="object-contain"
                    />
                </div>
                <span className="font-bold text-xl tracking-tight text-gray-900">Khrien</span>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 w-full flex flex-col px-4 gap-1.5">
                <NavItem icon={<Home size={22} />} label="Home" href="/student/dashboard" active={pathname === '/student/dashboard'} onClick={handleClose} />
                {/* Note: Students see their courses and cohorts differently, but for now we follow the structure requested */}
                {/* Actually, user said 'exact same thing' minus broadcast. Let's see tutor's items: Home, Cohort, Courses, Broadcast. */}
                <NavItem icon={<LayoutGrid size={22} />} label="Cohorts" href="/student/cohorts" active={pathname.startsWith('/student/cohorts')} onClick={handleClose} />
                <NavItem icon={<BookOpen size={22} />} label="Courses" href="/student/courses" active={pathname.startsWith('/student/courses')} onClick={handleClose} />
            </nav>

            {/* Logout Button */}
            <div className="mb-4 px-4">
                <button
                    onClick={handleLogout}
                    className="group relative flex items-center gap-3 w-full px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                >
                    <LogOut size={20} />
                    <span className="text-sm font-medium">Logout</span>
                </button>
            </div>
        </aside>
    );
}

function NavItem({
    icon,
    label,
    href,
    active = false,
    onClick,
}: {
    icon: React.ReactNode;
    label: string;
    href: string;
    active?: boolean;
    onClick?: () => void;
}) {
    return (
        <Link
            href={href}
            onClick={onClick}
            className={`group relative flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-200 ${active
                ? 'bg-primary text-white shadow-lg shadow-purple-200'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
        >
            <div className={`${active ? 'text-white' : 'text-gray-400 group-hover:text-primary transition-colors'}`}>
                {icon}
            </div>
            <span className="text-sm font-medium">
                {label}
            </span>
        </Link>
    );
}

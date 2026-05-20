'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/ui/Toast';
import Image from 'next/image';
import {
    login,
    detectUserRole,
    getRoleWelcomeMessage,
    getRoleErrorMessage,
    getRoleDashboardRoute,
    type UserRole,
} from '@/lib/authClient';

export default function LoginPage() {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [detectedRole, setDetectedRole] = useState<UserRole | null>(null);
    const router = useRouter();
    const { toasts, removeToast, success, error } = useToast();

    // Check if the current app is running in Staging/Demo sandbox mode
    const isDemoMode = process.env.NEXT_PUBLIC_IS_DEMO === 'true';

    // Detect role as user types
    useEffect(() => {
        if (identifier.trim()) {
            const role = detectUserRole(identifier);
            setDetectedRole(role);
        } else {
            setDetectedRole(null);
        }
    }, [identifier]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Trim identifier to prevent issues with accidental spaces during copy-paste
        const cleanIdentifier = identifier.trim();

        try {
            const user = await login({ identifier: cleanIdentifier, password });

            if (user) {
                // Show success toast with role-specific message
                success(getRoleWelcomeMessage(user.role, user.name));

                // Check if user needs to change password (e.g. first login)
                if (user.forceChangePassword) {
                    setTimeout(() => {
                        router.push('/change-password');
                    }, 1500);
                    return;
                }

                // Redirect to role-specific dashboard after a short delay
                setTimeout(() => {
                    router.push(getRoleDashboardRoute(user.role));
                }, 1500);
            } else {
                // Show error toast with role-specific message
                const role = detectUserRole(cleanIdentifier);
                error(getRoleErrorMessage(role));
            }
        } catch (err) {
            error('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Quick login function for prospective buyers to test the system in one tap
    const handleQuickLogin = async (role: 'admin' | 'tutor' | 'student') => {
        if (isLoading) return;
        setIsLoading(true);

        let testId = '';
        let testPass = '';

        if (role === 'admin') {
            testId = 'admin@khrien.com';
            testPass = 'DemoAdmin2026!';
        } else if (role === 'tutor') {
            testId = 'TUT-101';
            testPass = 'DemoTutor2026!';
        } else {
            testId = 'STU-101';
            testPass = 'DemoStudent2026!';
        }

        setIdentifier(testId);
        setPassword(testPass);

        try {
            const user = await login({ identifier: testId, password: testPass });

            if (user) {
                success(getRoleWelcomeMessage(user.role, user.name));
                
                setTimeout(() => {
                    router.push(getRoleDashboardRoute(user.role));
                }, 1200);
            } else {
                error('Quick login authentication failed.');
            }
        } catch (err) {
            error('Authentication service is currently unavailable.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-white">
            {/* Toast notifications */}
            {toasts.map((toast) => (
                <Toast
                    key={toast.id}
                    message={toast.message}
                    type={toast.type}
                    onClose={() => removeToast(toast.id)}
                />
            ))}

            {/* Left Side - Background Image */}
            <div className="hidden lg:flex lg:w-1/2 relative">
                {/* Background Image */}
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: 'url(/study-group-african-people.jpg)' }}
                ></div>
            </div>

            {/* Right Side - Login Form & Quick Login Panel */}
            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 bg-gray-50/30 overflow-y-auto">
                <div className="w-full max-w-md py-6">
                    {/* Logo/Brand */}
                    <div className="text-center mb-8">
                        <div className="flex flex-col items-center justify-center gap-3 mb-4">
                            <Image
                                src="/academylogo.png"
                                alt="Khrien Academy Logo"
                                width={150}
                                height={80}
                                className="object-contain"
                            />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                            LMS Portal Access
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {isDemoMode ? 'Sandbox Sandbox Edition' : 'Sign in to your LMS Portal'}
                        </p>
                    </div>

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-5 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        {/* Email/ID Input */}
                        <div>
                            <label htmlFor="identifier" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                Access ID / Registered Email
                            </label>
                            <input
                                id="identifier"
                                type="text"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                placeholder="e.g. STU-101 or admin@khrien.com"
                                required
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all bg-white text-gray-900 placeholder-gray-400 text-sm"
                            />
                        </div>

                        {/* Password Input */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label htmlFor="password" className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    Password
                                </label>
                                <button
                                    type="button"
                                    className="text-xs text-purple-600 hover:text-purple-700 transition-colors font-semibold"
                                >
                                    Forgot password?
                                </button>
                            </div>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all bg-white text-gray-900 placeholder-gray-400 text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showPassword ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Keep me logged in */}
                        <div className="flex items-center">
                            <input
                                id="remember"
                                type="checkbox"
                                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-600"
                            />
                            <label htmlFor="remember" className="ml-2 text-sm text-gray-700">
                                Keep me logged in
                            </label>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full py-3.5 px-4 rounded-xl font-bold text-white transition-all duration-300 ${isLoading
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-purple-600 hover:bg-purple-700 shadow-md hover:shadow-lg transform active:scale-95'
                                }`}
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Signing in...
                                </span>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    {/* Premium Demo Sandbox Quick Access Panel */}
                    {isDemoMode && (
                        <div className="mt-8 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center justify-between px-1">
                                <span className="h-px bg-gray-200 w-1/4"></span>
                                <span className="text-[11px] font-black tracking-widest text-purple-600 uppercase text-center bg-gray-50 px-3 py-1.5 rounded-full border border-purple-100 shadow-sm">
                                    Demo Quick Access
                                </span>
                                <span className="h-px bg-gray-200 w-1/4"></span>
                            </div>

                            <p className="text-center text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">
                                Click any role below to automatically log in and explore the sandbox views.
                            </p>

                            <div className="grid grid-cols-3 gap-3">
                                {/* Student Card */}
                                <button
                                    type="button"
                                    disabled={isLoading}
                                    onClick={() => handleQuickLogin('student')}
                                    className="flex flex-col items-center justify-center p-4 bg-white hover:bg-purple-50/30 border border-gray-200 hover:border-purple-300 rounded-2xl transition-all duration-300 group hover:shadow-md hover:-translate-y-0.5"
                                >
                                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A5.905 5.905 0 018 3.97.9.9 0 019 3h6a.9.9 0 011 1 5.905 5.905 0 015.82 5.364c.264.249.52.518.767.807m-15.482 0a50.58 50.58 0 0015.482 0m-15.482 0L3 13.025M21 12.03l-3.232 2.879m0 0L12 18.232M17.768 14.91L12 18.232" />
                                        </svg>
                                    </div>
                                    <span className="text-xs font-black text-gray-800">Student</span>
                                    <span className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-wider bg-gray-100 px-1.5 py-0.5 rounded">STU-101</span>
                                </button>

                                {/* Tutor Card */}
                                <button
                                    type="button"
                                    disabled={isLoading}
                                    onClick={() => handleQuickLogin('tutor')}
                                    className="flex flex-col items-center justify-center p-4 bg-white hover:bg-purple-50/30 border border-gray-200 hover:border-purple-300 rounded-2xl transition-all duration-300 group hover:shadow-md hover:-translate-y-0.5"
                                >
                                    <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </div>
                                    <span className="text-xs font-black text-gray-800">Tutor</span>
                                    <span className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-wider bg-gray-100 px-1.5 py-0.5 rounded">TUT-101</span>
                                </button>

                                {/* Admin Card */}
                                <button
                                    type="button"
                                    disabled={isLoading}
                                    onClick={() => handleQuickLogin('admin')}
                                    className="flex flex-col items-center justify-center p-4 bg-white hover:bg-purple-50/30 border border-gray-200 hover:border-purple-300 rounded-2xl transition-all duration-300 group hover:shadow-md hover:-translate-y-0.5"
                                >
                                    <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                                        </svg>
                                    </div>
                                    <span className="text-xs font-black text-gray-800">Admin</span>
                                    <span className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-wider bg-gray-100 px-1.5 py-0.5 rounded">SU-ADMIN</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

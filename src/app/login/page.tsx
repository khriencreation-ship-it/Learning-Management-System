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

        try {
            const user = await login({ identifier, password });

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
                const role = detectUserRole(identifier);
                error(getRoleErrorMessage(role));
            }
        } catch (err) {
            error('An error occurred. Please try again.');
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
                {/* Dark Overlay */}
                {/* <div
                    className="absolute inset-0"
                    style={{ backgroundColor: '#1b191bff', opacity: 0.85 }}
                ></div> */}
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
                <div className="w-full max-w-md">
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
                        <p className="text-gray-600">
                            Sign in to you LMS Portal
                        </p>
                    </div>

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email/ID Input */}
                        <div>
                            <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-2">
                                Admin ID / Student ID / Tutor ID
                            </label>
                            <input
                                id="identifier"
                                type="text"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                placeholder="Enter Your ID"
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all bg-white text-gray-900 placeholder-gray-400"
                            />
                        </div>

                        {/* Password Input */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                    Password
                                </label>
                                <button
                                    type="button"
                                    className="text-sm text-purple-600 hover:text-purple-700 transition-colors font-medium"
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
                                    placeholder="Password"
                                    required
                                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all bg-white text-gray-900 placeholder-gray-400"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
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
                            className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-300 ${isLoading
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-purple-600 hover:bg-purple-700 shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
                                }`}
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
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
                </div>
            </div>
        </div>
    );
}

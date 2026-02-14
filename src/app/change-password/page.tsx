'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/ui/Toast';
import { getCurrentUser, User, getRoleDashboardRoute } from '@/lib/authClient';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { Eye, EyeOff } from 'lucide-react';

export default function ChangePasswordPage() {
    const [user, setUser] = useState<User | null>(null);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { toasts, success, error, removeToast } = useToast();

    useEffect(() => {
        const checkAuth = async () => {
            const currentUser = await getCurrentUser();
            if (!currentUser) {
                router.push('/login');
                return;
            }
            setUser(currentUser);
        };
        checkAuth();
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            error('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            error('Password must be at least 6 characters long');
            return;
        }

        setLoading(true);

        try {
            // Get the current session token
            const { data: { session } } = await supabase.auth.getSession();

            if (!session?.access_token) {
                throw new Error('No active session found');
            }

            const res = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ password })
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to update password');

            success('Password updated successfully!');

            // Force refresh the session/user to update local metadata (force_change_password)
            await supabase.auth.getUser();

            // Redirect to dashboard after success
            setTimeout(() => {
                if (user) {
                    router.push(getRoleDashboardRoute(user.role));
                } else {
                    router.push('/login');
                }
            }, 1500);

        } catch (err: any) {
            error(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null; // Or a loading spinner

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            {/* Toast notifications */}
            {toasts.map((toast) => (
                <Toast
                    key={toast.id}
                    message={toast.message}
                    type={toast.type}
                    onClose={() => removeToast(toast.id)}
                />
            ))}

            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-purple-600">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                            </svg>
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Change Password</h1>
                    <p className="text-gray-500 mt-2">
                        For security reasons, please update your password before continuing.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all pr-12"
                                placeholder="Enter new password"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all pr-12"
                                placeholder="Confirm new password"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-200 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                        {loading ? 'Updating...' : 'Update Password & Continue'}
                    </button>
                </form>
            </div>
        </div>
    );
}


"use client";

import { X, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface AddSubAdminModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function AddSubAdminModal({ isOpen, onClose, onSuccess }: AddSubAdminModalProps) {
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState(''); // If empty, could auto-generate
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    // Auto-generate password function
    const generatePassword = () => {
        const random = Math.random().toString(36).slice(-8) + "!Aa1";
        setPassword(random);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const finalPassword = password || Math.random().toString(36).slice(-8) + "!Aa1";

            const res = await fetch('/api/admin/sub-admins', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    fullName,
                    phone,
                    password: finalPassword
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                // Try to parse JSON, if fails fallback to generic
                throw new Error(data.error || 'Failed to create sub-admin');
            }

            // Success
            onSuccess();
            onClose();
            // Reset form
            setEmail('');
            setFullName('');
            setPhone('');
            setPassword('');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="relative bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Add Sub Admin</h2>
                        <p className="text-gray-500 text-sm">Create a new administrative user.</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl font-medium">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Name */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-900">Full Name</label>
                        <input
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="e.g. John Doe"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-gray-900 placeholder:text-gray-400"
                        />
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-900">Email Address</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@example.com"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-gray-900 placeholder:text-gray-400"
                        />
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-900">Phone (Optional)</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+1 234..."
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-gray-900 placeholder:text-gray-400"
                        />
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-bold text-gray-900">Password</label>
                            <button
                                type="button"
                                onClick={generatePassword}
                                className="text-xs font-bold text-primary hover:text-purple-700"
                            >
                                Generate Strong
                            </button>
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                minLength={6}
                                placeholder="Min 6 characters"
                                className="w-full pl-11 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-gray-900 placeholder:text-gray-400"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 mt-2 bg-primary text-white rounded-xl font-bold hover:bg-purple-700 transition-all shadow-lg shadow-purple-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading && <Loader2 size={20} className="animate-spin" />}
                        {loading ? 'Creating...' : 'Create Admin'}
                    </button>
                </form>
            </div>
        </div>
    );
}

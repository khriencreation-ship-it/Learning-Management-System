"use client";

import { useState, useEffect } from 'react';
import { Plug, CheckCircle, XCircle, Loader2, Video, Calendar, Users, AlertTriangle, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Inline Modal Component for simplicity in this view
interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmLabel: string;
    isLoading?: boolean;
}

function ConfirmationModal({ isOpen, onClose, onConfirm, title, message, confirmLabel, isLoading }: ConfirmationModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="relative bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl scale-100 transition-transform">
                <button
                    onClick={onClose}
                    className="absolute right-5 top-5 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="flex flex-col items-center text-center">
                    <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-4">
                        <AlertTriangle size={28} />
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
                    <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                        {message}
                    </p>

                    <div className="flex gap-3 w-full">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isLoading}
                            className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-lg shadow-red-200 flex items-center justify-center gap-2"
                        >
                            {isLoading ? <Loader2 size={16} className="animate-spin" /> : confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function IntegrationsPageClient() {
    const [isGoogleConnected, setIsGoogleConnected] = useState(false);
    const [googleEmail, setGoogleEmail] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isDisconnecting, setIsDisconnecting] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState(false);

    useEffect(() => {
        const fetchUserAndStatus = async () => {
            setIsLoading(true);
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    setUserId(user.id);
                    const response = await fetch(`/api/auth/google/status?userId=${user.id}`);
                    const data = await response.json();

                    setIsGoogleConnected(data.connected);
                    setGoogleEmail(data.email || '');
                }
            } catch (error) {
                console.error('Error fetching status:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserAndStatus();
    }, []);

    const handleGoogleConnect = () => {
        if (!userId) return;
        const params = new URLSearchParams({ userId });
        window.location.href = `/api/auth/google/authorize?${params.toString()}`;
    };

    const handleGoogleDisconnect = async () => {
        if (!userId) return;

        setIsDisconnecting(true);
        try {
            const response = await fetch('/api/auth/google/disconnect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId }),
            });

            if (response.ok) {
                setIsGoogleConnected(false);
                setGoogleEmail('');
                setIsDisconnectModalOpen(false);
            } else {
                const errorData = await response.json();
                alert(errorData.error || 'Failed to disconnect Google account');
            }
        } catch (error) {
            console.error('Error disconnecting:', error);
            alert('Failed to disconnect Google account');
        } finally {
            setIsDisconnecting(false);
        }
    };

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-purple-100 rounded-xl">
                        <Plug className="text-primary" size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
                    </div>
                </div>
                <p className="text-gray-600 ml-16">Connect external services to enhance your LMS</p>
            </div>

            {/* Integration Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Google Meet Integration */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="p-6">
                        {/* Icon & Title */}
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-blue-100 rounded-lg">
                                    <Video className="text-blue-600" size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg">Google Meet</h3>
                                    <p className="text-sm text-gray-500">Video conferencing</p>
                                </div>
                            </div>
                            {isLoading ? (
                                <Loader2 size={20} className="animate-spin text-gray-400" />
                            ) : isGoogleConnected ? (
                                <CheckCircle size={20} className="text-emerald-600" />
                            ) : (
                                <XCircle size={20} className="text-gray-400" />
                            )}
                        </div>

                        {/* Description */}
                        <p className="text-sm text-gray-600 mb-4">
                            Automatically generate Google Meet links for your live classes and virtual sessions.
                        </p>

                        {/* Status */}
                        {!isLoading && (
                            <div className="mb-4">
                                {isGoogleConnected ? (
                                    <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                                        <div className="flex items-center gap-2 mb-1">
                                            <CheckCircle size={16} className="text-emerald-600" />
                                            <span className="text-sm font-semibold text-emerald-900">Connected</span>
                                        </div>
                                        <p className="text-xs text-emerald-700">{googleEmail}</p>
                                    </div>
                                ) : (
                                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                        <div className="flex items-center gap-2">
                                            <XCircle size={16} className="text-gray-500" />
                                            <span className="text-sm font-semibold text-gray-700">Not Connected</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Action Button */}
                        {!isLoading && (
                            <div>
                                {isGoogleConnected ? (
                                    <button
                                        onClick={() => setIsDisconnectModalOpen(true)}
                                        className="w-full px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 font-semibold text-sm transition-colors border border-red-200"
                                    >
                                        Disconnect
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleGoogleConnect}
                                        disabled={!userId}
                                        className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-purple-700 font-semibold text-sm transition-colors shadow-sm disabled:opacity-50"
                                    >
                                        Connect Google Account
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Other Integrations (Coming Soon) */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden opacity-60">
                    <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-blue-100 rounded-lg">
                                    <Video className="text-blue-600" size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg">Zoom</h3>
                                    <p className="text-sm text-gray-500">Video conferencing</p>
                                </div>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                            Generate Zoom meeting links automatically for your classes.
                        </p>
                        <div className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg font-semibold text-sm text-center">
                            Coming Soon
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden opacity-60">
                    <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-purple-100 rounded-lg">
                                    <Users className="text-purple-600" size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg">Microsoft Teams</h3>
                                    <p className="text-sm text-gray-500">Collaboration platform</p>
                                </div>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                            Create Teams meetings for your virtual classes and collaboration.
                        </p>
                        <div className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg font-semibold text-sm text-center">
                            Coming Soon
                        </div>
                    </div>
                </div>
            </div>

            {/* Disconnect Confirmation Modal */}
            <ConfirmationModal
                isOpen={isDisconnectModalOpen}
                onClose={() => setIsDisconnectModalOpen(false)}
                onConfirm={handleGoogleDisconnect}
                isLoading={isDisconnecting}
                title="Disconnect Google Account"
                message="Are you sure you want to disconnect your Google account? You will no longer be able to automatically generate Google Meet links."
                confirmLabel="Disconnect"
            />
        </div>
    );
}

"use client";

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Link as LinkIcon, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface GoogleAccountConnectProps {
    onConnectionChange?: (connected: boolean) => void;
}

export default function GoogleAccountConnect({ onConnectionChange }: GoogleAccountConnectProps) {
    const [isConnected, setIsConnected] = useState(false);
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isDisconnecting, setIsDisconnecting] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    const checkConnection = async () => {
        setIsLoading(true);
        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                setUserId(user.id);

                // Check connection status with userId
                const response = await fetch(`/api/auth/google/status?userId=${user.id}`);
                const data = await response.json();

                setIsConnected(data.connected);
                setEmail(data.email || '');
                onConnectionChange?.(data.connected);
            } else {
                setIsConnected(false);
            }
        } catch (error) {
            console.error('Error checking Google connection:', error);
            setIsConnected(false);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        checkConnection();
    }, []);

    const handleConnect = () => {
        if (!userId) {
            alert('Unable to get user ID. Please refresh the page and try again.');
            return;
        }

        // Pass user ID as query parameter
        const params = new URLSearchParams({ userId });
        window.location.href = `/api/auth/google/authorize?${params.toString()}`;
    };

    const handleDisconnect = async () => {
        if (!confirm('Are you sure you want to disconnect your Google account? You will no longer be able to automatically generate Google Meet links.')) {
            return;
        }

        setIsDisconnecting(true);
        try {
            const response = await fetch('/api/auth/google/disconnect', {
                method: 'POST',
            });

            if (response.ok) {
                setIsConnected(false);
                setEmail('');
                onConnectionChange?.(false);
            } else {
                alert('Failed to disconnect Google account');
            }
        } catch (error) {
            console.error('Error disconnecting:', error);
            alert('Failed to disconnect Google account');
        } finally {
            setIsDisconnecting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <Loader2 size={18} className="animate-spin text-gray-400" />
                <span className="text-sm text-gray-600">Checking Google connection...</span>
            </div>
        );
    }

    if (isConnected) {
        return (
            <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <div className="flex items-center gap-3">
                    <CheckCircle size={20} className="text-emerald-600" />
                    <div>
                        <p className="text-sm font-semibold text-emerald-900">Google Account Connected</p>
                        <p className="text-xs text-emerald-700">{email}</p>
                    </div>
                </div>
                <button
                    onClick={handleDisconnect}
                    disabled={isDisconnecting}
                    className="px-4 py-2 text-sm font-semibold text-emerald-700 hover:text-emerald-900 hover:bg-emerald-100 rounded-lg transition-colors disabled:opacity-50"
                >
                    {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
                </button>
            </div>
        );
    }

    return (
        <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-start gap-3">
                <XCircle size={20} className="text-amber-600 mt-0.5" />
                <div className="flex-1">
                    <p className="text-sm font-semibold text-amber-900 mb-1">
                        Connect your Google Account
                    </p>
                    <p className="text-xs text-amber-700 mb-3">
                        To automatically generate Google Meet links, you need to authorize this app to create calendar events on your behalf.
                    </p>
                    <button
                        onClick={handleConnect}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-amber-300 text-amber-900 rounded-lg hover:bg-amber-50 font-semibold text-sm transition-colors shadow-sm"
                    >
                        <LinkIcon size={16} />
                        Connect Google Account
                    </button>
                </div>
            </div>
        </div>
    );
}

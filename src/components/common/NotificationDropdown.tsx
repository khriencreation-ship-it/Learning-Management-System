'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Check, Info, Radio, Users, BookOpen } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'assignment' | 'broadcast' | 'system';
    is_read: boolean;
    created_at: string;
}

export default function NotificationDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const fetchNotifications = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const res = await fetch('/api/tutor/notifications', {
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
            }
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Optional: Poll every minute or set up subscription
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAsRead = async (id?: string) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            await fetch('/api/tutor/notifications', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ notificationId: id })
            });

            // Optimistic update
            if (id) {
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            } else {
                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            }
        } catch (error) {
            console.error('Failed to mark as read', error);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'assignment': return <BookOpen size={16} className="text-blue-500" />;
            case 'broadcast': return <Radio size={16} className="text-purple-500" />;
            default: return <Info size={16} className="text-gray-500" />;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-3 rounded-xl bg-white border border-gray-100 text-gray-600 hover:text-primary hover:border-primary hover:shadow-md transition-all relative group"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white animate-pulse"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden transform transition-all">
                    <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                        <h3 className="font-semibold text-gray-900">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead();
                                }}
                                className="text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1"
                            >
                                <Check size={12} /> Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-400">
                                <Bell size={32} className="mx-auto mb-2 opacity-20" />
                                <p className="text-sm">No notifications yet</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {notifications.map(notification => (
                                    <div
                                        key={notification.id}
                                        className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${!notification.is_read ? 'bg-blue-50/30' : ''}`}
                                        onClick={() => markAsRead(notification.id)}
                                    >
                                        <div className="flex gap-3">
                                            <div className={`mt-1 min-w-[32px] h-8 rounded-full flex items-center justify-center bg-white border border-gray-100 shadow-sm`}>
                                                {getIcon(notification.type)}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className={`text-sm ${!notification.is_read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                                                        {notification.title}
                                                    </h4>
                                                    <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                                                        {new Date(notification.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                                                    {notification.message}
                                                </p>
                                            </div>
                                            {!notification.is_read && (
                                                <div className="self-center">
                                                    <div className="w-2 h-2 rounded-full bg-primary" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

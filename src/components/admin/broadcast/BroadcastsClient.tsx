"use client";

import { useState, useEffect } from 'react';
import { Megaphone, Plus, Search, Filter, Calendar, Users, BookOpen, Send } from 'lucide-react';
import CreateBroadcastModal from './CreateBroadcastModal';
import AnnouncementModal from '../modals/AnnouncementModal';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/ui/Toast';

export default function BroadcastsClient() {
    const { toasts, removeToast, success, error } = useToast();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [broadcasts, setBroadcasts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedBroadcast, setSelectedBroadcast] = useState<any | null>(null);

    const fetchBroadcasts = async () => {
        try {
            setIsLoading(true);
            const res = await fetch('/api/admin/broadcasts');
            if (res.ok) {
                const data = await res.json();
                setBroadcasts(data);
            }
        } catch (err) {
            console.error('Failed to fetch broadcasts', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBroadcasts();
    }, []);

    const handleCreateSuccess = () => {
        success('Broadcast sent successfully!');
        fetchBroadcasts();
    };

    const handleBroadcastClick = (broadcast: any) => {
        const dateObj = new Date(broadcast.created_at);
        setSelectedBroadcast({
            ...broadcast,
            sender: broadcast.sender_role === 'admin' ? 'System Admin' : 'Course Tutor',
            role: broadcast.sender_role === 'admin' ? 'Admin' : 'Tutor',
            date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            time: dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        });
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 min-h-screen pb-20">
            {toasts.map((toast) => (
                <Toast
                    key={toast.id}
                    message={toast.message}
                    type={toast.type}
                    onClose={() => removeToast(toast.id)}
                />
            ))}

            <CreateBroadcastModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={handleCreateSuccess}
            />

            <AnnouncementModal
                isOpen={!!selectedBroadcast}
                onClose={() => setSelectedBroadcast(null)}
                announcement={selectedBroadcast}
            />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Broadcasts</h1>
                    <p className="text-gray-500 mt-2">Send announcements to cohorts or specific course groups.</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl shadow-gray-200"
                >
                    <Plus size={20} />
                    New Broadcast
                </button>
            </div>

            {/* Stats Overview (Optional Placeholder) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
                        <Send size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Total Sent</p>
                        <p className="text-2xl font-bold text-gray-900">{broadcasts.length}</p>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
                <div className="p-8 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50/30">
                    <h2 className="font-bold text-gray-900 text-lg">History</h2>
                    <div className="flex gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search broadcasts..."
                                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-200 text-sm font-medium"
                            />
                        </div>
                    </div>
                </div>

                <div className="divide-y divide-gray-100">
                    {isLoading ? (
                        <div className="p-12 text-center text-gray-400">Loading broadcasts...</div>
                    ) : broadcasts.length > 0 ? (
                        broadcasts.map((broadcast) => (
                            <div
                                key={broadcast.id}
                                onClick={() => handleBroadcastClick(broadcast)}
                                className="p-6 hover:bg-gray-50 transition-colors group cursor-pointer"
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-3">
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${broadcast.sender_role === 'tutor'
                                                ? 'bg-purple-50 text-purple-600 border-purple-100'
                                                : 'bg-red-50 text-red-600 border-red-100'
                                                }`}>
                                                {broadcast.sender_role === 'tutor' ? 'Tutor' : 'Admin'}
                                            </span>
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${broadcast.target_type === 'course'
                                                ? 'bg-blue-50 text-blue-600 border border-blue-100'
                                                : 'bg-purple-50 text-purple-600 border border-purple-100'
                                                }`}>
                                                {broadcast.target_type === 'course' ? 'Course Specific' : 'General Cohort'}
                                            </span>
                                            <span className="text-xs font-medium text-gray-400 flex items-center gap-1.5">
                                                <Calendar size={14} />
                                                {new Date(broadcast.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-purple-600 transition-colors">{broadcast.title}</h3>
                                        <p className="text-gray-500 text-sm line-clamp-1">{broadcast.message}</p>
                                    </div>

                                    <div className="flex items-center gap-6 text-sm text-gray-500">
                                        <div className="flex flex-col items-end gap-1">
                                            <div className="flex items-center gap-2">
                                                {broadcast.target_type === 'course' ? <BookOpen size={14} /> : <Users size={14} />}
                                                <span className="font-medium text-gray-900">
                                                    {broadcast.cohort_name || 'Unknown Cohort'}
                                                </span>
                                            </div>
                                            {broadcast.course_title && (
                                                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                                                    {broadcast.course_title}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-20 text-center">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                                <Megaphone size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">No broadcasts sent yet</h3>
                            <p className="text-gray-500 text-sm mt-1">Create your first broadcast to reach your students.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

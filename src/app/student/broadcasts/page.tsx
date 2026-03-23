'use client';

import { useState, useEffect } from 'react';
import { Megaphone, Calendar, User, BookOpen, Layers, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/student/DashboardLayout';

interface Broadcast {
    id: string;
    title: string;
    message: string;
    target_type: string;
    cohort_name?: string;
    course_title?: string;
    created_at: string;
    sender_role: string;
}

export default function StudentBroadcastsPage() {
    const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
    const [selectedBroadcast, setSelectedBroadcast] = useState<Broadcast | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchBroadcasts = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) throw new Error('Not authenticated');

                const res = await fetch('/api/student/broadcasts', {
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`
                    }
                });

                if (!res.ok) throw new Error('Failed to fetch broadcasts');
                
                const data = await res.json();
                setBroadcasts(data);
            } catch (err: any) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchBroadcasts();
    }, []);

    return (
        <DashboardLayout isLoading={loading}>
            <div className="space-y-8 p-6 max-w-7xl mx-auto">
                <header className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-purple-100 text-primary rounded-2xl shadow-sm">
                            <Megaphone size={28} />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900">Broadcasts</h1>
                    </div>
                    <p className="text-gray-500 max-w-2xl">
                        Stay updated with the latest announcements from your academy admins and tutors. 
                        Important updates regarding your cohorts and courses will appear here.
                    </p>
                </header>

            {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100">
                    {error}
                </div>
            )}

            {!loading && broadcasts.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                        <Megaphone size={40} className="text-gray-300" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Broadcasts Yet</h3>
                    <p className="text-gray-500 text-center max-w-sm px-4">
                        When admins or tutors send announcements to your cohort or courses, they'll show up here.
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6">
                {broadcasts.map((broadcast) => (
                    <div 
                        key={broadcast.id} 
                        onClick={() => setSelectedBroadcast(broadcast)}
                        className="group cursor-pointer bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300 relative overflow-hidden"
                    >
                        {/* Decorative background element */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
                        
                        <div className="flex flex-col md:flex-row md:items-start gap-6 relative z-10">
                            <div className="flex-1 space-y-4">
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                                        broadcast.sender_role === 'admin' 
                                            ? 'bg-red-50 text-red-600 border border-red-100' 
                                            : 'bg-blue-50 text-blue-600 border border-blue-100'
                                    }`}>
                                        {broadcast.sender_role} announcement
                                    </span>
                                    {broadcast.cohort_name && (
                                        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                                            <Layers size={14} />
                                            {broadcast.cohort_name}
                                        </div>
                                    )}
                                    {broadcast.course_title && (
                                        <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 bg-purple-50 px-3 py-1 rounded-lg border border-purple-100">
                                            <BookOpen size={14} />
                                            {broadcast.course_title}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 group-hover:text-primary transition-colors mb-3">
                                        {broadcast.title}
                                    </h2>
                                    <div className="text-gray-600 leading-relaxed line-clamp-2 text-lg">
                                        {broadcast.message}
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-gray-50">
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <Calendar size={18} className="text-gray-400" />
                                        <span>{new Date(broadcast.created_at).toLocaleDateString('en-US', { 
                                            month: 'short', 
                                            day: 'numeric', 
                                            year: 'numeric' 
                                        })}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <User size={18} className="text-gray-400" />
                                        <span>Sent by {broadcast.sender_role.charAt(0).toUpperCase() + broadcast.sender_role.slice(1)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            </div>

            {/* Broadcast Detail Modal */}
            {selectedBroadcast && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                    <div 
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={() => setSelectedBroadcast(null)}
                    />
                    <div className="relative bg-white rounded-[32px] w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 text-left">
                        <div className="p-8 md:p-10">
                            <button
                                onClick={() => setSelectedBroadcast(null)}
                                className="absolute right-6 top-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                            >
                                <X size={24} />
                            </button>

                            <div className="space-y-6 text-left">
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                                        selectedBroadcast.sender_role === 'admin' 
                                            ? 'bg-red-50 text-red-600 border border-red-100' 
                                            : 'bg-blue-50 text-blue-600 border border-blue-100'
                                    }`}>
                                        {selectedBroadcast.sender_role} announcement
                                    </span>
                                    {selectedBroadcast.cohort_name && (
                                        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                                            <Layers size={14} />
                                            {selectedBroadcast.cohort_name}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h2 className="text-3xl font-black text-gray-900 mb-2">
                                        {selectedBroadcast.title}
                                    </h2>
                                    <div className="flex items-center gap-4 text-sm text-gray-500 font-medium">
                                        <span className="flex items-center gap-1.5">
                                            <Calendar size={16} />
                                            {new Date(selectedBroadcast.created_at).toLocaleDateString('en-US', { 
                                                month: 'long', 
                                                day: 'numeric', 
                                                year: 'numeric' 
                                            })}
                                        </span>
                                        <span className="flex items-center gap-1.5 capitalize">
                                            <User size={16} />
                                            Sent by {selectedBroadcast.sender_role}
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-2xl p-6 md:p-8 min-h-[150px] max-h-[50vh] overflow-y-auto">
                                    <p className="text-gray-700 leading-relaxed text-lg whitespace-pre-wrap">
                                        {selectedBroadcast.message}
                                    </p>
                                </div>

                                <button
                                    onClick={() => setSelectedBroadcast(null)}
                                    className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:bg-purple-700 transition-all transform hover:-translate-y-0.5"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}

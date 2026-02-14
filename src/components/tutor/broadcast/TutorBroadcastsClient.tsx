"use client";

import { useState, useEffect } from 'react';
import { Megaphone, Plus, Search, Calendar, BookOpen, Send } from 'lucide-react';
import DashboardLayout from '@/components/tutor/DashboardLayout';
import TutorCreateBroadcastModal from './TutorCreateBroadcastModal';
import AnnouncementModal from '@/components/admin/modals/AnnouncementModal';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';

export default function TutorBroadcastsClient() {
    const { toasts, removeToast, success } = useToast();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [broadcasts, setBroadcasts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBroadcast, setSelectedBroadcast] = useState<any | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchBroadcasts = async () => {
        try {
            setLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const res = await fetch('/api/tutor/broadcasts', {
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setBroadcasts(data);
            }
        } catch (err) {
            console.error('Failed to fetch broadcasts', err);
        } finally {
            setLoading(false);
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
        const isTutor = broadcast.sender_role === 'tutor' || !broadcast.sender_role; // Fallback safely
        setSelectedBroadcast({
            ...broadcast,
            sender: broadcast.sender_role === 'admin' ? 'Platform Admin' : 'Course Tutor',
            role: broadcast.sender_role === 'admin' ? 'Admin' : 'Tutor',
            date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            time: dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        });
    };

    const filteredBroadcasts = broadcasts.filter(b =>
        b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.course_title?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <DashboardLayout isLoading={loading}>
            <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
                {toasts.map((toast) => (
                    <Toast
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        onClose={() => removeToast(toast.id)}
                    />
                ))}

                <TutorCreateBroadcastModal
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
                    <div className="space-y-1">
                        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Class Announcements</h1>
                        <p className="text-gray-500 font-medium text-lg">Send updates, reminders, and news to your students.</p>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <Plus size={20} />
                        New Announcement
                    </button>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-5 group hover:shadow-md transition-all">
                        <div className="w-14 h-14 bg-purple-50 text-primary rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Send size={28} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Postings</p>
                            <p className="text-3xl font-black text-gray-900">{broadcasts.length}</p>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
                    <div className="p-8 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50/20">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-8 bg-primary rounded-full" />
                            <h2 className="font-black text-gray-900 text-xl tracking-tight">Post History</h2>
                        </div>
                        <div className="flex gap-3 w-full md:w-auto">
                            <div className="relative flex-1 md:w-80">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search your announcements..."
                                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-gray-100 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary text-sm font-bold bg-white/50 backdrop-blur-sm transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="divide-y divide-gray-50">
                        {!loading && filteredBroadcasts.length > 0 ? (
                            filteredBroadcasts.map((broadcast) => (
                                <div
                                    key={broadcast.id}
                                    onClick={() => handleBroadcastClick(broadcast)}
                                    className="p-8 hover:bg-gray-50 transition-all group cursor-pointer relative overflow-hidden"
                                >
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary transform -translate-x-full group-hover:translate-x-0 transition-transform" />

                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="flex-1 space-y-3">
                                            <div className="flex items-center gap-4">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${broadcast.sender_role === 'admin'
                                                    ? 'bg-red-50 text-red-600 border-red-100'
                                                    : 'bg-primary/5 text-primary border-primary/10'
                                                    }`}>
                                                    {broadcast.sender_role === 'admin' ? 'Admin' : 'Tutor'}
                                                </span>
                                                <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100">
                                                    Course Specific
                                                </span>
                                                <span className="text-xs font-bold text-gray-400 flex items-center gap-1.5 uppercase tracking-wider">
                                                    <Calendar size={14} />
                                                    {new Date(broadcast.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                            </div>
                                            <h3 className="text-xl font-black text-gray-900 group-hover:text-primary transition-colors tracking-tight">{broadcast.title}</h3>
                                            <p className="text-gray-500 font-medium line-clamp-2 max-w-3xl leading-relaxed">{broadcast.message}</p>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="flex flex-col items-end gap-2 bg-gray-50/50 p-4 rounded-2xl border border-gray-100 group-hover:bg-white group-hover:shadow-sm transition-all">
                                                <div className="flex items-center gap-2">
                                                    <BookOpen size={16} className="text-primary" />
                                                    <span className="text-sm font-black text-gray-900">
                                                        {broadcast.course_title}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] bg-gray-200/50 px-2 py-1 rounded-lg text-gray-500 font-black uppercase tracking-widest">
                                                    {broadcast.cohort_name}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : !loading && (
                            <div className="py-24 text-center">
                                <div className="w-24 h-24 bg-gray-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-gray-300 transform -rotate-12 group-hover:rotate-0 transition-transform">
                                    <Megaphone size={40} />
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 tracking-tight">No announcements yet</h3>
                                <p className="text-gray-500 font-medium mt-2 max-w-xs mx-auto">Click "New Announcement" to reach your students in their respective courses.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

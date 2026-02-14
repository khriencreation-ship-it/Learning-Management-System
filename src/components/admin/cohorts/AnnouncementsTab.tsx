"use client";

import { useState, useEffect } from 'react';
import { Megaphone, Calendar, Clock, ArrowRight, User, Loader2 } from 'lucide-react';
import AnnouncementModal from '../modals/AnnouncementModal';

interface AnnouncementsTabProps {
    cohortId: string;
    cohortName: string;
}

export default function AnnouncementsTab({ cohortId, cohortName }: AnnouncementsTabProps) {
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<any | null>(null);

    useEffect(() => {
        fetchAnnouncements();
    }, [cohortId]);

    const fetchAnnouncements = async () => {
        try {
            setIsLoading(true);
            const res = await fetch(`/api/admin/cohorts/${cohortId}/announcements`);
            if (res.ok) {
                const data = await res.json();

                // Format the data to match expected structure if needed, or update render logic
                // The API returns raw DB fields: created_at, title, message, sender_id etc.
                // We need to map them to the UI display format
                const formatted = data.map((item: any) => {
                    const dateObj = new Date(item.created_at);
                    return {
                        id: item.id,
                        title: item.title,
                        message: item.message,
                        sender: item.sender_role === 'admin' ? 'System Admin' : 'Course Tutor',
                        role: item.sender_role === 'admin' ? 'Admin' : 'Tutor',
                        date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                        time: dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                        rawDate: dateObj
                    };
                });

                setAnnouncements(formatted);
            }
        } catch (error) {
            console.error('Failed to fetch announcements', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <AnnouncementModal
                isOpen={!!selectedAnnouncement}
                onClose={() => setSelectedAnnouncement(null)}
                announcement={selectedAnnouncement}
            />

            {/* Header / Info */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Cohort Broadcasts & Announcements</h3>
                    <p className="text-sm text-gray-500 mt-1">
                        View messages sent to all members of {cohortName}.
                    </p>
                </div>
            </div>

            {/* Announcements Grid */}
            <div className="grid grid-cols-1 gap-4">
                {isLoading ? (
                    <div className="py-20 flex justify-center items-center">
                        <Loader2 className="animate-spin text-purple-600" size={32} />
                    </div>
                ) : announcements.length > 0 ? (
                    announcements.map((announcement) => (
                        <div
                            key={announcement.id}
                            onClick={() => setSelectedAnnouncement(announcement)}
                            className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md hover:border-purple-100 transition-all cursor-pointer group relative overflow-hidden"
                        >
                            {/* Decorative stripe */}
                            <div className="absolute left-0 top-6 bottom-6 w-1 bg-purple-500 rounded-r-full group-hover:scale-y-110 transition-transform origin-center" />

                            <div className="pl-6 flex flex-col md:flex-row gap-6 md:items-center justify-between">
                                <div className="space-y-3 flex-1">
                                    <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-gray-500">
                                        <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-[10px] border ${announcement.role === 'Admin'
                                                ? 'text-red-600 bg-red-50 border-red-100'
                                                : 'text-primary bg-primary/5 border-primary/10'
                                            }`}>
                                            <Megaphone size={12} />
                                            {announcement.role}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <Calendar size={14} />
                                            {announcement.date}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <Clock size={14} />
                                            {announcement.time}
                                        </span>
                                    </div>

                                    <h4 className="text-xl font-bold text-gray-900 group-hover:text-purple-700 transition-colors">
                                        {announcement.title}
                                    </h4>

                                    <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
                                        {announcement.message}
                                    </p>
                                </div>

                                <div className="flex items-center gap-6 md:border-l md:border-gray-50 md:pl-6 shrink-0">
                                    <div className="flex flex-col gap-1 min-w-[100px]">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sent By</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-xs">
                                                {announcement.sender.charAt(0)}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-gray-900">{announcement.sender}</span>
                                                <span className="text-[10px] text-gray-500">{announcement.role}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <button className="hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-gray-50 text-gray-400 group-hover:bg-purple-600 group-hover:text-white transition-all">
                                        <ArrowRight size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 border-dashed">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                            <Megaphone size={28} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">No Announcements Yet</h3>
                        <p className="text-gray-500 text-sm mt-1 max-w-xs mx-auto">
                            Announcements sent to this cohort via broadcasts will appear here.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

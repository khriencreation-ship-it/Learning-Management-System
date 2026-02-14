"use client";

import { X, Calendar, User, Clock } from 'lucide-react';
import { useEffect } from 'react';

interface AnnouncementModalProps {
    isOpen: boolean;
    onClose: () => void;
    announcement: {
        id: string;
        title: string;
        message: string;
        sender: string;
        role: string;
        date: string;
        time: string;
    } | null;
}

export default function AnnouncementModal({ isOpen, onClose, announcement }: AnnouncementModalProps) {
    // Prevent scrolling when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen || !announcement) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            />

            <div className="relative bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-8 border-b border-gray-100 bg-gray-50/30 flex justify-between items-start">
                    <div>
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest mb-3 ${announcement.role?.toLowerCase() === 'tutor'
                                ? 'bg-primary/5 text-primary border-primary/10'
                                : 'bg-red-50 text-red-600 border-red-100'
                            }`}>
                            {announcement.role || 'Announcement'}
                        </span>
                        <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                            {announcement.title}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100/80 rounded-xl transition-all"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Metadata Bar */}
                <div className="px-8 py-4 bg-gray-50/50 border-b border-gray-100 flex flex-wrap gap-6 text-xs text-gray-500 font-medium">
                    <div className="flex items-center gap-2">
                        <User size={14} className="text-gray-400" />
                        <span>Sent by <span className="text-gray-900 font-bold">{announcement.sender}</span> ({announcement.role})</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-gray-400" />
                        <span>{announcement.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock size={14} className="text-gray-400" />
                        <span>{announcement.time}</span>
                    </div>
                </div>

                {/* Body */}
                <div className="p-8 overflow-y-auto custom-scrollbar">
                    <div className="prose prose-purple max-w-none text-gray-600 leading-relaxed">
                        {announcement.message.split('\n').map((paragraph, idx) => (
                            <p key={idx} className="mb-4 last:mb-0">
                                {paragraph}
                            </p>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50/30">
                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-white border border-gray-200 text-gray-700 rounded-2xl font-bold hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

"use client";

import { useState, useEffect } from 'react';
import { X, Send, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface TutorCreateBroadcastModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function TutorCreateBroadcastModal({ isOpen, onClose, onSuccess }: TutorCreateBroadcastModalProps) {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [selectedCohort, setSelectedCohort] = useState('');
    const [selectedCourse, setSelectedCourse] = useState('');

    const [cohorts, setCohorts] = useState<any[]>([]);
    const [courses, setCourses] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchAssignedData();
        } else {
            // Reset state on close
            setTitle('');
            setMessage('');
            setSelectedCohort('');
            setSelectedCourse('');
            setError('');
        }
    }, [isOpen]);

    const fetchAssignedData = async () => {
        try {
            setIsLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            // Reuse the tutor dashboard API which already returns assigned cohorts and courses
            const res = await fetch('/api/tutor/dashboard', {
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setCohorts(data.cohorts || []);
                setCourses(data.courses || []);
            }
        } catch (err) {
            console.error('Failed to fetch assigned data', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Filter courses based on selected cohort if needed
    // In many cases, courses are linked to cohorts. 
    // The dashboard API returns all assigned courses.
    // We might want to only show courses that belong to the selected cohort.

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            if (!title.trim() || !message.trim()) {
                throw new Error('Please fill in all required fields');
            }
            if (!selectedCohort) {
                throw new Error('Please select a cohort');
            }
            if (!selectedCourse) {
                throw new Error('Please select a course');
            }

            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Not authenticated');

            const payload = {
                title,
                message,
                cohort_id: selectedCohort,
                course_id: selectedCourse
            };

            const res = await fetch('/api/tutor/broadcasts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to send broadcast');
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">New Course Broadcast</h2>
                        <p className="text-xs text-gray-500 font-medium">Send an announcement to your students.</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl flex items-center gap-2 border border-red-100 animate-in fade-in duration-300">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Target Cohort</label>
                            <select
                                value={selectedCohort}
                                onChange={(e) => setSelectedCohort(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white transition-all"
                            >
                                <option value="">Choose a cohort...</option>
                                {cohorts.map(c => (
                                    <option key={c.id} value={c.id}>{c.name} {c.batch ? `(${c.batch})` : ''}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Select Course</label>
                            <select
                                value={selectedCourse}
                                onChange={(e) => setSelectedCourse(e.target.value)}
                                disabled={!selectedCohort || isLoading}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white disabled:bg-gray-50 disabled:text-gray-400 transition-all"
                            >
                                <option value="">{isLoading ? 'Loading courses...' : 'Choose a course...'}</option>
                                {courses.filter(c => c.cohort_ids?.includes(selectedCohort)).map(c => (
                                    <option key={c.id} value={c.id}>{c.title}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-4 border-t border-gray-100 pt-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-900">Subject</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="What is this announcement about?"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-900">Message</label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Enter detailed message for your students..."
                                rows={5}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-4 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send size={20} />
                                    Post Announcement
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

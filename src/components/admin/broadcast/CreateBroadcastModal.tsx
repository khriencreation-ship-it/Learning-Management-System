"use client";

import { useState, useEffect } from 'react';
import { X, Send, AlertCircle, Loader2 } from 'lucide-react';

interface CreateBroadcastModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreateBroadcastModal({ isOpen, onClose, onSuccess }: CreateBroadcastModalProps) {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [targetType, setTargetType] = useState<'cohort' | 'course'>('cohort');
    const [selectedCohort, setSelectedCohort] = useState('');
    const [selectedCourse, setSelectedCourse] = useState('');

    const [cohorts, setCohorts] = useState<any[]>([]);
    const [courses, setCourses] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchCohorts();
        } else {
            // Reset state on close
            setTitle('');
            setMessage('');
            setTargetType('cohort');
            setSelectedCohort('');
            setSelectedCourse('');
            setError('');
        }
    }, [isOpen]);

    useEffect(() => {
        if (selectedCohort && targetType === 'course') {
            fetchCoursesInCohort(selectedCohort);
        } else {
            setCourses([]);
        }
    }, [selectedCohort, targetType]);

    const fetchCohorts = async () => {
        try {
            const res = await fetch('/api/admin/cohorts');
            if (res.ok) {
                const data = await res.json();
                setCohorts(data);
            }
        } catch (err) {
            console.error('Failed to fetch cohorts', err);
        }
    };

    const fetchCoursesInCohort = async (cohortId: string) => {
        try {
            setIsLoading(true);
            // We need an endpoint to get courses for a specific cohort.
            // Assuming /api/admin/cohorts/[id]/courses or filtering a general courses list.
            // For now, let's assume we can hit the general courses endpoint and filter or utilize a new param if needed.
            // A safer bet given current APIs might be to fetch all courses and filter, OR use the assign-tutors style fetch.
            // Actually, /api/admin/courses returns all courses. Let's see if we can filter by cohort there?
            // Existing `getCourses` in page.tsx fetched all.
            // Let's try fetching the cohort details which includes courses usually.
            console.log('Fetching courses for cohort:', cohortId);
            const res = await fetch(`/api/admin/cohorts/${cohortId}`);
            if (res.ok) {
                const data = await res.json();
                console.log('Cohort details fetched:', data);
                // Assumes data.courses contains the courses
                if (data.courses) {
                    console.log('Setting courses:', data.courses);
                    setCourses(data.courses);
                } else {
                    console.warn('No courses in cohort data');
                    setCourses([]);
                }
            }
        } catch (err) {
            console.error('Failed to fetch courses', err);
        } finally {
            setIsLoading(false);
        }
    };

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
            if (targetType === 'course' && !selectedCourse) {
                throw new Error('Please select a course');
            }

            const payload = {
                title,
                message,
                cohort_id: selectedCohort,
                course_id: targetType === 'course' ? selectedCourse : null,
                target_type: targetType
            };

            const res = await fetch('/api/admin/broadcasts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">New Broadcast</h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl flex items-center gap-2">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    {/* Targeting Section */}
                    <div className="space-y-4">
                        <label className="text-sm font-bold text-gray-900 block">Target Audience</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => { setTargetType('cohort'); setSelectedCourse(''); }}
                                className={`py-3 px-4 rounded-xl text-sm font-bold border transition-all ${targetType === 'cohort'
                                    ? 'bg-purple-50 border-purple-200 text-purple-700'
                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                General Cohort
                            </button>
                            <button
                                type="button"
                                onClick={() => setTargetType('course')}
                                className={`py-3 px-4 rounded-xl text-sm font-bold border transition-all ${targetType === 'course'
                                    ? 'bg-purple-50 border-purple-200 text-purple-700'
                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                Specific Course
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Select Cohort</label>
                            <select
                                value={selectedCohort}
                                onChange={(e) => setSelectedCohort(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-white"
                            >
                                <option value="">Choose a cohort...</option>
                                {cohorts.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        {targetType === 'course' && (
                            <div className="animate-in fade-in slide-in-from-top-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Select Course</label>
                                <select
                                    value={selectedCourse}
                                    onChange={(e) => setSelectedCourse(e.target.value)}
                                    disabled={!selectedCohort || isLoading}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-white disabled:bg-gray-50 disabled:text-gray-400"
                                >
                                    <option value="">{isLoading ? 'Loading courses...' : 'Choose a course...'}</option>
                                    {courses.map(c => (
                                        <option key={c.id} value={c.id}>{c.title}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4 border-t border-gray-100 pt-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-900">Subject</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter broadcast subject..."
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-900">Message</label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Type your message here..."
                                rows={5}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 resize-none"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-lg shadow-purple-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Send size={20} />
                                Send Broadcast
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}

"use client";

import Link from 'next/link';
import { ChevronRight, Plus, Lock } from 'lucide-react';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import CreateCohortModal from './CreateCohortModal';
import CreateCourseModal from './modals/CreateCourseModal';
import CreateStudentModal from './modals/CreateStudentModal';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/ui/Toast';

interface RecentItem {
    id: string;
    primaryText: string;
    secondaryText?: string;
    avatar?: string;
    locked?: boolean;
}

interface RecentListProps {
    title: string;
    items: RecentItem[];
    viewMoreLink: string;
    type: 'cohort' | 'student' | 'tutor' | 'course';
    actionLabel?: string;
}

export default function RecentList({ title, items, viewMoreLink, type, actionLabel }: RecentListProps) {
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { toasts, removeToast, success } = useToast();

    const handleActionClick = () => {
        setIsModalOpen(true);
    };

    const handleItemClick = (id: string, locked?: boolean) => {
        if (locked) return;
        // Navigate to details page: viewMoreLink (e.g. /admin/cohorts) + / + id
        router.push(`${viewMoreLink}/${id}`);
    };

    return (
        <div className="bg-white rounded-2xl  rounded-[2rem] shadow-sm border border-gray-100 p-6 flex flex-col h-full">
            {/* ... (header remains) ... */}

            <div className="flex-1 space-y-4 mb-6 overflow-y-auto custom-scrollbar pr-2">
                {items.length > 0 ? (
                    items.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => handleItemClick(item.id, item.locked)}
                            className={`flex items-center gap-3 p-2 rounded-xl transition-colors group relative
                                ${item.locked ? 'opacity-70 cursor-not-allowed bg-gray-50' : 'hover:bg-gray-50 cursor-pointer'}
                            `}
                        >
                            {/* Avatar / Icon Placeholder */}
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0
                                ${type === 'cohort' ? 'bg-blue-100 text-blue-600' : ''}
                                ${type === 'student' ? 'bg-green-100 text-green-600' : ''}
                                ${type === 'tutor' ? 'bg-orange-100 text-orange-600' : ''}
                                ${type === 'course' ? 'bg-purple-100 text-purple-600' : ''}
                                ${item.locked ? '!bg-gray-200 !text-gray-500' : ''}
                            `}>
                                {item.locked ? <Lock size={16} /> : (item.primaryText ? item.primaryText.charAt(0) : '?')}
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-primary transition-colors">{item.primaryText}</p>
                                {item.secondaryText && (
                                    <p className="text-xs text-gray-500 truncate">{item.secondaryText}</p>
                                )}
                            </div>

                            {!item.locked && (
                                <ChevronRight size={16} className="text-gray-300 group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100" />
                            )}
                            {item.locked && (
                                <Lock size={14} className="text-gray-400" />
                            )}
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-2
                            ${type === 'cohort' ? 'bg-blue-50 text-blue-400' : ''}
                            ${type === 'student' ? 'bg-green-50 text-green-400' : ''}
                            ${type === 'tutor' ? 'bg-orange-50 text-orange-400' : ''}
                            ${type === 'course' ? 'bg-purple-50 text-purple-400' : ''} 
                        `}>
                            {type === 'cohort' && (
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /></svg>
                            )}
                            {type === 'course' && (
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>
                            )}
                            {type === 'student' && (
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                            )}
                            {type === 'tutor' && (
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>
                            )}
                        </div>
                        <div>
                            <p className="text-gray-900 font-medium">
                                No {type}s found
                            </p>
                            <p className="text-gray-500 text-xs mt-1 max-w-[200px] mx-auto">
                                {type === 'cohort' && "No active cohorts available currently."}
                                {type === 'course' && "No courses have been added yet."}
                                {type === 'student' && "No students registered yet."}
                                {type === 'tutor' && "No tutors assigned yet."}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <Link
                href={viewMoreLink}
                className="flex items-center justify-center gap-2 w-full py-3 bg-primary/5 text-primary hover:bg-primary hover:text-white rounded-xl text-sm font-medium transition-colors mt-auto group"
            >
                View More
                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>

            {/* Modals */}
            {type === 'cohort' && (
                <CreateCohortModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={() => success('Cohort created successfully!')}
                />
            )}
            {type === 'course' && (
                <CreateCourseModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={() => success('Course created successfully!')}
                />
            )}
            {type === 'student' && (
                <CreateStudentModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={() => success('Student enrolled successfully!')}
                />
            )}

            {/* Toast Notifications */}
            {toasts.map((toast) => (
                <Toast
                    key={toast.id}
                    message={toast.message}
                    type={toast.type}
                    onClose={() => removeToast(toast.id)}
                />
            ))}
        </div>
    );
}

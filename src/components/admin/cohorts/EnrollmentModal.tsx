"use client";

import { useState, useEffect } from 'react';
import { X, Search, CheckCircle, Circle, Users, Save } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

interface EnrollmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    cohortId: string;
    courseId: string;
    courseTitle: string;
}

interface Student {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
    identifier?: string;
    isEnrolled?: boolean; // Derived state
}

export default function EnrollmentModal({ isOpen, onClose, cohortId, courseId, courseTitle }: EnrollmentModalProps) {
    const { success, error: toastError } = useToast();
    const [students, setStudents] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch Students in Cohort AND Enrollments for this Course
    useEffect(() => {
        if (isOpen && cohortId && courseId) {
            fetchData();
        }
    }, [isOpen, cohortId, courseId]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // 1. Fetch Students in Cohort
            const studentsRes = await fetch(`/api/admin/cohorts/${cohortId}/students`);
            const studentsData = await studentsRes.json();

            // 2. Fetch Enrollments for this Course + Cohort
            const enrollmentsRes = await fetch(`/api/admin/enrollments?courseId=${courseId}&cohortId=${cohortId}`);
            const enrollmentsData = await enrollmentsRes.json();

            const enrolledStudentIds = new Set(enrollmentsData.studentIds || []);

            // 3. Merge
            const merged = (studentsData.students || []).map((s: any) => ({
                id: s.id,
                full_name: s.profile?.full_name || 'Unknown',
                email: s.profile?.email || '',
                identifier: s.profile?.identifier,
                avatar_url: s.profile?.avatar_url,
                isEnrolled: enrolledStudentIds.has(s.id)
            }));

            setStudents(merged);

        } catch (err) {
            console.error(err);
            toastError("Failed to load students");
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggle = (studentId: string) => {
        setStudents(prev => prev.map(s =>
            s.id === studentId ? { ...s, isEnrolled: !s.isEnrolled } : s
        ));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Find who is enrolled now
            const currentlyEnrolledIds = students.filter(s => s.isEnrolled).map(s => s.id);
            const unenrolledIds = students.filter(s => !s.isEnrolled).map(s => s.id);

            // We need to sync this.
            // Ideally our API handles "Sync".
            // But our API is POST (add) and DELETE (remove).

            // Strategy: 
            // 1. POST the IDs that are enrolled (upsert handles duplicates).
            // 2. DELETE the IDs that are NOT enrolled.

            // Enrolling:
            if (currentlyEnrolledIds.length > 0) {
                await fetch('/api/admin/enrollments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        studentIds: currentlyEnrolledIds,
                        courseId,
                        cohortId
                    })
                });
            }

            // Unenrolling:
            if (unenrolledIds.length > 0) {
                await fetch('/api/admin/enrollments', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        studentIds: unenrolledIds,
                        courseId,
                        cohortId
                    })
                });
            }

            success("Enrollments updated successfully");
            onClose();
        } catch (err) {
            console.error(err);
            toastError("Failed to save changes");
        } finally {
            setIsSaving(false);
        }
    };

    const filteredStudents = students.filter(s =>
        s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.identifier || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative bg-white rounded-[2rem] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Manage Enrollments</h2>
                        <p className="text-sm text-gray-500">
                            Select students from this cohort to enroll in <span className="font-bold text-purple-600">{courseTitle}</span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-900"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Search */}
                <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search students..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium text-sm"
                        />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-2 custom-scrollbar">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mb-2" />
                            <p className="text-xs text-gray-400 font-medium">Loading students...</p>
                        </div>
                    ) : filteredStudents.length > 0 ? (
                        filteredStudents.map(student => (
                            <div
                                key={student.id}
                                onClick={() => handleToggle(student.id)}
                                className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${student.isEnrolled
                                    ? 'bg-purple-50 border-purple-200 shadow-sm'
                                    : 'bg-white border-gray-100 hover:bg-gray-50 hover:border-gray-200'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${student.isEnrolled ? 'bg-purple-200 text-purple-700' : 'bg-gray-100 text-gray-500'
                                        }`}>
                                        {student.full_name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className={`font-bold text-sm ${student.isEnrolled ? 'text-purple-900' : 'text-gray-900'}`}>{student.full_name}</p>
                                        <p className="text-xs text-gray-500">{student.identifier || 'No ID'}</p>
                                    </div>
                                </div>
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${student.isEnrolled
                                    ? 'bg-purple-600 border-purple-600'
                                    : 'bg-transparent border-gray-300'
                                    }`}>
                                    {student.isEnrolled && <CheckCircle size={14} className="text-white" />}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 text-gray-400">
                            <Users size={32} className="mx-auto mb-3 opacity-50" />
                            <p className="text-sm">No students found</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-white sticky bottom-0 z-10">
                    <div className="flex items-center justify-between gap-4">
                        <div className="text-sm text-gray-500 font-medium">
                            <span className="text-purple-600 font-bold">{students.filter(s => s.isEnrolled).length}</span> selected
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="px-5 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-all shadow-lg shadow-purple-200 disabled:opacity-70"
                            >
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

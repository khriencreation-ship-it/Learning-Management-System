"use client";

import { Plus, Trash2, BookOpen, Search, Lock, Unlock, Users, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import AddCourseModal from './AddCourseModal';
import DeleteConfirmationModal from '../modals/DeleteConfirmationModal';
import EnrollmentModal from './EnrollmentModal';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface CoursesTabProps {
    cohortId: string;
    cohortName?: string;
    initialCourses?: any[];
    isReadOnly?: boolean;
}

export default function CoursesTab({ cohortId, cohortName = "this Cohort", initialCourses = [], isReadOnly = false }: CoursesTabProps) {
    const router = useRouter();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Delete State
    const [courseToDelete, setCourseToDelete] = useState<{ id: string | number, title: string } | null>(null);

    // Enrollment Modal State
    const [enrollmentModalData, setEnrollmentModalData] = useState<{ courseId: string, courseTitle: string } | null>(null);

    const [courses, setCourses] = useState<any[]>(initialCourses);

    // Sync state with props on refresh
    useEffect(() => {
        setCourses(initialCourses);
    }, [initialCourses]);

    const filteredCourses = courses.filter(course =>
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.tutor?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleDeleteClick = (course: { id: string | number, title: string }) => {
        setCourseToDelete(course);
    };

    const confirmDelete = async () => {
        if (courseToDelete) {
            try {
                const res = await fetch(`/api/admin/cohorts/${cohortId}/courses`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ courseId: courseToDelete.id }),
                });

                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || 'Failed to remove course');
                }

                setCourses(courses.filter(c => c.id !== courseToDelete.id && c._id !== courseToDelete.id));
                router.refresh();
                setCourseToDelete(null);
            } catch (error: any) {
                console.error('Error removing course:', error);
                alert(`Failed to remove course: ${error.message}`);
            }
        }
    };

    const handleAddCourses = async (courseIds: string[]) => {
        if (!courseIds.length) return;

        try {
            const res = await fetch(`/api/admin/cohorts/${cohortId}/add-courses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ courseIds }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to add courses');
            }

            // Refresh to get updated list
            router.refresh();
            setIsAddModalOpen(false);
        } catch (error: any) {
            console.error('Error adding courses:', error);
            alert(`Failed to add courses: ${error.message}`);
        }
    };

    const handleToggleLock = async (courseId: string | number, currentSettings: any) => {
        if (isReadOnly) return;
        const isLocked = currentSettings?.isLocked || false;
        const newSettings = { ...currentSettings, isLocked: !isLocked };

        // Optimistic update
        setCourses(prev => prev.map(c =>
            (c.id === courseId || c._id === courseId) ? { ...c, settings: newSettings } : c
        ));

        try {
            const res = await fetch(`/api/admin/cohorts/${cohortId}/courses/${courseId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ settings: newSettings }),
            });

            if (!res.ok) {
                throw new Error('Failed to update settings');
            }
            router.refresh();
        } catch (error) {
            console.error('Error toggling lock:', error);
            // Revert on error
            setCourses(prev => prev.map(c =>
                (c.id === courseId || c._id === courseId) ? { ...c, settings: currentSettings } : c
            ));
            alert('Failed to update course lock status');
        }
    };

    return (
        <div className="space-y-6">
            {!isReadOnly && (
                <>
                    <AddCourseModal
                        isOpen={isAddModalOpen}
                        onClose={() => setIsAddModalOpen(false)}
                        onAdd={handleAddCourses}
                        existingCourseIds={courses.map(c => c.id)}
                    />

                    <DeleteConfirmationModal
                        isOpen={!!courseToDelete}
                        onClose={() => setCourseToDelete(null)}
                        onConfirm={confirmDelete}
                        title="Remove Course"
                        message={`Are you sure you want to remove ${courseToDelete?.title} from ${cohortName} Cohort?`}
                    />

                    {enrollmentModalData && (
                        <EnrollmentModal
                            isOpen={true}
                            onClose={() => setEnrollmentModalData(null)}
                            cohortId={cohortId}
                            courseId={enrollmentModalData.courseId}
                            courseTitle={enrollmentModalData.courseTitle}
                        />
                    )}
                </>
            )}

            <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search courses..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border-2 border-transparent focus:border-primary rounded-xl outline-none transition-colors"
                    />
                </div>
                {!isReadOnly && (
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 bg-primary text-white px-5 py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200"
                    >
                        <Plus size={20} />
                        Add Course
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 gap-4">
                {filteredCourses.length > 0 ? (
                    filteredCourses.map((course) => {
                        const isLocked = course.settings?.isLocked;
                        return (
                            <div key={course.id || course._id} className="flex flex-col md:flex-row md:items-center justify-between bg-white p-5 rounded-2xl border border-gray-100 hover:border-gray-200 transition-colors gap-4">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isLocked ? 'bg-gray-100 text-gray-400' : 'bg-orange-100 text-orange-600'}`}>
                                        <BookOpen size={24} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-gray-900 text-lg">{course.title}</h4>
                                            {isLocked && (
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-500 uppercase tracking-wide border border-gray-200">
                                                    Locked
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                            <p>Tutor: {course.instructor || course.tutor || 'Unassigned'}</p>
                                            <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                                            <p className="flex items-center gap-1.5 text-purple-600 font-medium">
                                                <Users size={14} />
                                                {course.student_count || 0} Students
                                            </p>
                                        </div>
                                        {isReadOnly && !isLocked && (
                                            <Link
                                                href={`/student/courses/${course.id || course._id}?cohortId=${cohortId}`}
                                                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-purple-700 mt-3 group"
                                            >
                                                View Course details
                                                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                            </Link>
                                        )}
                                    </div>
                                </div>
                                {!isReadOnly && (
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <button
                                            onClick={() => setEnrollmentModalData({ courseId: course.id || course._id, courseTitle: course.title })}
                                            className="flex items-center gap-2 text-sm px-4 py-2 bg-purple-50 text-purple-700 rounded-lg font-bold hover:bg-purple-100 transition-colors"
                                        >
                                            <Users size={16} />
                                            Manage Students
                                        </button>
                                        <div className="w-px h-6 bg-gray-200 mx-1 hidden md:block"></div>
                                        <button
                                            onClick={() => handleToggleLock(course.id || course._id, course.settings)}
                                            className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg font-medium transition-colors ${isLocked
                                                ? 'text-gray-500 hover:bg-gray-100'
                                                : 'text-orange-600 hover:bg-orange-50'
                                                }`}
                                            title={isLocked ? "Unlock Course for this Cohort" : "Lock Course for this Cohort"}
                                        >
                                            {isLocked ? <Lock size={16} /> : <Unlock size={16} />}
                                            {isLocked ? 'Unlock' : 'Lock'}
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(course)}
                                            className="flex items-center gap-2 text-sm text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg font-medium transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 text-gray-500">
                        <div className="flex flex-col items-center">
                            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 mb-2">
                                <BookOpen size={24} />
                            </div>
                            {searchQuery ? `No courses found matching "${searchQuery}"` : "No courses added yet."}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

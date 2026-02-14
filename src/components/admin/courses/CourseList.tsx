"use client";

import { Plus, Trash2, BookOpen, Search, Filter, Users, Layers, Zap, Clock, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import CourseCard from '../CourseCard';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/ui/Toast';

interface CourseListProps {
    initialCourses: any[];
}

export default function CourseList({ initialCourses = [] }: CourseListProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [courses, setCourses] = useState<any[]>(initialCourses);
    const [isLoading, setIsLoading] = useState(false);
    const { toasts, removeToast, success } = useToast();

    // Advanced Filtering States
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedInstructor, setSelectedInstructor] = useState('all');
    const [pendingStatus, setPendingStatus] = useState('all');
    const [pendingInstructor, setPendingInstructor] = useState('all');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [tutors, setTutors] = useState<any[]>([]);

    // Analytics (based on initial set)
    const stats = {
        total: initialCourses.length,
        published: initialCourses.filter(c => c.status === 'active' || c.status === 'published').length,
        draft: initialCourses.filter(c => c.status === 'draft').length
    };

    // Fetch Tutors for Filter
    useEffect(() => {
        fetch('/api/admin/tutors')
            .then(res => res.json())
            .then(data => setTutors(data))
            .catch(err => console.error('Failed to fetch tutors', err));
    }, []);

    // Debounced search fetch
    useEffect(() => {
        const fetchCourses = async () => {
            setIsLoading(true);
            try {
                const params = new URLSearchParams({
                    query: searchQuery,
                    status: selectedStatus,
                    instructor: selectedInstructor
                });
                const res = await fetch(`/api/admin/courses?${params.toString()}`);
                if (res.ok) {
                    const data = await res.json();
                    setCourses(data.map((c: any) => ({
                        id: c.id,
                        title: c.title,
                        description: c.description,
                        instructor: c.instructor,
                        image: c.image,
                        topics: c.topics_count,
                        lessons: c.lessons_count,
                        quizzes: c.quizzes_count,
                        assignments: c.assignments_count,
                        status: c.status,
                        publishedAt: c.published_at,
                        createdAt: c.created_at,
                        code: c.code,
                        cohortsCount: c.course_cohorts?.[0]?.count || 0
                    })));
                }
            } catch (err) {
                console.error('Search failed:', err);
            } finally {
                setIsLoading(false);
            }
        };

        const timer = setTimeout(() => {
            fetchCourses();
        }, searchQuery ? 500 : 0);

        return () => clearTimeout(timer);
    }, [searchQuery, selectedStatus, selectedInstructor, initialCourses]);

    const handleApplyFilters = () => {
        setSelectedStatus(pendingStatus);
        setSelectedInstructor(pendingInstructor);
        setIsFilterOpen(false);
    };

    const handleResetFilters = () => {
        setPendingStatus('all');
        setPendingInstructor('all');
        setSelectedStatus('all');
        setSelectedInstructor('all');
        setSearchQuery('');
        setIsFilterOpen(false);
    };

    // Sync state with props when router refreshes
    useEffect(() => {
        if (!searchQuery) {
            setCourses(initialCourses);
        }
    }, [initialCourses, searchQuery]);

    return (
        <div className="space-y-10">
            {/* Page Header with Create Button */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-2">
                <div className="space-y-1">
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Courses</h1>
                    <p className="text-gray-500 font-medium text-lg">Manage all educational courses and modules.</p>
                </div>
                <Link
                    href="/admin/courses/create"
                    className="flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-2xl font-bold hover:bg-purple-700 transition-all shadow-xl shadow-purple-200 active:scale-95 group"
                >
                    <Plus size={22} className="group-hover:rotate-90 transition-transform duration-300" />
                    Create New Course
                </Link>
            </div>

            {/* Metric Counters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-5 group hover:shadow-md transition-all">
                    <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <Layers size={28} />
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Total Courses</p>
                        <h3 className="text-3xl font-bold text-gray-900">{stats.total}</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-5 group hover:shadow-md transition-all">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                        <Zap size={28} />
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Published</p>
                        <h3 className="text-3xl font-bold text-gray-900">{stats.published}</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-5 group hover:shadow-md transition-all">
                    <div className="w-14 h-14 rounded-2xl bg-yellow-50 flex items-center justify-center text-yellow-600 group-hover:scale-110 transition-transform">
                        <Clock size={28} />
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Drafts</p>
                        <h3 className="text-3xl font-bold text-gray-900">{stats.draft}</h3>
                    </div>
                </div>
            </div>

            {/* Header Actions */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search courses..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-100 focus:border-primary rounded-xl outline-none transition-colors shadow-sm"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <button
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all border ${isFilterOpen ? 'bg-primary text-white border-primary shadow-lg shadow-purple-200' : 'bg-white text-gray-700 border-gray-100 hover:border-primary shadow-sm'}`}
                            >
                                <Filter size={18} />
                                Filter
                                {(selectedStatus !== 'all' || selectedInstructor !== 'all') && (
                                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                )}
                            </button>

                            {isFilterOpen && (
                                <div className="absolute right-0 mt-3 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 z-[50] animate-in fade-in zoom-in duration-200">
                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Status</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {['all', 'published', 'draft', 'archived'].map((status) => (
                                                    <button
                                                        key={status}
                                                        onClick={() => setPendingStatus(status === 'published' ? 'active' : status)}
                                                        className={`px-3 py-2.5 rounded-xl text-xs font-bold capitalize transition-all border ${pendingStatus === (status === 'published' ? 'active' : status) ? 'bg-purple-50 text-primary border-primary' : 'bg-gray-50 text-gray-500 border-transparent hover:bg-gray-100'}`}
                                                    >
                                                        {status}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Instructor</label>
                                            <select
                                                value={pendingInstructor}
                                                onChange={(e) => setPendingInstructor(e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border-gray-100 border text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none"
                                            >
                                                <option value="all">All Instructors</option>
                                                {tutors.map((t: any) => (
                                                    <option key={t.id} value={t.name}>{t.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="flex gap-2 pt-2">
                                            <button
                                                onClick={handleResetFilters}
                                                className="flex-1 py-3 text-xs font-bold text-gray-500 hover:bg-gray-50 rounded-xl transition-colors border border-gray-100"
                                            >
                                                Reset
                                            </button>
                                            <button
                                                onClick={handleApplyFilters}
                                                className="flex-[2] py-3 text-xs font-bold text-white bg-primary hover:bg-purple-700 rounded-xl transition-colors shadow-lg shadow-purple-200"
                                            >
                                                Apply Filter
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>


            {/* Render Toasts */}
            {toasts.map((toast) => (
                <Toast
                    key={toast.id}
                    message={toast.message}
                    type={toast.type}
                    onClose={() => removeToast(toast.id)}
                />
            ))}

            {/* List */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-gray-500 font-medium">Searching courses...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.length > 0 ? (
                        courses.map((course) => (
                            <div key={course.id || course._id} className="h-full">
                                <CourseCard
                                    id={course.id || course._id}
                                    title={course.title}
                                    description={course.description}
                                    instructor={course.instructor}
                                    image={course.image}
                                    topics={course.topics}
                                    lessons={course.lessons}
                                    quizzes={course.quizzes}
                                    assignments={course.assignments}
                                    status={course.status}
                                    datePublished={course.publishedAt || course.createdAt}
                                    code={course.code}
                                    cohortsCount={course.cohortsCount}
                                />
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-16 bg-white rounded-2xl border border-gray-100 text-gray-500">
                            <div className="flex flex-col items-center">
                                <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 mb-4">
                                    <BookOpen size={32} />
                                </div>
                                <p className="text-lg font-medium text-gray-900">No courses found</p>
                                <p className="text-gray-500 text-sm mt-1">
                                    {searchQuery ? `No results for "${searchQuery}"` : "Get started by creating a new course."}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/tutor/DashboardLayout';
import CourseCard from '@/components/admin/CourseCard';
import { supabase } from '@/lib/supabase';
import { BookOpen, Search, Filter, Layers, Zap, Clock } from 'lucide-react';

export default function TutorCoursesClient() {
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Filter States
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [pendingStatus, setPendingStatus] = useState('all');
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                // Get session for token
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) return;

                const res = await fetch('/api/tutor/courses', {
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`
                    }
                });

                if (!res.ok) throw new Error('Failed to fetch courses');

                const data = await res.json();
                setCourses(data);
            } catch (error) {
                console.error('Error fetching tutor courses:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, []);

    // Filter Logic
    const filteredCourses = courses.filter(course => {
        const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.code?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = selectedStatus === 'all' ||
            (selectedStatus === 'published' && (course.status === 'active' || course.status === 'published')) ||
            course.status === selectedStatus;

        return matchesSearch && matchesStatus;
    });

    // Stats
    const stats = {
        total: courses.length,
        published: courses.filter(c => c.status === 'active' || c.status === 'published').length,
        draft: courses.filter(c => c.status === 'draft').length
    };

    const handleApplyFilters = () => {
        setSelectedStatus(pendingStatus);
        setIsFilterOpen(false);
    };

    const handleResetFilters = () => {
        setPendingStatus('all');
        setSelectedStatus('all');
        setSearchQuery('');
        setIsFilterOpen(false);
    };

    return (
        <DashboardLayout isLoading={loading}>
            <div className="max-w-6xl mx-auto py-4 space-y-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-end gap-6 pb-2">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">My Courses</h1>
                        <p className="text-gray-500 font-medium text-lg">View and manage your assigned courses.</p>
                    </div>
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

                {/* Search and Filters */}
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search your courses..."
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
                                    {(selectedStatus !== 'all') && (
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

                {/* Course List */}
                {!loading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCourses.length > 0 ? (
                            filteredCourses.map((course) => (
                                <div key={course.id} className="h-full">
                                    <CourseCard
                                        id={course.id}
                                        title={course.title}
                                        description={course.description}
                                        instructor={course.instructor}
                                        image={course.image}
                                        topics={course.topics}
                                        lessons={course.lessons}
                                        quizzes={course.quizzes}
                                        assignments={course.assignments}
                                        status={course.status}
                                        datePublished={course.publishedAt}
                                        code={course.code}
                                        cohortsCount={course.cohortsCount}
                                        linkPrefix="/tutor/courses"
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
                                        {searchQuery || selectedStatus !== 'all' ? "Try adjusting your filters or search." : "You haven't been assigned any courses yet."}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

'use client';

import { useState, useMemo, useEffect } from 'react';
import DashboardLayout from '@/components/student/DashboardLayout';
import CourseCard from '@/components/admin/CourseCard';
import { BookOpen, Search, Filter, Layers, Zap, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function StudentCoursesClient() {
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) return;

                const res = await fetch('/api/student/courses', {
                    headers: { 'Authorization': `Bearer ${session.access_token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    setCourses(data);
                }
            } catch (error) {
                console.error('Failed to fetch courses', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, []);

    const filteredCourses = useMemo(() => {
        return courses.filter(course => {
            const matchesSearch = (course.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (course.code || '').toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus = selectedStatus === 'all' || course.status === selectedStatus;

            return matchesSearch && matchesStatus;
        });
    }, [courses, searchQuery, selectedStatus]);

    const stats = useMemo(() => {
        return {
            total: courses.length,
            active: courses.filter(c => c.status === 'active' || c.status === 'published').length,
            completed: courses.filter(c => c.status === 'completed').length
        };
    }, [courses]);

    return (
        <DashboardLayout isLoading={loading}>
            <div className="max-w-6xl mx-auto py-4 space-y-10">
                <div className="flex flex-col md:flex-row justify-between items-end gap-6 pb-2">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">My Courses</h1>
                        <p className="text-gray-500 font-medium text-lg">View courses you are currently taking.</p>
                    </div>
                </div>

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
                            <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Active</p>
                            <h3 className="text-3xl font-bold text-gray-900">{stats.active}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-5 group hover:shadow-md transition-all">
                        <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                            <Clock size={28} />
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Completed</p>
                            <h3 className="text-3xl font-bold text-gray-900">{stats.completed}</h3>
                        </div>
                    </div>
                </div>

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
                                    className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all border ${isFilterOpen ? 'bg-primary text-white border-primary shadow-lg' : 'bg-white text-gray-700 border-gray-100 hover:border-primary shadow-sm'}`}
                                >
                                    <Filter size={18} />
                                    Filter
                                </button>
                                {isFilterOpen && (
                                    <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 z-[50]">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Status</label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {['all', 'active', 'completed'].map((status) => (
                                                        <button
                                                            key={status}
                                                            onClick={() => {
                                                                setSelectedStatus(status);
                                                                setIsFilterOpen(false);
                                                            }}
                                                            className={`px-3 py-2 rounded-xl text-xs font-bold capitalize transition-all border ${selectedStatus === status ? 'bg-purple-50 text-primary border-primary' : 'bg-gray-50 text-gray-500 border-transparent hover:bg-gray-100'}`}
                                                        >
                                                            {status}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCourses.length > 0 ? (
                        filteredCourses.map((course) => (
                            <CourseCard
                                key={course.id}
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
                                linkPrefix="/student/courses"
                                isLocked={course.isLocked}
                                cohortNames={course.cohortNames}
                            />
                        ))
                    ) : (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 border-dashed text-center">
                            <div className="w-20 h-20 rounded-full bg-purple-50 flex items-center justify-center text-purple-300 mb-6">
                                <BookOpen size={40} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">No Courses Found</h3>
                            <p className="text-gray-500 max-w-sm">
                                {courses.length === 0
                                    ? "You don't have any courses assigned to you yet."
                                    : "No courses match your search or filter."
                                }
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}

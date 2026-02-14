'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/tutor/DashboardLayout';
import { BookOpen, ChevronRight, Search, ArrowLeft, Book } from 'lucide-react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

interface Course {
    id: string;
    title: string;
    description: string;
    image: string;
    instructor: string;
    lessons: number;
    assignments: number;
}

export default function CohortCoursesPage({ params }: { params: Promise<{ cohortId: string }> }) {
    const { cohortId } = use(params);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    router.push('/login');
                    return;
                }

                // Using the enhanced API with cohortId filter
                const response = await fetch(`/api/tutor/courses?cohortId=${cohortId}`, {
                    headers: { 'Authorization': `Bearer ${session.access_token}` }
                });

                if (response.ok) {
                    const data = await response.json();
                    setCourses(data);
                }
            } catch (error) {
                console.error('Error fetching courses:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, [cohortId, router]);

    const filteredCourses = courses.filter(course =>
        course.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <button
                    onClick={() => router.push('/tutor/assignments')}
                    className="flex items-center gap-2 text-gray-500 hover:text-purple-600 transition-colors mb-6 group"
                >
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="font-medium">Back to Cohorts</span>
                </button>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Select Course</h1>
                        <p className="text-gray-500 text-lg text-pretty max-w-2xl">
                            Select a course from this cohort to view its assignments.
                        </p>
                    </div>

                    <div className="relative max-w-md w-full">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Find a course..."
                            className="block w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white rounded-3xl h-64 border border-gray-100 shadow-sm" />
                        ))}
                    </div>
                ) : filteredCourses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCourses.map((course) => (
                            <div
                                key={course.id}
                                onClick={() => router.push(`/tutor/assignments/${cohortId}/${course.id}`)}
                                className="group bg-white rounded-3xl border border-gray-100 p-6 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer shadow-sm relative"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="bg-purple-50 p-2 rounded-xl text-purple-600">
                                        <ChevronRight size={20} />
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 mb-6">
                                    <div className="relative w-16 h-16 flex-shrink-0">
                                        <div className="absolute inset-0 bg-purple-100 rounded-xl transform rotate-3" />
                                        <div className="relative w-full h-full rounded-xl overflow-hidden border-2 border-white shadow-sm">
                                            {course.image ? (
                                                <Image
                                                    src={course.image}
                                                    alt={course.title}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                                    <Book size={28} className="text-white opacity-80" />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1 group-hover:text-purple-600 transition-colors">
                                            {course.title}
                                        </h3>
                                        <p className="text-gray-400 text-sm">{course.instructor}</p>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1.5 text-gray-500">
                                            <BookOpen size={16} className="text-purple-500" />
                                            <span className="text-xs font-bold">{course.lessons} Lessons</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-gray-500 font-bold">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            <span className="text-xs">{course.assignments} Assignments</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-[32px] border border-dashed border-gray-200">
                        <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <BookOpen size={40} className="text-gray-300" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No Courses Found</h3>
                        <p className="text-gray-500 max-w-sm mx-auto">
                            {searchQuery ? `No courses match "${searchQuery}"` : "This cohort doesn't have any courses assigned yet."}
                        </p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

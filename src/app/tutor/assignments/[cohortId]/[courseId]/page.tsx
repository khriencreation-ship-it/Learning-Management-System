'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/tutor/DashboardLayout';
import { FileText, ChevronRight, Search, ArrowLeft, Calendar, Award } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Assignment {
    id: string;
    title: string;
    moduleTitle: string;
    summary: string;
    totalPoints: number;
    dueDate: string;
    createdAt: string;
}

export default function CourseAssignmentsPage({ params }: { params: Promise<{ cohortId: string, courseId: string }> }) {
    const { cohortId, courseId } = use(params);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();

    useEffect(() => {
        const fetchAssignments = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    router.push('/login');
                    return;
                }

                const response = await fetch(`/api/tutor/courses/${courseId}/assignments`, {
                    headers: { 'Authorization': `Bearer ${session.access_token}` }
                });

                if (response.ok) {
                    const data = await response.json();
                    setAssignments(data);
                }
            } catch (error) {
                console.error('Error fetching assignments:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAssignments();
    }, [courseId, router]);

    const filteredAssignments = assignments.filter(a =>
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.moduleTitle.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <button
                    onClick={() => router.push(`/tutor/assignments/${cohortId}`)}
                    className="flex items-center gap-2 text-gray-500 hover:text-purple-600 transition-colors mb-6 group"
                >
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="font-medium">Back to Courses</span>
                </button>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Assignments</h1>
                        <p className="text-gray-500 text-lg">Select an assignment to view and grade student submissions.</p>
                    </div>

                    <div className="relative max-w-md w-full">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Find assignment..."
                            className="block w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="space-y-4 animate-pulse">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white rounded-3xl h-24 border border-gray-100 shadow-sm" />
                        ))}
                    </div>
                ) : filteredAssignments.length > 0 ? (
                    <div className="space-y-4">
                        {filteredAssignments.map((assignment) => (
                            <div
                                key={assignment.id}
                                onClick={() => router.push(`/tutor/assignments/${cohortId}/${courseId}/${assignment.id}`)}
                                className="group bg-white rounded-3xl border border-gray-100 p-6 hover:shadow-lg hover:border-purple-200 transition-all cursor-pointer shadow-sm flex items-center justify-between"
                            >
                                <div className="flex items-center gap-6 flex-1 min-w-0">
                                    <div className="bg-purple-50 p-4 rounded-2xl text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                        <FileText size={28} />
                                    </div>

                                    <div className="min-w-0 pr-4">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="font-bold text-gray-900 text-lg truncate group-hover:text-purple-600 transition-colors">
                                                {assignment.title}
                                            </h3>
                                            <span className="px-2 py-0.5 rounded-lg bg-gray-50 text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                                                {assignment.moduleTitle}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-gray-400">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar size={14} className="text-gray-300" />
                                                <span>Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No deadline'}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Award size={14} className="text-gray-300" />
                                                <span className="font-bold text-gray-500">{assignment.totalPoints} Points</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <button className="bg-purple-50 text-purple-600 px-5 py-2.5 rounded-2xl font-bold text-sm hover:bg-purple-600 hover:text-white transition-all shadow-sm hover:shadow-purple-100">
                                        View Submissions
                                    </button>
                                    <ChevronRight size={20} className="text-gray-300 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-[32px] border border-dashed border-gray-200">
                        <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FileText size={40} className="text-gray-300" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No Assignments Found</h3>
                        <p className="text-gray-500 max-w-sm mx-auto">
                            {searchQuery ? `No assignments match "${searchQuery}"` : "This course doesn't have any assignments yet."}
                        </p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

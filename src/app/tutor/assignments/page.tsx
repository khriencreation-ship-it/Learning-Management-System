'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/tutor/DashboardLayout';
import { LayoutGrid, Users, BookOpen, ChevronRight, Search } from 'lucide-react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

interface Cohort {
    id: string;
    name: string;
    batch: string;
    image: string;
    status: string;
    studentsCount: number;
    coursesCount: number;
}

export default function AssignmentsPage() {
    const [cohorts, setCohorts] = useState<Cohort[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();

    useEffect(() => {
        const fetchCohorts = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    router.push('/login');
                    return;
                }

                const response = await fetch('/api/tutor/cohorts', {
                    headers: { 'Authorization': `Bearer ${session.access_token}` }
                });

                if (response.ok) {
                    const data = await response.json();
                    setCohorts(data);
                }
            } catch (error) {
                console.error('Error fetching cohorts:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCohorts();
    }, [router]);

    const filteredCohorts = cohorts.filter(cohort =>
        cohort.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cohort.batch.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Assignments Management</h1>
                        <p className="text-gray-500 text-lg">Select a cohort to view course assignments and grade submissions.</p>
                    </div>

                    <div className="relative max-w-md w-full">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Find a cohort..."
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
                ) : filteredCohorts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCohorts.map((cohort) => (
                            <div
                                key={cohort.id}
                                onClick={() => router.push(`/tutor/assignments/${cohort.id}`)}
                                className="group bg-white rounded-3xl border border-gray-100 p-6 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer shadow-sm overflow-hidden relative"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="bg-purple-50 p-2 rounded-xl text-purple-600">
                                        <ChevronRight size={20} />
                                    </div>
                                </div>

                                <div className="flex items-start gap-5">
                                    <div className="relative w-20 h-20 flex-shrink-0">
                                        <div className="absolute inset-0 bg-purple-100 rounded-2xl transform rotate-3 group-hover:rotate-6 transition-transform" />
                                        <div className="relative w-full h-full rounded-2xl overflow-hidden border-2 border-white shadow-sm">
                                            {cohort.image ? (
                                                <Image
                                                    src={cohort.image}
                                                    alt={cohort.name}
                                                    fill
                                                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                                                    <LayoutGrid size={32} className="text-white opacity-80" />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0 pr-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${cohort.status === 'Ongoing' ? 'bg-emerald-50 text-emerald-600' :
                                                cohort.status === 'Completed' ? 'bg-gray-100 text-gray-600' :
                                                    'bg-amber-50 text-amber-600'
                                                }`}>
                                                {cohort.status}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-gray-900 text-lg truncate mb-1 group-hover:text-purple-600 transition-colors">
                                            {cohort.name}
                                        </h3>
                                        <p className="text-gray-400 text-sm font-medium">{cohort.batch}</p>
                                    </div>
                                </div>

                                <div className="mt-8 pt-6 border-t border-gray-50 grid grid-cols-2 gap-4">
                                    <div className="flex items-center gap-2.5 text-gray-500 bg-gray-50 p-3 rounded-2xl group-hover:bg-purple-50/50 transition-colors">
                                        <Users size={18} className="text-purple-600" />
                                        <div className="flex flex-col">
                                            <span className="text-xs text-gray-400 font-medium">Students</span>
                                            <span className="text-sm font-bold text-gray-900">{cohort.studentsCount}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2.5 text-gray-500 bg-gray-50 p-3 rounded-2xl group-hover:bg-purple-50/50 transition-colors">
                                        <BookOpen size={18} className="text-purple-600" />
                                        <div className="flex flex-col">
                                            <span className="text-xs text-gray-400 font-medium">Courses</span>
                                            <span className="text-sm font-bold text-gray-900">{cohort.coursesCount}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-[32px] border border-dashed border-gray-200">
                        <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <LayoutGrid size={40} className="text-gray-300" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No Cohorts Found</h3>
                        <p className="text-gray-500 max-w-sm mx-auto">
                            {searchQuery ? `No cohorts match "${searchQuery}"` : "You haven't been assigned to any cohorts yet."}
                        </p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

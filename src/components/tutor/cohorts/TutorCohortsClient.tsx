'use client';

import { useState, useMemo, useEffect } from 'react';
import CohortCard from '@/components/admin/CohortCard';
import DashboardLayout from '@/components/tutor/DashboardLayout';
import { CopyPlus, Search, Filter, Layers, Zap, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getCohortStatus } from '@/lib/cohortUtils';

interface ICohort {
    id: string;
    name: string;
    batch: string;
    image?: string;
    description?: string;
    startDate: string;
    endDate: string;
    status: string;
    studentsCount: number;
    tutorsCount: number;
    coursesCount: number;
}

// Helper to format date
const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
    });
};

// Map DB status to UI status (Capitalized)
const mapStatus = (status: string): 'Active' | 'Upcoming' | 'Completed' => {
    switch ((status || '').toLowerCase()) {
        case 'active': return 'Active';
        case 'completed': return 'Completed';
        case 'upcoming': return 'Upcoming';
        default: return 'Upcoming';
    }
};

export default function TutorCohortsClient() {
    const [cohorts, setCohorts] = useState<ICohort[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'upcoming' | 'completed'>('all');

    useEffect(() => {
        const fetchCohorts = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) return;

                const res = await fetch('/api/tutor/cohorts', {
                    headers: { 'Authorization': `Bearer ${session.access_token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    // Process data to match ICohort interface
                    const processed = data.map((c: any) => ({
                        ...c,
                        startDate: formatDate(c.start_date || c.startDate),
                        endDate: formatDate(c.end_date || c.endDate),
                        status: getCohortStatus(c.start_date || c.startDate, c.end_date || c.endDate) // Dynamic status
                    }));
                    setCohorts(processed);
                }
            } catch (error) {
                console.error('Failed to fetch cohorts', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCohorts();

        // Refresh data when page becomes visible (e.g., navigating back)
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                fetchCohorts();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    // Calculate Metrics
    const metrics = useMemo(() => {
        const total = cohorts.length;
        const active = cohorts.filter(c => (c.status || '').toLowerCase() === 'active').length;
        const upcoming = cohorts.filter(c => (c.status || '').toLowerCase() === 'upcoming').length;
        const completed = cohorts.filter(c => (c.status || '').toLowerCase() === 'completed').length;
        return { total, active, upcoming, completed };
    }, [cohorts]);

    // Filter Cohorts
    const filteredCohorts = useMemo(() => {
        return cohorts.filter(cohort => {
            if (!cohort) return false;
            const matchesSearch =
                (cohort.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (cohort.batch || '').toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus = statusFilter === 'all' || (cohort.status || '').toLowerCase() === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [cohorts, searchQuery, statusFilter]);

    return (
        <DashboardLayout isLoading={loading}>
            <div className="space-y-10 max-w-6xl mx-auto">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-2">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">My Cohorts</h1>
                        <p className="text-gray-500 font-medium text-lg">View and manage your assigned cohorts.</p>
                    </div>
                </div>

                {/* Metric Counters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-5 group hover:shadow-md transition-all">
                        <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                            <Layers size={28} />
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Assigned Cohorts</p>
                            <h3 className="text-3xl font-bold text-gray-900">{metrics.total}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-5 group hover:shadow-md transition-all">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                            <Zap size={28} />
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Active</p>
                            <h3 className="text-3xl font-bold text-gray-900">{metrics.active}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-5 group hover:shadow-md transition-all">
                        <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                            <Clock size={28} />
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Upcoming</p>
                            <h3 className="text-3xl font-bold text-gray-900">{metrics.upcoming}</h3>
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
                                placeholder="Search assigned cohorts..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-100 focus:border-primary rounded-xl outline-none transition-colors shadow-sm"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value as any)}
                                    className="appearance-none flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all border bg-white text-gray-700 border-gray-100 hover:border-primary shadow-sm outline-none cursor-pointer pr-10"
                                >
                                    <option value="all">All Status</option>
                                    <option value="active">Active</option>
                                    <option value="upcoming">Upcoming</option>
                                    <option value="completed">Completed</option>
                                </select>
                                <Filter size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Cohorts Grid or Empty State */}
                {filteredCohorts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCohorts.map((cohort: ICohort) => (
                            <CohortCard
                                key={cohort.id}
                                id={cohort.id}
                                name={cohort.name}
                                batch={cohort.batch}
                                image={cohort.image}
                                description={cohort.description}
                                startDate={cohort.startDate}
                                endDate={cohort.endDate}
                                status={mapStatus(cohort.status)}
                                students={cohort.studentsCount}
                                courses={cohort.coursesCount}
                                tutors={cohort.tutorsCount}
                                linkPrefix="/tutor/cohorts"
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 border-dashed text-center">
                        <div className="w-20 h-20 rounded-full bg-purple-50 flex items-center justify-center text-purple-300 mb-6">
                            <CopyPlus size={40} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No Cohorts Found</h3>
                        <p className="text-gray-500 max-w-sm mb-8">
                            {cohorts.length === 0
                                ? "You are not assigned to any cohorts yet."
                                : "No cohorts match your current search constraints."
                            }
                        </p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

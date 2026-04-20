'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/student/DashboardLayout';
import StatCard from '@/components/admin/StatCard';
import RecentList from '@/components/admin/RecentList';
import StudentWelcome from '@/components/student/StudentWelcome';
import RecentBroadcasts from '@/components/common/RecentBroadcasts';
import NotificationDropdown from '@/components/common/NotificationDropdown';
import { LayoutGrid, BookOpen, X, Calendar, User as UserIcon, Layers } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { User } from '@/lib/authClient';
import ActivitiesAndChallenges from '@/components/student/ActivitiesAndChallenges';

export default function StudentDashboardClient({ user }: { user: User }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [selectedBroadcast, setSelectedBroadcast] = useState<any>(null);
    const [data, setData] = useState<{
        totalCohorts: number;
        totalCourses: number;
        recentCohorts: any[];
        recentCourses: any[];
        recentBroadcasts: any[];
    }>({
        totalCohorts: 0,
        totalCourses: 0,
        recentCohorts: [],
        recentCourses: [],
        recentBroadcasts: []
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) return;

                const res = await fetch('/api/student/dashboard', {
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`
                    }
                });

                if (!res.ok) throw new Error('Failed to fetch data');

                const { cohorts, courses, broadcasts } = await res.json();

                const sortedCohorts = (cohorts || []).sort((a: any, b: any) =>
                    new Date(b.created_at || b.start_date || 0).getTime() - new Date(a.created_at || a.start_date || 0).getTime()
                );

                const sortedCourses = (courses || []).sort((a: any, b: any) =>
                    new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
                );

                setData({
                    totalCohorts: cohorts?.length || 0,
                    totalCourses: courses?.length || 0,
                    recentCohorts: sortedCohorts.slice(0, 5),
                    recentCourses: sortedCourses.slice(0, 5),
                    recentBroadcasts: broadcasts || []
                });

            } catch (error) {
                console.error('Error fetching student dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const mapCohorts = (data: any[]) => data.map(item => ({
        id: item.id,
        primaryText: item.name,
        secondaryText: `Batch: ${item.batch}`
    }));

    const mapCourses = (data: any[]) => data.map(item => ({
        id: item.id,
        primaryText: item.title,
        secondaryText: item.code,
        locked: item.isLocked
    }));

    return (
        <DashboardLayout isLoading={loading}>
            <div className="max-w-6xl mx-auto">
                <div className="mb-8 flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
                        <div className="mt-1">
                            <StudentWelcome />
                        </div>
                    </div>

                    <NotificationDropdown />
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <StatCard
                        title="My Cohorts"
                        value={data.totalCohorts.toString()}
                        icon={LayoutGrid}
                        color="blue"
                    />
                    <StatCard
                        title="My Courses"
                        value={data.totalCourses.toString()}
                        icon={BookOpen}
                        color="purple"
                    />
                </div>

                {/* Activities & Challenges */}
                <ActivitiesAndChallenges 
                    userName={user.name || 'Student'} 
                    courseName={data.recentCourses[0]?.title || 'AI Foundations and Practical Intelligence'} 
                />

                {/* Recent Lists Grid & Broadcasts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-6">
                        <div className="h-[350px]">
                            <RecentList
                                title="Recent Cohorts"
                                type="cohort"
                                viewMoreLink="/student/cohorts"
                                items={mapCohorts(data.recentCohorts)}
                            />
                        </div>
                        <div className="h-[350px]">
                            <RecentList
                                title="Recent Courses"
                                type="course"
                                viewMoreLink="/student/courses"
                                items={mapCourses(data.recentCourses)}
                            />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="h-full min-h-[724px]">
                            <RecentBroadcasts 
                                broadcasts={data.recentBroadcasts} 
                                onViewAll={() => router.push('/student/broadcasts')}
                                onSelect={(b) => setSelectedBroadcast(b)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Broadcast Detail Modal */}
            {selectedBroadcast && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                    <div 
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={() => setSelectedBroadcast(null)}
                    />
                    <div className="relative bg-white rounded-[32px] w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-8 md:p-10">
                            <button
                                onClick={() => setSelectedBroadcast(null)}
                                className="absolute right-6 top-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                            >
                                <X size={24} />
                            </button>

                            <div className="space-y-6">
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                                        selectedBroadcast.sender_role === 'admin' 
                                            ? 'bg-red-50 text-red-600 border border-red-100' 
                                            : 'bg-blue-50 text-blue-600 border border-blue-100'
                                    }`}>
                                        {selectedBroadcast.sender_role} announcement
                                    </span>
                                    {selectedBroadcast.cohort_name && (
                                        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                                            <Layers size={14} />
                                            {selectedBroadcast.cohort_name}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h2 className="text-3xl font-black text-gray-900 mb-2">
                                        {selectedBroadcast.title}
                                    </h2>
                                    <div className="flex items-center gap-4 text-sm text-gray-500 font-medium">
                                        <span className="flex items-center gap-1.5">
                                            <Calendar size={16} />
                                            {selectedBroadcast.date || new Date(selectedBroadcast.created_at).toLocaleDateString('en-US', { 
                                                month: 'long', 
                                                day: 'numeric', 
                                                year: 'numeric' 
                                            })}
                                        </span>
                                        <span className="flex items-center gap-1.5 capitalize">
                                            <UserIcon size={16} />
                                            Sent by {selectedBroadcast.sender_role}
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-2xl p-6 md:p-8 min-h-[150px] max-h-[50vh] overflow-y-auto">
                                    <p className="text-gray-700 leading-relaxed text-lg whitespace-pre-wrap">
                                        {selectedBroadcast.message}
                                    </p>
                                </div>

                                <button
                                    onClick={() => setSelectedBroadcast(null)}
                                    className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:bg-purple-700 transition-all transform hover:-translate-y-0.5"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}

'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/tutor/DashboardLayout';
import StatCard from '@/components/admin/StatCard';
import RecentList from '@/components/admin/RecentList';
import TutorWelcome from '@/components/tutor/TutorWelcome';
import RecentBroadcasts from '@/components/common/RecentBroadcasts';
import NotificationDropdown from '@/components/common/NotificationDropdown';
import LoadingScreen from '@/components/common/LoadingScreen';
import { LayoutGrid, BookOpen } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function TutorDashboardClient() {
    const [loading, setLoading] = useState(true);
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
                // Get session for token
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) return;

                const res = await fetch('/api/tutor/dashboard', {
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`
                    }
                });

                if (!res.ok) throw new Error('Failed to fetch data');

                const { cohorts, courses, broadcasts } = await res.json();

                // Process Cohorts
                const sortedCohorts = (cohorts || []).sort((a: any, b: any) =>
                    new Date(b.created_at || b.start_date || 0).getTime() - new Date(a.created_at || a.start_date || 0).getTime()
                );

                // Process Courses
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
                console.error('Error fetching tutor dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Transform data for RecentList
    const mapCohorts = (data: any[]) => data.map(item => ({
        id: item.id,
        primaryText: item.name,
        secondaryText: `Batch: ${item.batch}`
    }));

    const mapCourses = (data: any[]) => data.map(item => ({
        id: item.id,
        primaryText: item.title,
        secondaryText: item.code
    }));

    return (
        <DashboardLayout isLoading={loading}>
            <div className="max-w-6xl mx-auto">
                <div className="mb-8 flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
                        <div className="mt-1">
                            <TutorWelcome />
                        </div>
                    </div>

                    <NotificationDropdown />
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <StatCard
                        title="Assigned Cohorts"
                        value={data.totalCohorts.toString()}
                        icon={LayoutGrid}
                        color="blue"
                    // Remove trend/description if simpler look needed or keep defaults
                    />
                    <StatCard
                        title="Assigned Courses"
                        value={data.totalCourses.toString()}
                        icon={BookOpen}
                        color="purple"
                    />
                </div>

                {/* Recent Lists Grid & Broadcasts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column for Lists */}
                    <div className="space-y-6">
                        <div className="h-[350px]">
                            <RecentList
                                title="Recent Assigned Cohorts"
                                type="cohort"
                                viewMoreLink="/tutor/cohorts"
                                // No action label for tutors
                                items={mapCohorts(data.recentCohorts)}
                            />
                        </div>
                        <div className="h-[350px]">
                            <RecentList
                                title="Recent Assigned Courses"
                                type="course"
                                viewMoreLink="/tutor/courses"
                                items={mapCourses(data.recentCourses)}
                            />
                        </div>
                    </div>

                    {/* Right Column for Broadcasts */}
                    <div className="space-y-6">
                        <div className="h-full max-h-[724px]">
                            <RecentBroadcasts broadcasts={data.recentBroadcasts} />
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

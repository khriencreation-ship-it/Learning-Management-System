import DashboardLayout from '@/components/admin/DashboardLayout';
import StatCard from '@/components/admin/StatCard';
import RecentList from '@/components/admin/RecentList';
import { LayoutGrid, BookOpen, Users, GraduationCap, Image as ImageIcon, Upload, Radio } from 'lucide-react';
import { supabaseAdmin } from '@/lib/supabase-admin';
import AdminWelcome from '@/components/admin/AdminWelcome';
import RecentBroadcasts from '@/components/common/RecentBroadcasts';
import Link from 'next/link';

// Revalidate data every 60 seconds (or 0 for always fresh)
export const revalidate = 0;

async function getDashboardData() {
    try {
        const [
            cohortsCount,
            coursesCount,
            studentsCount,
            tutorsCount,
            mediaCount,
            foldersCount,
            recentCohorts,
            recentCourses,
            recentStudents,
            recentTutors,
            recentBroadcasts
        ] = await Promise.all([
            // Counts
            supabaseAdmin.from('cohorts').select('*', { count: 'exact', head: true }),
            supabaseAdmin.from('courses').select('*', { count: 'exact', head: true }),
            supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
            supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'tutor'),

            // Media Counts
            supabaseAdmin.from('media_files').select('*', { count: 'exact', head: true }),
            supabaseAdmin.from('media_folders').select('*', { count: 'exact', head: true }),

            // Recent Items
            supabaseAdmin.from('cohorts').select('*').order('created_at', { ascending: false }).limit(5),
            supabaseAdmin.from('courses').select('*').order('created_at', { ascending: false }).limit(5),
            supabaseAdmin.from('profiles').select('*').eq('role', 'student').order('updated_at', { ascending: false }).limit(5),
            supabaseAdmin.from('profiles').select('*').eq('role', 'tutor').order('updated_at', { ascending: false }).limit(5),
            supabaseAdmin.from('announcements').select('*').order('created_at', { ascending: false }).limit(3),
        ]);

        // Process broadcasts
        const processedBroadcasts = (recentBroadcasts.data || []).map(item => ({
            ...item,
            sender_role: item.sender_id ? 'tutor' : 'admin',
            date: new Date(item.created_at).toLocaleDateString()
        }));

        return {
            totalCohorts: cohortsCount.count || 0,
            totalCourses: coursesCount.count || 0,
            totalStudents: studentsCount.count || 0,
            totalTutors: tutorsCount.count || 0,
            recentCohorts: recentCohorts.data || [],
            recentCourses: recentCourses.data || [],
            recentStudents: recentStudents.data || [],
            recentTutors: recentTutors.data || [],
            recentBroadcasts: processedBroadcasts,
            totalMedia: mediaCount.count || 0,
            totalFolders: foldersCount.count || 0,
        };
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        return {
            totalCohorts: 0,
            totalCourses: 0,
            totalStudents: 0,
            totalTutors: 0,
            recentCohorts: [],
            recentCourses: [],
            recentStudents: [],
            recentTutors: [],
            recentBroadcasts: [],
            totalMedia: 0,
            totalFolders: 0,
        };
    }
}

export default async function AdminDashboard() {
    const {
        totalCohorts,
        totalCourses,
        totalStudents,
        totalTutors,
        recentCohorts,
        recentCourses,
        recentStudents,
        recentTutors,
        recentBroadcasts,
        totalMedia,
        totalFolders
    } = await getDashboardData();

    // Transform data for RecentList
    const mapCohorts = (data: any[]) => data.map(item => ({
        id: item.id,
        primaryText: item.name || 'Untitled Cohort',
        secondaryText: `Batch: ${item.batch || 'N/A'}`
    }));

    const mapCourses = (data: any[]) => data.map(item => ({
        id: item.id,
        primaryText: item.title || 'Untitled Course',
        secondaryText: item.code || 'No Code'
    }));

    const mapProfiles = (data: any[]) => data.map(item => ({
        id: item.id,
        primaryText: item.full_name || 'Anonymous User',
        secondaryText: item.identifier || item.username || 'No ID'
    }));


    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
                    <AdminWelcome />
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="Total Cohorts"
                        value={totalCohorts.toString()}
                        icon={LayoutGrid}
                        color="blue"
                    />
                    <StatCard
                        title="Total Courses"
                        value={totalCourses.toString()}
                        icon={BookOpen}
                        color="purple"
                    />
                    <StatCard
                        title="Total Students"
                        value={totalStudents.toString()}
                        icon={Users}
                        color="green"
                    />
                    <StatCard
                        title="Total Tutors"
                        value={totalTutors.toString()}
                        icon={GraduationCap}
                        color="orange"
                    />
                </div>

                {/* Recent Lists Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column for Lists */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <RecentList
                                title="Recent Cohorts"
                                type="cohort"
                                viewMoreLink="/admin/cohorts"
                                actionLabel="Add New Cohort"
                                items={mapCohorts(recentCohorts)}
                            />
                            <RecentList
                                title="Recent Courses"
                                type="course"
                                viewMoreLink="/admin/courses"
                                actionLabel="Add New Course"
                                items={mapCourses(recentCourses)}
                            />
                            <RecentList
                                title="Recent Students"
                                type="student"
                                viewMoreLink="/admin/students"
                                actionLabel="Enrol Student"
                                items={mapProfiles(recentStudents)}
                            />
                            <RecentList
                                title="Recent Tutors"
                                type="tutor"
                                viewMoreLink="/admin/tutors"
                                actionLabel="Sign a Tutor"
                                items={mapProfiles(recentTutors)}
                            />
                        </div>
                    </div>

                    {/* Right Column for Actions & Broadcasts */}
                    <div className="space-y-6">
                        {/* Media Library Quick Actions */}
                        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden relative group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[5rem] -mr-8 -mt-8 group-hover:scale-110 transition-transform" />

                            <div className="relative">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2.5 bg-primary/10 rounded-2xl text-primary">
                                        <ImageIcon size={22} />
                                    </div>
                                    <h3 className="font-bold text-gray-900 text-lg">Media Library</h3>
                                </div>

                                <div className="space-y-3">
                                    <Link
                                        href="/admin/media-library"
                                        className="flex items-center justify-between p-4 bg-gray-50 hover:bg-primary hover:text-white rounded-2xl transition-all group/item shadow-sm"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white/10 rounded-lg group-hover/item:bg-white/20">
                                                <ImageIcon size={18} className="translate-y-[-1px]" />
                                            </div>
                                            <span className="font-bold text-sm">View Library</span>
                                        </div>
                                        <div className="w-8 h-8 rounded-full border border-current/20 flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-opacity">
                                            <LayoutGrid size={14} />
                                        </div>
                                    </Link>

                                    <Link
                                        href="/admin/media-library?action=upload"
                                        className="flex items-center justify-between p-4 bg-white border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50 text-gray-700 hover:text-emerald-700 rounded-2xl transition-all group/item shadow-sm"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-emerald-50 rounded-lg group-hover/item:bg-emerald-100">
                                                <Upload size={18} />
                                            </div>
                                            <span className="font-bold text-sm">Upload File</span>
                                        </div>
                                        <div className="w-8 h-8 rounded-full border border-emerald-200 flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-opacity">
                                            <Upload size={14} />
                                        </div>
                                    </Link>
                                </div>

                                <div className="mt-6 pt-6 border-t border-gray-50 flex items-center justify-between px-2">
                                    <div className="text-center">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Media</p>
                                        <p className="text-sm font-bold text-gray-900">{totalMedia} Files</p>
                                    </div>
                                    <div className="h-8 w-[1px] bg-gray-100" />
                                    <div className="text-center">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Active Folders</p>
                                        <p className="text-sm font-bold text-gray-900">{totalFolders} Folders</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Broadcasts */}
                        <div>
                            <RecentBroadcasts broadcasts={recentBroadcasts} />
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

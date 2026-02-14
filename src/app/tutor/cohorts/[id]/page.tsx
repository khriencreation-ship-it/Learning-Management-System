import { notFound } from 'next/navigation';
import DashboardLayout from '@/components/tutor/DashboardLayout';
import { ArrowLeft, Calendar, LayoutGrid, Users, BookOpen, GraduationCap } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getCohortStatus } from '@/lib/cohortUtils';
import TutorCohortTabs from '@/components/tutor/cohorts/TutorCohortTabs';

async function getCohort(id: string) {
    try {
        // Fetch Cohort Details
        const { data: cohort, error } = await supabaseAdmin
            .from('cohorts')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !cohort) return null;

        // Fetch Counts ONLY (No list data)
        const { count: studentsCount } = await supabaseAdmin
            .from('cohort_students')
            .select('*', { count: 'exact', head: true })
            .eq('cohort_id', id);

        const { count: tutorsCount } = await supabaseAdmin
            .from('cohort_tutors')
            .select('*', { count: 'exact', head: true })
            .eq('cohort_id', id);

        // Fetch Courses (Needed for list)
        const { data: courseData, count: coursesCount } = await supabaseAdmin
            .from('course_cohorts')
            .select('courses(*), settings', { count: 'exact' })
            .eq('cohort_id', id);

        const courses = courseData?.map((item: any) => ({
            ...item.courses,
            tutor: item.courses.instructor,
            settings: item.settings // Pass the settings to the frontend
        })) || [];

        // Combine and cleanup
        const formattedCohort = {
            ...cohort,
            startDate: cohort.start_date,
            endDate: cohort.end_date,
            studentsCount: studentsCount || 0,
            tutorsCount: tutorsCount || 0,
            coursesCount: coursesCount || 0,
            courses, // Pass the fetched courses
            _id: cohort.id // Keep _id for compatibility if used in UI for display
        };

        return formattedCohort;
    } catch (error) {
        console.error('Error fetching cohort:', error);
        return null;
    }
}

// Helper to format date
const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
    });
};

export default async function TutorCohortDetailsPage(props: any) {
    const params = await props.params;
    const { id } = params;
    const cohort = await getCohort(id);

    if (!cohort) {
        notFound();
    }

    // Determine status styling
    const status = getCohortStatus(cohort.startDate, cohort.endDate);
    const statusConfig: any = {
        active: 'bg-emerald-100 text-emerald-700',
        upcoming: 'bg-blue-100 text-blue-700',
        completed: 'bg-gray-100 text-gray-700',
    };

    return (
        <DashboardLayout>
            {/* Back Button - Outside Hero */}
            <div className="max-w-6xl mx-auto mb-6">
                <Link
                    href="/tutor/cohorts"
                    className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft size={18} />
                    Back to My Cohorts
                </Link>
            </div>

            {/* Hero Section */}
            <div className="relative w-full bg-slate-900 text-white overflow-hidden mb-8 rounded-3xl mx-auto max-w-6xl shadow-2xl">
                {/* Background Image with Overlay */}
                <div className="absolute inset-0 z-0 select-none pointer-events-none">
                    {cohort.image && (
                        <Image
                            src={cohort.image}
                            alt="Background"
                            fill
                            className="object-cover opacity-40 blur-sm"
                        />
                    )}
                    {!cohort.image && (
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-slate-900 to-black opacity-50" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-purple-900/80 to-slate-900/90 mix-blend-multiply" />
                    <div className="absolute inset-0 bg-black/40" />
                </div>

                {/* Content */}
                <div className="relative z-10 px-8 py-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                        {/* Left: Text & Details */}
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${status === 'active'
                                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                        : status === 'upcoming'
                                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                            : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                                        }`}>
                                        {status}
                                    </span>
                                    <div className="flex items-center gap-2 text-purple-200 text-xs font-bold uppercase tracking-wider">
                                        <LayoutGrid size={14} />
                                        <span>Batch: {cohort.batch}</span>
                                    </div>
                                </div>

                                <h1 className="text-3xl lg:text-4xl font-bold text-white leading-tight">
                                    {cohort.name}
                                </h1>

                                <div className="flex items-center gap-2 text-sm text-gray-400 font-medium">
                                    <Calendar size={16} />
                                    <span>{formatDate(cohort.startDate)} - {formatDate(cohort.endDate)}</span>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-3 gap-3 p-3 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 max-w-md">
                                <div className="text-center p-2">
                                    <div className="flex items-center justify-center gap-1.5 text-gray-400 mb-1">
                                        <Users size={14} />
                                        <span className="text-[10px] uppercase tracking-wide font-bold">Students</span>
                                    </div>
                                    <p className="text-lg font-bold text-white">{cohort.studentsCount}</p>
                                </div>
                                <div className="text-center p-2 border-l border-white/10">
                                    <div className="flex items-center justify-center gap-1.5 text-gray-400 mb-1">
                                        <BookOpen size={14} />
                                        <span className="text-[10px] uppercase tracking-wide font-bold">Courses</span>
                                    </div>
                                    <p className="text-lg font-bold text-white">{cohort.coursesCount}</p>
                                </div>
                                <div className="text-center p-2 border-l border-white/10">
                                    <div className="flex items-center justify-center gap-1.5 text-gray-400 mb-1">
                                        <GraduationCap size={14} />
                                        <span className="text-[10px] uppercase tracking-wide font-bold">Tutors</span>
                                    </div>
                                    <p className="text-lg font-bold text-white">{cohort.tutorsCount}</p>
                                </div>
                            </div>

                            {/* NO Edit/Delete Buttons here for Tutors */}
                        </div>

                        {/* Right: Image Card */}
                        <div className="flex flex-col items-start lg:items-end gap-6">
                            <div className="relative aspect-video w-full max-w-md bg-slate-800 rounded-2xl overflow-hidden shadow-2xl border border-white/10 group">
                                {cohort.image ? (
                                    <Image
                                        src={cohort.image}
                                        alt={cohort.name}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-white/5 to-white/10">
                                        <LayoutGrid size={48} className="text-white/20" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto mt-20 relative z-20 px-6">
                {/* Tabs & Content */}
                <TutorCohortTabs
                    cohortId={cohort.id}
                    cohortName={cohort.name}
                    description={cohort.description}
                    courses={cohort.courses || []}
                />
            </div>
        </DashboardLayout>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, LayoutGrid, Users, BookOpen, GraduationCap } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { getCohortStatus } from '@/lib/cohortUtils';
import StudentCohortTabs from '@/components/student/cohorts/StudentCohortTabs';
import DashboardLayout from '@/components/student/DashboardLayout';
import { notFound } from 'next/navigation';

interface StudentCohortDetailsClientProps {
    id: string;
}

const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
    });
};

export default function StudentCohortDetailsClient({ id }: StudentCohortDetailsClientProps) {
    const [cohort, setCohort] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCohort = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) return;

                const res = await fetch(`/api/student/cohorts/${id}`, {
                    headers: { 'Authorization': `Bearer ${session.access_token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    setCohort(data);
                } else {
                    if (res.status === 404 || res.status === 403) {
                        setError('not_found');
                    } else {
                        setError('failed');
                    }
                }
            } catch (err) {
                console.error('Failed to fetch cohort', err);
                setError('failed');
            } finally {
                setLoading(false);
            }
        };

        fetchCohort();
    }, [id]);

    if (loading) return <DashboardLayout isLoading={true} children={<></>} />;
    if (error === 'not_found') return notFound();
    if (error === 'failed') return <DashboardLayout><div className="text-center py-20 text-gray-500 font-medium">Failed to load cohort details. Please try again later.</div></DashboardLayout>;
    if (!cohort) return null;

    const status = getCohortStatus(cohort.startDate, cohort.endDate);

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto mb-6">
                <Link
                    href="/student/cohorts"
                    className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft size={18} />
                    Back to My Cohorts
                </Link>
            </div>

            <div className="relative w-full bg-slate-900 text-white overflow-hidden mb-8 rounded-3xl mx-auto max-w-6xl shadow-2xl">
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

                <div className="relative z-10 px-8 py-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
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
                        </div>

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
                <StudentCohortTabs
                    cohortId={cohort.id}
                    cohortName={cohort.name}
                    description={cohort.description}
                    courses={cohort.courses || []}
                />
            </div>
        </DashboardLayout>
    );
}

'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/student/DashboardLayout';
import { ArrowLeft, Play, BookOpen, FileText, CheckSquare, List, Clock, Globe, Video, Layers, Bell, MessageSquare, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/ui/Toast';
import Link from 'next/link';
import Image from 'next/image';
import CurriculumModule from '@/components/admin/courses/CurriculumModule';
import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';

interface StudentCourseDetailsClientProps {
    id: string;
    cohortId?: string | null;
}

export default function StudentCourseDetailsClient({ id, cohortId: initialCohortId }: StudentCourseDetailsClientProps) {
    const router = useRouter();
    const [course, setCourse] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [isAnnounceModalOpen, setIsAnnounceModalOpen] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null);
    const { toasts, removeToast } = useToast();

    // Cohort context
    const [cohortId, setCohortId] = useState<string | null>(initialCohortId || null);

    useEffect(() => {
        if (!cohortId && typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const cid = params.get('cohortId');
            if (cid) setCohortId(cid);
        }
    }, [cohortId]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) return;

                const [courseRes, annRes] = await Promise.all([
                    fetch(`/api/student/courses/${id}`, {
                        headers: { 'Authorization': `Bearer ${session.access_token}` }
                    }),
                    fetch(`/api/admin/courses/${id}/announcements`)
                ]);

                if (courseRes.ok) {
                    const courseData = await courseRes.json();
                    setCourse(courseData);
                } else {
                    if (courseRes.status === 404 || courseRes.status === 403) {
                        setError('not_found');
                    } else {
                        setError('failed');
                    }
                }

                if (annRes.ok) {
                    const annData = await annRes.json();
                    setAnnouncements(annData);
                }
            } catch (err) {
                console.error('Failed to fetch course details', err);
                setError('failed');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    if (loading) return <DashboardLayout isLoading={true} children={<></>} />;
    if (error === 'not_found') return notFound();
    if (error === 'failed') return <DashboardLayout><div className="text-center py-20 text-gray-500 font-medium">Failed to load course details. Please try again later.</div></DashboardLayout>;
    if (!course) return null;

    return (
        <DashboardLayout>
            {toasts.map((toast) => (
                <Toast
                    key={toast.id}
                    message={toast.message}
                    type={toast.type}
                    onClose={() => removeToast(toast.id)}
                />
            ))}
            <div className="relative min-h-screen pb-20">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <Link
                        href="/student/courses"
                        className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft size={18} />
                        Back to Courses
                    </Link>
                </div>

                {/* Hero Section */}
                <div className="relative w-full bg-slate-900 text-white overflow-hidden rounded-3xl max-w-7xl mx-auto shadow-2xl">
                    <div className="absolute inset-0 z-0 select-none pointer-events-none">
                        {course.image && (
                            <Image
                                src={course.image}
                                alt="Background"
                                fill
                                className="object-cover opacity-40 blur-sm"
                            />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-purple-900/80 to-slate-900/90 mix-blend-multiply" />
                        <div className="absolute inset-0 bg-black/40" />
                    </div>

                    <div className="relative z-10 px-8 py-12 lg:py-16">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            <div
                                className="w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 relative group cursor-pointer"
                                onClick={() => course.video_url && setIsPlaying(true)}
                            >
                                {isPlaying && course.video_url ? (
                                    <video
                                        src={course.video_url}
                                        controls
                                        autoPlay
                                        className="w-full h-full object-cover"
                                        onEnded={() => setIsPlaying(false)}
                                    />
                                ) : (
                                    <>
                                        {course.image && (
                                            <Image
                                                src={course.image}
                                                alt={course.title}
                                                fill
                                                className="object-cover opacity-60 group-hover:opacity-40 transition-opacity"
                                            />
                                        )}
                                        <div className="absolute inset-0 flex items-center justify-center bg-slate-800/10 group-hover:bg-slate-800/20 transition-colors">
                                            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center pl-1 group-hover:scale-110 transition-transform duration-300">
                                                <Play size={32} className="text-white fill-white" />
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                            Enrolled
                                        </span>
                                        {course.cohortNames && course.cohortNames.length > 0 && course.cohortNames.map((name: string, idx: number) => (
                                            <span key={idx} className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                                {name}
                                            </span>
                                        ))}
                                        <span className="text-gray-400 text-sm font-medium tracking-wide">
                                            {course.code || 'NO-CODE'}
                                        </span>
                                    </div>

                                    <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
                                        {course.title}
                                    </h1>

                                    <div className="flex items-center gap-2 text-sm text-purple-200 font-medium">
                                        <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-xs font-bold">
                                            {(course.instructor || 'I').charAt(0)}
                                        </div>
                                        <span>Instructor: {course.instructor || 'Unassigned'}</span>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <Link
                                        href={`/student/courses/${course.id}/classroom${cohortId ? `?cohortId=${cohortId}` : ''}`}
                                        className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary rounded-2xl font-bold hover:bg-purple-50 transition-all shadow-xl group"
                                    >
                                        <Play size={20} className="fill-current" />
                                        Enter Classroom
                                    </Link>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-4 p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
                                    <div className="text-center p-2">
                                        <div className="flex items-center justify-center gap-2 text-gray-400 mb-1 font-semibold uppercase tracking-wide text-[10px]">
                                            <List size={14} /> Topics
                                        </div>
                                        <p className="text-lg font-bold text-white">{course.topics}</p>
                                    </div>
                                    <div className="text-center p-2 border-l border-white/10">
                                        <div className="flex items-center justify-center gap-2 text-gray-400 mb-1 font-semibold uppercase tracking-wide text-[10px]">
                                            <BookOpen size={14} /> Lessons
                                        </div>
                                        <p className="text-lg font-bold text-white">{course.lessons}</p>
                                    </div>
                                    <div className="text-center p-2 border-l border-white/10">
                                        <div className="flex items-center justify-center gap-2 text-gray-400 mb-1 font-semibold uppercase tracking-wide text-[10px]">
                                            <CheckSquare size={14} /> Quizzes
                                        </div>
                                        <p className="text-lg font-bold text-white">{course.quizzes}</p>
                                    </div>
                                    <div className="text-center p-2 border-l border-white/10">
                                        <div className="flex items-center justify-center gap-2 text-gray-400 mb-1 font-semibold uppercase tracking-wide text-[10px]">
                                            <FileText size={14} /> Assign.
                                        </div>
                                        <p className="text-lg font-bold text-white">{course.assignments}</p>
                                    </div>
                                    <div className="text-center p-2 border-l border-white/10">
                                        <div className="flex items-center justify-center gap-2 text-gray-400 mb-1 font-semibold uppercase tracking-wide text-[10px]">
                                            <Video size={14} className="text-blue-400" /> Live
                                        </div>
                                        <p className="text-lg font-bold text-white">{course.liveClasses}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <FileText className="text-purple-600" size={20} /> About Course
                                </h3>
                                <div className="prose prose-sm prose-purple text-gray-600 max-w-none leading-relaxed" dangerouslySetInnerHTML={{ __html: course.description }} />
                            </div>

                            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Globe className="text-purple-600" size={20} /> Instructor
                                </h3>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold">
                                        {(course.instructor || 'I').charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">{course.instructor || 'Unassigned'}</p>
                                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Expert Mentor</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-3">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                <BookOpen className="text-primary" size={24} /> Course Curriculum
                            </h2>
                            <div className="space-y-4">
                                {course.curriculum?.map((module: any, index: number) => (
                                    <CurriculumModule key={module.id} module={module} index={index + 1} courseId={course.id} />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="pt-12 border-t border-gray-100">
                        <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                            <Bell className="text-blue-600" size={24} /> Course Announcements
                        </h3>
                        {announcements.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {announcements.map((ann) => (
                                    <div
                                        key={ann.id}
                                        onClick={() => {
                                            setSelectedAnnouncement(ann);
                                            setIsAnnounceModalOpen(true);
                                        }}
                                        className="group bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden"
                                    >
                                        <div className="relative space-y-4">
                                            <div className="flex justify-between">
                                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                                    <MessageSquare size={20} />
                                                </div>
                                                <span className="text-[10px] font-bold text-gray-400">{new Date(ann.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">{ann.title}</h4>
                                                <p className="text-sm text-gray-500 line-clamp-2 mt-1">{ann.message}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-gray-50 rounded-3xl p-12 text-center border-2 border-dashed border-gray-200 text-gray-500">
                                No announcements for this course yet.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {isAnnounceModalOpen && selectedAnnouncement && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsAnnounceModalOpen(false)} />
                    <div className="relative bg-white rounded-[2.5rem] w-full max-w-lg p-10 animate-in fade-in zoom-in duration-300">
                        <div className="flex items-center justify-between mb-8 text-gray-400">
                            <Bell size={24} className="text-blue-600" />
                            <button onClick={() => setIsAnnounceModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl"><Plus className="rotate-45" size={24} /></button>
                        </div>
                        <div className="space-y-6">
                            <h2 className="text-3xl font-extrabold text-gray-900 leading-tight">{selectedAnnouncement.title}</h2>
                            <div className="bg-gray-50/50 rounded-3xl p-6 border border-gray-100">
                                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap font-medium">{selectedAnnouncement.message}</p>
                            </div>
                            <button onClick={() => setIsAnnounceModalOpen(false)} className="w-full py-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-black transition-all">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}

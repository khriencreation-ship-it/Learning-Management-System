'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/tutor/DashboardLayout';
import { ArrowLeft, Play, BookOpen, FileText, CheckSquare, List, Clock, Users, Globe, Video, Layers, Bell, MessageSquare, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/ui/Toast';
import Link from 'next/link';
import Image from 'next/image';
import CurriculumModule from '@/components/admin/courses/CurriculumModule';

interface TutorCourseDetailsClientProps {
    course: any;
}

export default function TutorCourseDetailsClient({ course: initialCourse }: TutorCourseDetailsClientProps) {
    const router = useRouter();
    const [course, setCourse] = useState(initialCourse);
    const [isPlaying, setIsPlaying] = useState(false);

    // Tutors and Announcements State
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [isAnnounceModalOpen, setIsAnnounceModalOpen] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null);
    const { toasts, removeToast } = useToast();

    // Fetch Announcements
    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            const res = await fetch(`/api/admin/courses/${course.id}/announcements`);
            if (res.ok) {
                const data = await res.json();
                setAnnouncements(data);
            }
        } catch (err) {
            console.error('Failed to fetch announcements', err);
        }
    };

    return (
        <DashboardLayout>
            {/* Toast notifications */}
            {toasts.map((toast) => (
                <Toast
                    key={toast.id}
                    message={toast.message}
                    type={toast.type}
                    onClose={() => removeToast(toast.id)}
                />
            ))}
            <div className="relative min-h-screen pb-20">
                {/* Back Button */}
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <Link
                        href="/tutor/courses"
                        className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft size={18} />
                        Back to Courses
                    </Link>
                </div>

                {/* Hero Section */}
                <div className="relative w-full bg-slate-900 text-white overflow-hidden">
                    {/* Background Image with Overlay */}
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

                    {/* Content */}
                    <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 lg:py-16">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                            {/* Left: Course Intro Video */}
                            <div
                                className="w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 relative group cursor-pointer"
                                onClick={() => {
                                    if (course.video_url) {
                                        setIsPlaying(true);
                                    } else {
                                        // No action or maybe a toast
                                    }
                                }}
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
                                        {/* Play Overlay */}
                                        <div className="absolute inset-0 flex items-center justify-center bg-slate-800/10 group-hover:bg-slate-800/20 transition-colors">
                                            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center pl-1 group-hover:scale-110 transition-transform duration-300">
                                                <Play size={32} className="text-white fill-white" />
                                            </div>
                                        </div>
                                        <div className="absolute bottom-4 left-4">
                                            <span className="bg-black/60 backdrop-blur px-3 py-1 rounded-full text-xs font-medium border border-white/10">
                                                Course Intro
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Right: Course Details */}
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${course.status === 'published' || course.status === 'active'
                                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                            : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                                            }`}>
                                            {course.status === 'published' || course.status === 'active' ? 'Live & Published' : 'Draft Mode'}
                                        </span>
                                        <span className="text-gray-400 text-sm font-medium tracking-wide">
                                            {course.code || 'NO-CODE'}
                                        </span>
                                    </div>

                                    <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
                                        {course.title}
                                    </h1>

                                    <div className="flex items-center gap-2 text-sm text-purple-200 font-medium">
                                        <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                                            <span className="text-xs">IN</span>
                                        </div>
                                        <span>Instructor: {course.instructor || 'Unassigned'}</span>
                                        {course.publishedAt && (
                                            <span className="ml-4 opacity-60">
                                                • Published on {course.publishedAt}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <Link
                                        href={`/tutor/courses/${course.id}/classroom`}
                                        className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary rounded-2xl font-bold hover:bg-purple-50 transition-all shadow-xl shadow-purple-900/20 group"
                                    >
                                        <Play size={20} className="fill-current" />
                                        View Classroom
                                    </Link>
                                </div>


                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-4 p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
                                    <div className="text-center p-2">
                                        <div className="flex items-center justify-center gap-2 text-gray-400 mb-1">
                                            <List size={14} className="sm:w-4 sm:h-4" />
                                            <span className="text-[10px] sm:text-xs uppercase tracking-wide font-semibold truncate">Topics</span>
                                        </div>
                                        <p className="text-lg sm:text-xl font-bold text-white">{course.topics || 0}</p>
                                    </div>
                                    <div className="text-center p-2 border-l border-white/5 sm:border-white/10">
                                        <div className="flex items-center justify-center gap-2 text-gray-400 mb-1">
                                            <BookOpen size={14} className="sm:w-4 sm:h-4" />
                                            <span className="text-[10px] sm:text-xs uppercase tracking-wide font-semibold truncate">Lessons</span>
                                        </div>
                                        <p className="text-lg sm:text-xl font-bold text-white">{course.lessons || 0}</p>
                                    </div>
                                    <div className="text-center p-2 border-t sm:border-t-0 sm:border-l border-white/5 sm:border-white/10 col-span-1">
                                        <div className="flex items-center justify-center gap-2 text-gray-400 mb-1">
                                            <CheckSquare size={14} className="sm:w-4 sm:h-4" />
                                            <span className="text-[10px] sm:text-xs uppercase tracking-wide font-semibold truncate">Quizzes</span>
                                        </div>
                                        <p className="text-lg sm:text-xl font-bold text-white">{course.quizzes || 0}</p>
                                    </div>
                                    <div className="text-center p-2 border-t border-l sm:border-t-0 border-white/5 sm:border-white/10">
                                        <div className="flex items-center justify-center gap-2 text-gray-400 mb-1">
                                            <FileText size={14} className="sm:w-4 sm:h-4" />
                                            <span className="text-[10px] sm:text-xs uppercase tracking-wide font-semibold truncate">Assign.</span>
                                        </div>
                                        <p className="text-lg sm:text-xl font-bold text-white">{course.assignments || 0}</p>
                                    </div>
                                    <div className="text-center p-2 border-t sm:border-t-0 sm:border-l border-white/5 sm:border-white/10 col-span-2 sm:col-span-1">
                                        <div className="flex items-center justify-center gap-2 text-gray-400 mb-1">
                                            <Video size={14} className="sm:w-4 sm:h-4 text-blue-400" />
                                            <span className="text-[10px] sm:text-xs uppercase tracking-wide font-semibold truncate">Live</span>
                                        </div>
                                        <p className="text-lg sm:text-xl font-bold text-white">{course.liveClasses || 0}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
                    {/* TOP SECTION: About & Curriculum */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">

                        {/* LEFT COLUMN: About & Instructor */}
                        <div className="lg:col-span-2 space-y-6 h-fit">
                            {/* About Section */}
                            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                                <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <FileText className="text-purple-600" size={18} />
                                    About This Course
                                </h3>
                                <div className="max-w-none">
                                    {course.description ? (
                                        <div
                                            className="prose prose-sm prose-purple text-gray-600 text-[13px] text-left leading-relaxed max-w-none"
                                            dangerouslySetInnerHTML={{ __html: course.description }}
                                        />
                                    ) : (
                                        <p className="text-[13px] text-left leading-relaxed text-gray-600">No description provided for this course yet.</p>
                                    )}
                                </div>
                            </div>

                            {/* Instructor Section */}
                            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                                <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <Globe className="text-purple-600" size={18} />
                                    Instructor
                                </h3>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-sm">
                                        {(course.instructor || 'I').charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{course.instructor || 'Unassigned'}</p>
                                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Course Author</p>
                                    </div>
                                </div>
                            </div>

                            {/* Assigned Cohorts Section */}
                            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                                <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Layers className="text-blue-600" size={18} />
                                    Assigned Cohorts
                                </h3>
                                <div className="max-h-[420px] overflow-y-auto pr-2 custom-scrollbar space-y-3">
                                    {course.course_cohorts && course.course_cohorts.length > 0 ? (
                                        course.course_cohorts.map((cc: any) => {
                                            const status = cc.cohort?.status || 'Active';
                                            const statusColors = {
                                                active: 'bg-emerald-100 text-emerald-700',
                                                upcoming: 'bg-blue-100 text-blue-700',
                                                completed: 'bg-gray-100 text-gray-600'
                                            };
                                            const colorClass = statusColors[status.toLowerCase() as keyof typeof statusColors] || statusColors.upcoming;

                                            return (
                                                <div key={cc.cohort_id} className="group bg-white rounded-2xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all w-full">
                                                    <div className="flex items-center justify-between gap-4">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
                                                                {cc.cohort?.name?.charAt(0) || 'C'}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="font-bold text-gray-900 truncate">{cc.cohort?.name || "Unnamed Cohort"}</p>
                                                                <p className="text-xs text-gray-400 truncate mt-0.5">{cc.cohort?.batch || 'No Batch'}</p>
                                                            </div>
                                                        </div>
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ${colorClass}`}>
                                                            {status}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="bg-gray-50 rounded-2xl p-8 text-center border border-dashed border-gray-200">
                                            <Layers className="mx-auto text-gray-300 mb-2" size={32} />
                                            <p className="text-sm text-gray-500">No cohorts assigned to this course.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Curriculum */}
                        <div className="lg:col-span-3">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Curriculum Content</h2>
                                    <p className="text-gray-500 mt-1 text-sm">
                                        {course.curriculum?.length || 0} Modules • {course.lessons || 0} Lessons
                                    </p>
                                </div>
                                {/* No Edit Content Button for Tutor */}
                            </div>

                            <div className="space-y-2">
                                {course.curriculum && course.curriculum.length > 0 ? (
                                    course.curriculum.map((module: any, index: number) => (
                                        <CurriculumModule key={module.id || index} module={module} index={index + 1} courseId={course.id} isTutor={true} />
                                    ))

                                ) : (
                                    <div className="bg-white rounded-3xl p-12 border border-gray-100 text-center shadow-sm">
                                        <BookOpen size={48} className="mx-auto mb-4 text-gray-300" />
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">No Content Yet</h3>
                                        <p className="text-gray-500 mb-6">
                                            The curriculum for this course has not been created yet.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* BOTTOM SECTION: Enrolled Students */}
                    <div className="pt-12 border-t border-gray-100">
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                    <Users className="text-emerald-600" size={24} />
                                    Enrolled Students
                                </h3>
                                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-100">
                                    {course.course_enrollments?.length || 0} Total
                                </span>
                            </div>

                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-200">
                                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Student</th>
                                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Identifier / ID</th>
                                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {course.course_enrollments && course.course_enrollments.length > 0 ? (
                                                course.course_enrollments.map((ce: any) => (
                                                    <tr
                                                        key={ce.student_id}
                                                        // onClick={() => router.push(`/admin/students/${ce.student?.id || ce.student_id}`)} // Disable link for now or route to tutor student view later
                                                        className="hover:bg-gray-50/50 transition-colors group cursor-default"
                                                    >
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                                                    {ce.student?.full_name?.charAt(0) || 'S'}
                                                                </div>
                                                                <span className="font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors">
                                                                    {ce.student?.full_name || "Unknown"}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-500 font-medium break-all">
                                                            {ce.student?.identifier || ce.student_id}
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-bold uppercase tracking-tight">Enrolled</span>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={3} className="px-6 py-12 text-center text-gray-400 italic bg-gray-50/30">
                                                        No students enrolled in this course yet.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Announcements Section */}
                    <div className="pt-12 border-t border-gray-100">
                        <div className="space-y-8">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                        <Bell className="text-blue-600" size={24} />
                                        Course Announcements
                                    </h3>
                                    <p className="text-gray-500 text-sm mt-1">Broadcast messages to all students taking this course.</p>
                                </div>
                            </div>

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
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/50 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform" />

                                            <div className="relative space-y-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                                        <MessageSquare size={20} />
                                                    </div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest border ${ann.sender_role === 'admin'
                                                            ? 'bg-red-50 text-red-600 border-red-100'
                                                            : 'bg-primary/5 text-primary border-primary/10'
                                                            }`}>
                                                            {ann.sender_role === 'admin' ? 'Admin' : 'Tutor'}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-gray-400">
                                                            {new Date(ann.created_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div>
                                                    <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">{ann.title}</h4>
                                                    <p className="text-sm text-gray-500 line-clamp-2 mt-1">{ann.message}</p>
                                                </div>

                                                <div className="pt-2 flex items-center text-xs font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    Read Full Message →
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-gray-50 rounded-3xl p-16 text-center border-2 border-dashed border-gray-200">
                                    <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                                        <Bell className="text-gray-300" size={40} />
                                    </div>
                                    <h4 className="text-xl font-bold text-gray-900 mb-2">No Announcements Yet</h4>
                                    <p className="text-gray-500 max-w-sm mx-auto text-sm">
                                        Important updates and broadcast messages will appear here.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Announcement Modal (Read Only) */}
            {
                isAnnounceModalOpen && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <div
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                            onClick={() => setIsAnnounceModalOpen(false)}
                        />

                        <div className="relative bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
                            <div className="p-10">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
                                        <Bell size={24} />
                                    </div>
                                    <button
                                        onClick={() => setIsAnnounceModalOpen(false)}
                                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400"
                                    >
                                        <Plus className="rotate-45" size={24} />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest border ${selectedAnnouncement?.sender_role === 'admin'
                                                ? 'bg-red-50 text-red-600 border-red-100'
                                                : 'bg-primary/5 text-primary border-primary/10'
                                                }`}>
                                                {selectedAnnouncement?.sender_role === 'admin' ? 'Admin' : 'Tutor'}
                                            </span>
                                            <span className="text-xs text-gray-400 font-medium">{new Date(selectedAnnouncement?.created_at).toLocaleString()}</span>
                                        </div>
                                        <h2 className="text-3xl font-extrabold text-gray-900 leading-tight">
                                            {selectedAnnouncement?.title}
                                        </h2>
                                    </div>

                                    <div className="bg-gray-50/50 rounded-3xl p-6 border border-gray-100">
                                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap font-medium">
                                            {selectedAnnouncement?.message}
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => setIsAnnounceModalOpen(false)}
                                        className="w-full py-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-black transition-all shadow-lg"
                                    >
                                        Close Message
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </DashboardLayout >
    );
}


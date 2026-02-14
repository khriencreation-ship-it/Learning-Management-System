"use client";

import { useState } from 'react';
import Link from 'next/link';
import {
    Mail, Phone, User, CheckCircle2, XCircle, AlertCircle,
    ArrowLeft, Calendar, BookOpen, Layers, Clock, TrendingUp,
    ChevronRight, CheckCircle, Circle, Eye, EyeOff, Lock, RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/ui/Toast';

interface CurriculumItem {
    id: string;
    title: string;
    type: 'lesson' | 'quiz' | 'assignment' | 'live-class';
    isCompleted: boolean;
}

interface CurriculumModule {
    id: string;
    title: string;
    summary?: string;
    items: CurriculumItem[];
}

interface Course {
    id: string;
    title: string;
    instructor?: string;
    enrolledAt: string;
    progress: number;
    curriculum: CurriculumModule[];
}

interface Cohort {
    id: string;
    name: string;
    batch: string;
    status: string;
    assignedAt: string;
}

interface StudentProfile {
    id: string;
    name: string;
    studentId: string;
    email: string;
    phone?: string;
    status: string;
    paymentStatus: string;
    initialPassword?: string | null;
    courses: Course[];
    cohorts: Cohort[];
}

interface StudentProfileClientProps {
    student: StudentProfile;
}

export default function StudentProfileClient({ student }: StudentProfileClientProps) {
    const [activeTab, setActiveTab] = useState<'courses' | 'cohorts'>('courses');
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    // Initialize password display logic: if initialPassword exists, we can show it masked.
    // If it's null, we assume it's changed by user or not available.
    const [passwordToDisplay, setPasswordToDisplay] = useState<string | null>(student.initialPassword || null);

    const { toasts, success, error, removeToast } = useToast();

    const handleResetPassword = async () => {
        if (!confirm('Are you sure you want to reset this student\'s password? A new password will be generated.')) return;

        setIsResetting(true);
        try {
            const res = await fetch('/api/admin/users/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: student.id })
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to reset password');

            setPasswordToDisplay(data.newPassword);
            success('Password reset successfully');
            setShowPassword(true); // Show the new password immediately
        } catch (err: any) {
            error(err.message);
        } finally {
            setIsResetting(false);
        }
    };

    const getPaymentBadge = (status: string) => {
        const s = (status || 'unpaid').toLowerCase();
        switch (s) {
            case 'paid':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                        <CheckCircle2 size={12} />
                        Paid
                    </span>
                );
            case 'partial':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100">
                        <AlertCircle size={12} />
                        Partial
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-100">
                        <XCircle size={12} />
                        Unpaid
                    </span>
                );
        }
    };

    const getStatusBadge = (status: string) => {
        const active = (status || '').toLowerCase() === 'active';
        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${active ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-gray-50 text-gray-500 border border-gray-100'
                }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                {status || 'Unknown'}
            </span>
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Navigation Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/students"
                    className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-primary hover:border-primary/20 transition-all shadow-sm"
                >
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Student Profile</h1>
                    <p className="text-gray-500 text-sm">View and manage detailed information for {student.name}.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Information Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-xl shadow-gray-200/50 relative overflow-hidden">
                        {/* Decorative Background Element */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[5rem] -mr-8 -mt-8" />

                        <div className="relative flex flex-col items-center text-center">
                            <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-purple-100 to-blue-50 text-primary flex items-center justify-center font-bold text-3xl border-4 border-white shadow-lg mb-4">
                                {(student.name || '?').charAt(0)}
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">{student.name}</h2>
                            <p className="text-primary font-bold text-xs tracking-widest uppercase mt-1 px-3 py-1 bg-primary/5 rounded-full">
                                {student.studentId}
                            </p>

                            <div className="mt-6 w-full space-y-4">
                                <div className="flex items-center justify-between py-3 border-b border-gray-50">
                                    <span className="text-sm text-gray-500">User Status</span>
                                    {getStatusBadge(student.status)}
                                </div>
                                <div className="flex items-center justify-between py-3">
                                    <span className="text-sm text-gray-500">Payment Status</span>
                                    {getPaymentBadge(student.paymentStatus)}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-xl shadow-gray-200/50">
                        <h3 className="text-lg font-bold text-gray-900 mb-6">Contact Information</h3>
                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
                                    <Mail size={18} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Email Address</p>
                                    <p className="text-sm font-medium text-gray-900 mt-1 break-all">{student.email}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
                                    <Phone size={18} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Phone Number</p>
                                    <p className="text-sm font-medium text-gray-900 mt-1">{student.phone || 'Not Provided'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-xl shadow-gray-200/50">
                        <h3 className="text-lg font-bold text-gray-900 mb-6">Account Security</h3>
                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
                                    <Lock size={18} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Default Password</p>
                                    {passwordToDisplay ? (
                                        <div className="mt-2 flex items-center justify-between gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                            <div className="font-mono text-sm text-gray-900 break-all">
                                                {showPassword ? passwordToDisplay : '•'.repeat(12)}
                                            </div>
                                            <button
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="text-gray-400 hover:text-primary transition-colors p-1"
                                            >
                                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="mt-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                                <span className="text-gray-400 italic text-sm">Changed by user</span>
                                            </div>
                                            <button
                                                onClick={handleResetPassword}
                                                disabled={isResetting}
                                                className="mt-3 text-xs font-bold text-primary hover:text-purple-700 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                                            >
                                                <RefreshCw size={12} className={isResetting ? "animate-spin" : ""} />
                                                {isResetting ? 'Resetting...' : 'Reset Password'}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area: Enrollments */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Activity Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-3 mb-1">
                                <BookOpen size={18} className="text-purple-600" />
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Enrolled Courses</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{student.courses.length}</p>
                        </div>
                        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-3 mb-1">
                                <Layers size={18} className="text-blue-600" />
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Cohorts</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{student.cohorts.length}</p>
                        </div>
                    </div>

                    {/* Enrollment Details Tabs */}
                    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden flex flex-col h-full min-h-[500px]">
                        <div className="flex border-b border-gray-50 px-8">
                            <button
                                onClick={() => setActiveTab('courses')}
                                className={`py-6 text-sm font-bold tracking-tight transition-all relative ${activeTab === 'courses' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                Enrolled Courses
                                {activeTab === 'courses' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('cohorts')}
                                className={`ml-8 py-6 text-sm font-bold tracking-tight transition-all relative ${activeTab === 'cohorts' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                Assigned Cohorts
                                {activeTab === 'cohorts' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />
                                )}
                            </button>
                        </div>

                        <div className="p-8 flex-1">
                            {activeTab === 'courses' && (
                                <div className="space-y-4">
                                    {student.courses.length > 0 ? (
                                        student.courses.map((course) => (
                                            <div
                                                key={course.id}
                                                onClick={() => setSelectedCourse(course)}
                                                className="group p-5 rounded-3xl border border-gray-100 hover:border-primary/20 hover:bg-primary/[0.02] transition-all cursor-pointer relative"
                                            >
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                                                    <ChevronRight className="text-primary" size={20} />
                                                </div>
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                    <div className="flex items-start gap-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-white group-hover:text-primary transition-colors border border-transparent group-hover:border-primary/10">
                                                            <BookOpen size={20} />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-gray-900 group-hover:text-primary transition-colors">{course.title}</h4>
                                                            <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                                                                <User size={12} />
                                                                {course.instructor || 'No Instructor'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col md:items-end gap-2">
                                                        <div className="flex items-center gap-3">
                                                            <div className="px-3 py-1 rounded-full bg-slate-900/5 text-slate-600 border border-slate-100 text-[10px] font-bold uppercase tracking-widest">
                                                                Enrolled
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                            <Calendar size={12} />
                                                            {course.enrolledAt}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Progress Bar */}
                                                <div className="mt-4 pt-4 border-t border-gray-50">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Course Progress</span>
                                                        <span className="text-sm font-bold text-primary">{course.progress}%</span>
                                                    </div>
                                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-primary transition-all duration-1000 ease-out"
                                                            style={{ width: `${course.progress}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-12">
                                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <BookOpen size={24} className="text-gray-300" />
                                            </div>
                                            <p className="text-gray-900 font-bold">No courses enrolled</p>
                                            <p className="text-gray-500 text-sm mt-1">This student hasn't been enrolled in any courses yet.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'cohorts' && (
                                <div className="space-y-4">
                                    {student.cohorts.length > 0 ? (
                                        student.cohorts.map((cohort) => (
                                            <div key={cohort.id} className="group p-5 rounded-3xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all">
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                    <div className="flex items-start gap-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-white group-hover:text-blue-600 transition-colors border border-transparent group-hover:border-blue-100">
                                                            <Layers size={20} />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{cohort.name}</h4>
                                                            <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                                                                <Layers size={12} />
                                                                Batch: {cohort.batch}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col md:items-end gap-2">
                                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${cohort.status === 'active'
                                                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                            : 'bg-blue-50 text-blue-600 border border-blue-100'
                                                            }`}>
                                                            {cohort.status}
                                                        </span>
                                                        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                            <Clock size={12} />
                                                            Assigned: {cohort.assignedAt}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-12">
                                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Layers size={24} className="text-gray-300" />
                                            </div>
                                            <p className="text-gray-900 font-bold">No cohorts assigned</p>
                                            <p className="text-gray-500 text-sm mt-1">This student hasn't been assigned to any cohorts yet.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Course Breakdown Modal */}
            {selectedCourse && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
                        onClick={() => setSelectedCourse(null)}
                    />
                    <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-300 flex flex-col max-h-[85vh]">
                        {/* Modal Header */}
                        <div className="p-8 pb-6 border-b border-gray-50 shrink-0">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-1 block">Course Curriculum Audit</span>
                                    <h3 className="text-2xl font-bold text-gray-900">{selectedCourse.title}</h3>
                                </div>
                                <button
                                    onClick={() => setSelectedCourse(null)}
                                    className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-gray-900 transition-all"
                                >
                                    <ArrowLeft className="rotate-90 md:rotate-0" size={24} />
                                </button>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-3 bg-gray-50 rounded-2xl">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Status</p>
                                    <p className="text-sm font-bold text-gray-900">{selectedCourse.progress === 100 ? 'Completed' : 'In Progress'}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-2xl">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Completion</p>
                                    <p className="text-sm font-bold text-primary">{selectedCourse.progress}%</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-2xl">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Items Done</p>
                                    <p className="text-sm font-bold text-gray-900">
                                        {selectedCourse.curriculum.flatMap(m => m.items).filter(i => i.isCompleted).length} / {selectedCourse.curriculum.flatMap(m => m.items).length}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Modal Body (Scrollable) */}
                        <div className="p-8 pt-6 overflow-y-auto space-y-8 custom-scrollbar">
                            {selectedCourse.curriculum.length > 0 ? (
                                selectedCourse.curriculum.map((module) => (
                                    <div key={module.id} className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-primary/5 text-primary flex items-center justify-center font-bold text-xs">
                                                {module.title.charAt(0)}
                                            </div>
                                            <h4 className="font-bold text-gray-900">{module.title}</h4>
                                        </div>

                                        <div className="grid grid-cols-1 gap-2 pl-4 border-l-2 border-gray-50 ml-4">
                                            {module.items.map((item) => (
                                                <div
                                                    key={item.id}
                                                    className="flex items-center justify-between p-3 rounded-xl border border-transparent hover:border-gray-100 hover:bg-gray-50/50 transition-all group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={item.isCompleted ? 'text-emerald-500' : 'text-gray-300'}>
                                                            {item.isCompleted ? <CheckCircle size={18} /> : <Circle size={18} />}
                                                        </div>
                                                        <div>
                                                            <p className={`text-sm font-semibold transition-colors ${item.isCompleted ? 'text-gray-900' : 'text-gray-500'}`}>
                                                                {item.title}
                                                            </p>
                                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                                {item.type}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {item.isCompleted && (
                                                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                                            Done
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12">
                                    <BookOpen size={48} className="mx-auto text-gray-200 mb-4" />
                                    <p className="text-gray-500 font-medium">No curriculum content available for this course.</p>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-8 border-t border-gray-50 bg-gray-50/30 shrink-0">
                            <button
                                onClick={() => setSelectedCourse(null)}
                                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-primary transition-all shadow-xl shadow-slate-200"
                            >
                                Close Audit View
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notifications */}
            {toasts.map((toast) => (
                <Toast
                    key={toast.id}
                    type={toast.type}
                    message={toast.message}
                    onClose={() => removeToast(toast.id)}
                />
            ))}
        </div>
    );
}

"use client";

import { useState } from 'react';
import Link from 'next/link';
import {
    Mail, Phone, User, CheckCircle2, XCircle, AlertCircle,
    ArrowLeft, Calendar, BookOpen, Layers, Clock, TrendingUp,
    ChevronRight, CheckCircle, Circle, GraduationCap,
    Eye, EyeOff, Lock, RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/ui/Toast';

interface Cohort {
    id: string;
    name: string;
    batch: string;
    status: string;
    assignedAt: string;
}

interface Course {
    id: string;
    title: string;
    code: string;
    instructor?: string;
    image?: string;
    lessonsCount: number;
}

interface TutorProfile {
    id: string;
    name: string;
    tutorId: string;
    email: string;
    phone?: string;
    status: string;
    initialPassword?: string | null;
    cohorts: Cohort[];
    courses: Course[];
}

interface TutorProfileClientProps {
    tutor: TutorProfile;
}

export default function TutorProfileClient({ tutor }: TutorProfileClientProps) {
    const [activeTab, setActiveTab] = useState<'cohorts' | 'courses'>('cohorts');
    const [showPassword, setShowPassword] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [passwordToDisplay, setPasswordToDisplay] = useState<string | null>(tutor.initialPassword || null);
    const { toasts, success, error, removeToast } = useToast();

    const handleResetPassword = async () => {
        if (!confirm('Are you sure you want to reset this tutor\'s password? A new password will be generated.')) return;

        setIsResetting(true);
        try {
            const res = await fetch('/api/admin/users/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: tutor.id })
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to reset password');

            setPasswordToDisplay(data.newPassword);
            success('Password reset successfully');
            setShowPassword(true);
        } catch (err: any) {
            error(err.message);
        } finally {
            setIsResetting(false);
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
                    href="/admin/tutors"
                    className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-primary hover:border-primary/20 transition-all shadow-sm"
                >
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Tutor Profile</h1>
                    <p className="text-gray-500 text-sm">View and manage detailed information for {tutor.name}.</p>
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
                                {(tutor.name || '?').charAt(0)}
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">{tutor.name}</h2>
                            <p className="text-primary font-bold text-xs tracking-widest uppercase mt-1 px-3 py-1 bg-primary/5 rounded-full">
                                {tutor.tutorId}
                            </p>

                            <div className="mt-6 w-full space-y-4">
                                <div className="flex items-center justify-between py-3 border-b border-gray-50">
                                    <span className="text-sm text-gray-500">User Status</span>
                                    {getStatusBadge(tutor.status)}
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
                                    <p className="text-sm font-medium text-gray-900 mt-1 break-all">{tutor.email}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
                                    <Phone size={18} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Phone Number</p>
                                    <p className="text-sm font-medium text-gray-900 mt-1">{tutor.phone || 'Not Provided'}</p>
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

                {/* Main Content Area: Assignments */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Activity Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-3 mb-1">
                                <Layers size={18} className="text-blue-600" />
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Assigned Cohorts</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{tutor.cohorts.length}</p>
                        </div>
                        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-3 mb-1">
                                <BookOpen size={18} className="text-purple-600" />
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Assigned Courses</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{tutor.courses.length}</p>
                        </div>
                    </div>

                    {/* DETAILS TABS */}
                    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden flex flex-col h-full min-h-[500px]">
                        <div className="flex border-b border-gray-50 px-8">
                            <button
                                onClick={() => setActiveTab('cohorts')}
                                className={`py-6 text-sm font-bold tracking-tight transition-all relative ${activeTab === 'cohorts' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                Assigned Cohorts
                                {activeTab === 'cohorts' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('courses')}
                                className={`ml-8 py-6 text-sm font-bold tracking-tight transition-all relative ${activeTab === 'courses' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                Assigned Courses
                                {activeTab === 'courses' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />
                                )}
                            </button>
                        </div>

                        <div className="p-8 flex-1">
                            {activeTab === 'cohorts' && (
                                <div className="space-y-4">
                                    {tutor.cohorts.length > 0 ? (
                                        tutor.cohorts.map((cohort) => (
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
                                            <p className="text-gray-500 text-sm mt-1">This tutor hasn't been assigned to any cohorts yet.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'courses' && (
                                <div className="space-y-4">
                                    {tutor.courses.length > 0 ? (
                                        tutor.courses.map((course) => (
                                            <div key={course.id} className="group p-5 rounded-3xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50/30 transition-all">
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                    <div className="flex items-start gap-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-white group-hover:text-purple-600 transition-colors border border-transparent group-hover:border-purple-100">
                                                            <BookOpen size={20} />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-gray-900 group-hover:text-purple-600 transition-colors">{course.title}</h4>
                                                            <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                                                                <span className="font-mono">{course.code}</span>
                                                                <span>•</span>
                                                                <span>{course.lessonsCount} Lessons</span>
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col md:items-end gap-2">
                                                        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                            <User size={12} />
                                                            Instructor: {course.instructor || 'Unknown'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-12">
                                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <BookOpen size={24} className="text-gray-300" />
                                            </div>
                                            <p className="text-gray-900 font-bold">No courses assigned</p>
                                            <p className="text-gray-500 text-sm mt-1">This tutor is not teaching any courses via their cohorts.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

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

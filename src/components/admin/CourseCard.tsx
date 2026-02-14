import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, FileText, CheckSquare, List, Calendar, ArrowRight, User, Lock } from 'lucide-react';

interface CourseCardProps {
    id: string; // Add ID for linking
    title: string;
    description: string;
    instructor: string;
    image?: string;
    topics: number;
    lessons: number;
    quizzes: number;
    assignments: number;
    status: string;
    datePublished?: string; // Optional if draft
    cohortsCount?: number; // Optional based on request "cohort"
    linkPrefix?: string;
    isLocked?: boolean;
    cohortNames?: string[];
}

export default function CourseCard({
    id,
    title,
    description,
    instructor,
    image,
    topics,
    lessons,
    quizzes,
    assignments,
    status,
    datePublished,
    code,
    cohortsCount = 0,
    linkPrefix = '/admin/courses',
    isLocked = false,
    cohortNames = []
}: CourseCardProps & { code?: string }) {
    const statusConfig: any = {
        active: { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
        draft: { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
        published: { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
        archived: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500' },
    };

    const style = statusConfig[status] || statusConfig.draft;

    const CardContent = (
        <div className={`bg-white rounded-3xl shadow-sm relative overflow-hidden border border-gray-100 h-full flex flex-col
            ${isLocked ? 'opacity-80' : 'hover:shadow-xl transition-all duration-300'}
        `}>
            {/* Image Header */}
            <div className="relative h-48 w-full bg-gray-100">
                {image ? (
                    <Image
                        src={image}
                        alt={title}
                        fill
                        className={`object-cover transition-transform duration-500 ${!isLocked && 'group-hover:scale-105'}`}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
                        <BookOpen size={48} className="text-purple-200" />
                    </div>
                )}

                {isLocked && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center text-white z-10">
                        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mb-2">
                            <Lock size={24} />
                        </div>
                        <span className="font-bold tracking-wide uppercase text-sm">Locked</span>
                    </div>
                )}

                {/* Status Badge */}
                {!isLocked && (
                    <div className="absolute top-4 right-4 flex gap-2">
                        {code && (
                            <div className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wider bg-slate-900/80 text-white backdrop-blur-md uppercase border border-white/20">
                                {code}
                            </div>
                        )}
                        {cohortNames && cohortNames.length > 0 && cohortNames.map((name, idx) => (
                            <div key={idx} className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wider bg-purple-600/90 text-white backdrop-blur-md uppercase border border-white/20 shadow-sm">
                                {name}
                            </div>
                        ))}
                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md bg-white/90 ${style.text} shadow-sm`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                            <span className="capitalize">{status}</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-6 flex-1 flex flex-col">
                {/* Title & Instructor */}
                <div className="mb-6">
                    <h3 className={`text-xl font-bold text-gray-900 leading-tight mb-2 line-clamp-2 ${!isLocked && 'group-hover:text-primary'} transition-colors`}>{title}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                            <User size={12} className="text-gray-400" />
                        </div>
                        <span className="font-medium">{instructor}</span>
                    </div>
                </div>

                {/* Metrics Grid */}
                <div className={`grid grid-cols-2 gap-3 mb-6 mt-auto ${isLocked ? 'opacity-50 grayscale' : ''}`}>
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-50 group-hover:bg-purple-50/50 transition-colors border border-transparent group-hover:border-purple-100">
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-purple-600 shadow-sm">
                            <List size={14} />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Topics</p>
                            <p className="text-sm font-bold text-gray-900">{topics || 0}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-50 group-hover:bg-blue-50/50 transition-colors border border-transparent group-hover:border-blue-100">
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-blue-600 shadow-sm">
                            <BookOpen size={14} />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Lessons</p>
                            <p className="text-sm font-bold text-gray-900">{lessons || 0}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-50 group-hover:bg-orange-50/50 transition-colors border border-transparent group-hover:border-orange-100">
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-orange-600 shadow-sm">
                            <CheckSquare size={14} />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Quizzes</p>
                            <p className="text-sm font-bold text-gray-900">{quizzes || 0}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-50 group-hover:bg-indigo-50/50 transition-colors border border-transparent group-hover:border-indigo-100">
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-indigo-600 shadow-sm">
                            <Calendar size={14} />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Cohorts</p>
                            <p className="text-sm font-bold text-gray-900">{cohortsCount}</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-[11px] text-gray-400 font-medium">
                        <Calendar size={12} />
                        <span>{datePublished || 'Draft'}</span>
                    </div>
                    {!isLocked && (
                        <div className="flex items-center gap-1 text-primary font-bold text-sm opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                            Manage
                            <ArrowRight size={14} />
                        </div>
                    )}
                    {isLocked && (
                        <div className="flex items-center gap-1 text-gray-400 font-bold text-sm">
                            <Lock size={12} />
                            Locked
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    if (isLocked) {
        return <div className="block h-full cursor-not-allowed">{CardContent}</div>;
    }

    return (
        <Link
            href={`${linkPrefix}/${id}`}
            className="group block h-full translate-y-0 hover:-translate-y-1 transition-all duration-300"
        >
            {CardContent}
        </Link>
    );
}

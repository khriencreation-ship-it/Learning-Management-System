"use client";

import { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/tutor/DashboardLayout";
import {
    ChevronLeft,
    ChevronRight,
    Play,
    FileText,
    CheckSquare,
    Video,
    ChevronDown,
    ChevronUp,
    Download,
    ExternalLink,
    Search,
    BookOpen,
    Clock,
    Calendar,
    AlertCircle,
    Info,
    Upload,
    ArrowRight,
    Paperclip,
    X as XIcon
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// --- Sub-components ---

const CountdownTimer = ({ targetDate, targetTime }: { targetDate: string, targetTime: string }) => {
    const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, minutes: number, seconds: number } | null>(null);
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date();
            const target = new Date(`${targetDate}T${targetTime}`);
            const difference = target.getTime() - now.getTime();

            if (difference <= 0) {
                setIsComplete(true);
                return null;
            }

            return {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        };

        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        setTimeLeft(calculateTimeLeft());

        return () => clearInterval(timer);
    }, [targetDate, targetTime]);

    if (isComplete) return null;
    if (!timeLeft) return null;

    return (
        <div className="flex gap-4">
            {[
                { label: 'Days', value: timeLeft.days },
                { label: 'Hours', value: timeLeft.hours },
                { label: 'Mins', value: timeLeft.minutes },
                { label: 'Secs', value: timeLeft.seconds },
            ].map((unit, i) => (
                <div key={i} className="flex flex-col items-center p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 min-w-[70px]">
                    <span className="text-2xl font-black text-white">{unit.value.toString().padStart(2, '0')}</span>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-purple-200">{unit.label}</span>
                </div>
            ))}
        </div>
    );
};

// --- Main Component ---

interface TutorClassroomClientProps {
    course: any;
    exitHref?: string;
    isAdmin?: boolean;
}

export default function TutorClassroomClient({ course, exitHref, isAdmin = false }: TutorClassroomClientProps) {
    const router = useRouter();
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState("");

    // Initialize with first item if available
    useEffect(() => {
        if (course.curriculum && course.curriculum.length > 0) {
            const firstModule = course.curriculum[0];
            if (firstModule.items && firstModule.items.length > 0) {
                setSelectedItem(firstModule.items[0]);
                setExpandedModules(new Set([firstModule.id]));
            }
        }
    }, [course]);

    const toggleModule = (moduleId: string) => {
        const newExpanded = new Set(expandedModules);
        if (newExpanded.has(moduleId)) {
            newExpanded.delete(moduleId);
        } else {
            newExpanded.add(moduleId);
        }
        setExpandedModules(newExpanded);
    };

    const getItemIcon = (type: string) => {
        switch (type) {
            case 'quiz': return <CheckSquare size={18} className="text-emerald-500" />;
            case 'assignment': return <FileText size={18} className="text-orange-500" />;
            case 'live-class':
            case 'live_class': return <Video size={18} className="text-purple-500" />;
            default: return <Play size={18} className="text-blue-500" />;
        }
    };

    const filteredCurriculum = course.curriculum?.map((module: any) => ({
        ...module,
        items: module.items?.filter((item: any) =>
            item.title.toLowerCase().includes(searchTerm.toLowerCase())
        )
    })).filter((module: any) => module.items && module.items.length > 0);

    // --- Content Renders ---

    const renderLesson = (lesson: any) => (
        <div className="flex-1 overflow-y-auto">
            {/* Video Player */}
            <div className="w-full aspect-video bg-black relative shadow-2xl overflow-hidden group">
                {lesson.video_url || lesson.videoPreview ? (
                    <video
                        key={lesson.id}
                        src={lesson.video_url || lesson.videoPreview}
                        poster={lesson.coverPreview || lesson.poster}
                        controls
                        className="w-full h-full object-contain"
                    />

                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white/40 space-y-4 bg-slate-900">
                        <Play size={64} className="opacity-20 translate-y-2 group-hover:translate-y-0 transition-transform duration-500" />
                        <p className="font-bold text-lg">No video for this lesson</p>
                    </div>
                )}
            </div>

            <div className="max-w-4xl mx-auto p-8 lg:p-12 space-y-10">
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100">
                            Lesson
                        </span>
                        {lesson.duration && (
                            <span className="flex items-center gap-1.5 text-gray-400 text-xs font-bold">
                                <Clock size={14} />
                                {lesson.duration} mins
                            </span>
                        )}
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-tight">{lesson.title}</h1>
                    <div className="prose prose-purple max-w-none">
                        <p className="text-gray-600 text-lg leading-relaxed font-medium">
                            {lesson.summary || lesson.description || "No description provided for this lesson."}
                        </p>
                    </div>
                </div>

                {/* Materials */}
                {(lesson.links?.length > 0 || lesson.files?.length > 0) && (
                    <div className="space-y-6 pt-10 border-t border-gray-100">
                        <h3 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                            <Download className="text-primary" />
                            Lesson Materials
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {lesson.files?.map((file: any, i: number) => (
                                <a
                                    key={i}
                                    href={file.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between p-5 bg-gray-50 rounded-3xl border border-transparent hover:border-primary hover:bg-white transition-all group shadow-sm hover:shadow-xl hover:shadow-purple-900/5"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-primary shadow-sm group-hover:scale-110 transition-transform duration-300">
                                            <Download size={24} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-black text-gray-900 truncate">{file.name}</p>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Download Attachment</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={18} className="text-gray-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                </a>
                            ))}
                            {lesson.links?.map((link: any, i: number) => {
                                let url = typeof link === 'string' ? link : link.url;
                                // Ensure absolute URL
                                if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
                                    url = `https://${url}`;
                                }
                                const title = typeof link === 'string' ? 'External Resource' : (link.title || link.name || 'External Resource');
                                return (
                                    <a
                                        key={i}
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"

                                        className="flex items-center justify-between p-5 bg-gray-50 rounded-3xl border border-transparent hover:border-primary hover:bg-white transition-all group shadow-sm hover:shadow-xl hover:shadow-purple-900/5"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-blue-600 shadow-sm group-hover:scale-110 transition-transform duration-300">
                                                <ExternalLink size={24} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-black text-gray-900 truncate">{title}</p>
                                                <p className="text-[10px] text-gray-400 font-medium truncate">{url}</p>
                                            </div>
                                        </div>
                                        <ChevronRight size={18} className="text-gray-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                                    </a>
                                );
                            })}

                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    const renderLiveClass = (liveClass: any) => {
        const isPast = new Date(`${liveClass.date}T${liveClass.time}`).getTime() < new Date().getTime();

        return (
            <div className="flex-1 overflow-y-auto">
                {/* Hero Header for Live Class */}
                <div className="w-full min-h-[400px] bg-slate-900 relative flex items-center justify-center px-6 py-12 overflow-hidden">
                    {/* Abstract background */}
                    <div className="absolute inset-0 opacity-20 pointer-events-none select-none">
                        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600 blur-[120px] rounded-full" />
                        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600 blur-[120px] rounded-full" />
                    </div>

                    <div className="relative z-10 flex flex-col items-center text-center space-y-8 max-w-2xl">
                        <div className="flex flex-col items-center space-y-4">
                            <div className="w-20 h-20 rounded-3xl bg-purple-500/20 flex items-center justify-center text-purple-400 border border-purple-500/30 animate-pulse">
                                <Video size={40} />
                            </div>
                            <span className="px-4 py-1.5 bg-purple-500 text-white rounded-full text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-purple-500/20">
                                Live Session
                            </span>
                        </div>

                        {!isPast ? (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold text-white">Class starts in:</h2>
                                <CountdownTimer targetDate={liveClass.date} targetTime={liveClass.time} />
                                <div className="flex items-center gap-6 text-gray-400 justify-center pt-4">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={18} className="text-purple-400" />
                                        <span className="font-bold">{new Date(liveClass.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock size={18} className="text-purple-400" />
                                        <span className="font-bold">{liveClass.time}</span>
                                    </div>
                                </div>
                            </div>
                        ) : (() => {
                            const startTime = new Date(`${liveClass.date}T${liveClass.time}`).getTime();
                            const now = new Date().getTime();
                            const twoHoursInMs = 2 * 60 * 60 * 1000;
                            const hasEnded = now - startTime > twoHoursInMs;

                            if (hasEnded) {
                                return (
                                    <div className="space-y-6 p-10 bg-white/5 backdrop-blur-md rounded-[3rem] border border-white/10 max-w-xl mx-auto">
                                        <div className="w-16 h-16 rounded-3xl bg-red-500/20 flex items-center justify-center text-red-400 border border-red-500/30 mx-auto">
                                            <Clock size={32} />
                                        </div>
                                        <div className="space-y-2 text-center">
                                            <h2 className="text-2xl font-black text-white italic">This live class has ended!</h2>
                                            <p className="text-purple-200 text-sm font-medium leading-relaxed">
                                                You can watch the recorded video of the class from the curriculum side panel.
                                            </p>
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div className="space-y-8">
                                    <h1 className="text-4xl font-black text-white">The session has started!</h1>
                                    <a
                                        href={liveClass.meetingLink || "#"}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-3xl font-black text-lg hover:scale-105 transition-all shadow-2xl shadow-purple-500/40 group active:scale-95"
                                    >
                                        <Video size={24} />
                                        Join Google Meet
                                        <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                                    </a>
                                    <p className="text-purple-200 text-sm font-medium">Click the button above to join the class room.</p>
                                </div>
                            );
                        })()}
                    </div>
                </div>

                <div className="max-w-4xl mx-auto p-12 space-y-8">
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">{liveClass.title}</h1>
                    <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100">
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">About this session</h4>
                        <p className="text-gray-600 text-lg leading-relaxed font-medium">
                            {liveClass.description || "No specific instructions provided for this live session. Please be on time!"}
                        </p>
                    </div>
                </div>
            </div>
        );
    };

    const renderQuiz = (quiz: any) => (
        <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto p-12 space-y-12">
                {/* Header Card */}
                <div className="p-10 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-[3rem] text-white shadow-2xl shadow-emerald-900/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
                        <CheckSquare size={160} />
                    </div>
                    <div className="relative z-10 space-y-6">
                        <div className="space-y-2">
                            <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest">
                                Multiple Choice Quiz
                            </span>
                            <h1 className="text-4xl font-black tracking-tight">{quiz.title}</h1>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/10">
                            <div className="space-y-1">
                                <p className="text-emerald-100/60 text-[10px] uppercase font-black tracking-wider">Time Limit</p>
                                <p className="font-black text-lg">{quiz.timeLimit} mins</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-emerald-100/60 text-[10px] uppercase font-black tracking-wider">Attempts</p>
                                <p className="font-black text-lg">{quiz.maxAttempts}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-emerald-100/60 text-[10px] uppercase font-black tracking-wider">Questions</p>
                                <p className="font-black text-lg">{quiz.questions?.length || 0}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-emerald-100/60 text-[10px] uppercase font-black tracking-wider">Passing Grade</p>
                                <p className="font-black text-lg">{quiz.passingGrade}%</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-10">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-5">
                        <h3 className="text-2xl font-black text-gray-900">Quiz Content</h3>
                        <p className="text-sm font-bold text-emerald-600 px-4 py-2 bg-emerald-50 rounded-2xl">
                            Previewing questions as Instructor
                        </p>
                    </div>

                    <div className="space-y-8">
                        {quiz.questions?.map((q: any, i: number) => (
                            <div key={i} className="space-y-5 p-8 bg-white border border-gray-100 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:shadow-gray-200/50 transition-all group">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="space-y-2 flex-1">
                                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Question {i + 1}</span>
                                        <h4 className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors">{q.question}</h4>
                                        {q.description && <p className="text-sm text-gray-500 font-medium italic">{q.description}</p>}
                                    </div>
                                    <div className="px-3 py-1 bg-gray-50 text-gray-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-gray-100">
                                        {q.type}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {q.type === 'true-false' ? (
                                        ['True', 'False'].map((opt) => (
                                            <div key={opt} className={`p-4 rounded-2xl border ${q.correctAnswer === opt.toLowerCase() ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-gray-50 border-transparent text-gray-500'} font-bold text-sm flex items-center justify-between`}>
                                                {opt}
                                                {q.correctAnswer === opt.toLowerCase() && <CheckSquare size={16} />}
                                            </div>
                                        ))
                                    ) : (
                                        q.options?.map((opt: string, optIdx: number) => (
                                            <div key={optIdx} className={`p-4 rounded-2xl border ${q.correctAnswer === optIdx.toString() ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-gray-50 border-transparent text-gray-500'} font-bold text-sm flex items-center justify-between`}>
                                                <span className="flex items-center gap-3">
                                                    <span className="w-6 h-6 rounded-lg bg-white border border-inherit flex items-center justify-center text-[10px] font-black">{String.fromCharCode(65 + optIdx)}</span>
                                                    {opt}
                                                </span>
                                                {q.correctAnswer === optIdx.toString() && <CheckSquare size={16} />}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderAssignment = (assignment: any) => (
        <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto p-12 space-y-12">
                {/* Header Card */}
                <div className="p-12 bg-gradient-to-br from-orange-500 to-rose-600 rounded-[3rem] text-white shadow-2xl shadow-orange-900/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
                        <FileText size={160} />
                    </div>
                    <div className="relative z-10 space-y-8">
                        <div className="space-y-3">
                            <span className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-[0.2em]">
                                Dynamic Assignment
                            </span>
                            <h1 className="text-5xl font-black tracking-tight leading-none">{assignment.title}</h1>
                        </div>

                        <div className="flex flex-wrap gap-8 pt-6 border-t border-white/10">
                            {[
                                { label: 'Time Limit', value: `${assignment.timeLimit} ${assignment.timeUnit}` },
                                { label: 'Points', value: `${assignment.totalPoints} pts` },
                                { label: 'Min. To Pass', value: `${assignment.minPassPoints} pts` },
                                { label: 'File Max', value: `${assignment.maxFileSize}MB` },
                            ].map((stat, i) => (
                                <div key={i} className="space-y-1">
                                    <p className="text-orange-100/60 text-[10px] uppercase font-black tracking-widest">{stat.label}</p>
                                    <p className="font-black text-xl">{stat.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Left: Content & Attachments */}
                    <div className="lg:col-span-2 space-y-12">
                        <div className="space-y-6">
                            <h3 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                                <Info className="text-orange-500" />
                                Instructions
                            </h3>
                            <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 prose prose-orange max-w-none">
                                <p className="text-gray-600 text-lg leading-relaxed font-medium">
                                    {assignment.content || assignment.summary || assignment.description || "No specific instructions provided for this assignment."}
                                </p>
                            </div>
                        </div>

                        {assignment.attachments?.length > 0 && (
                            <div className="space-y-6">
                                <h3 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                                    <Paperclip className="text-orange-500" />
                                    Helper Documents
                                </h3>
                                <div className="space-y-3">
                                    {assignment.attachments?.map((file: any, i: number) => (
                                        <a
                                            key={i}
                                            href={file.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-between p-6 bg-white rounded-3xl border border-gray-100 hover:border-orange-500 hover:shadow-xl hover:shadow-orange-900/5 transition-all group"
                                        >
                                            <div className="flex items-center gap-5">
                                                <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                                    <FileText size={28} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-base font-black text-gray-900 truncate">{file.name || 'Unnamed Attachment'}</p>
                                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.1em]">Study Material</p>
                                                </div>
                                            </div>
                                            <Download size={20} className="text-gray-300 group-hover:text-orange-500 group-hover:translate-y-0.5 transition-all" />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: Submission Info & Mock Upload */}
                    <div className="space-y-8">
                        <div className="sticky top-8 space-y-6">
                            <div className="p-8 bg-white border border-gray-100 rounded-[3rem] shadow-xl shadow-gray-200/40 space-y-8">
                                <div className="space-y-2 text-center">
                                    <h4 className="text-xl font-black text-gray-900">Your Submission</h4>
                                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest">Student Portal View</p>
                                </div>

                                <div className="w-full aspect-square border-4 border-dashed border-gray-100 rounded-[2.5rem] flex flex-col items-center justify-center p-8 text-center space-y-4 hover:border-orange-200 hover:bg-orange-50/20 transition-all cursor-not-allowed group">
                                    <div className="w-16 h-16 rounded-3xl bg-gray-50 text-gray-300 flex items-center justify-center group-hover:bg-orange-100 group-hover:text-orange-500 transition-colors">
                                        <Upload size={32} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-gray-700">Submit Assignment</p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Files up to {assignment.maxFileSize}MB</p>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-gray-100">
                                    <div className="flex items-center justify-between text-xs font-bold">
                                        <span className="text-gray-400 uppercase tracking-widest">Resubmission</span>
                                        <span className={assignment.allowResubmission ? "text-emerald-500" : "text-rose-500"}>
                                            {assignment.allowResubmission ? "Allowed" : "Not Allowed"}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs font-bold">
                                        <span className="text-gray-400 uppercase tracking-widest">Submission Limit</span>
                                        <span className="text-gray-900">{assignment.fileUploadLimit} File(s)</span>
                                    </div>
                                </div>

                                <button
                                    disabled
                                    className="w-full py-4 bg-gray-100 text-gray-400 rounded-2xl font-black text-sm uppercase tracking-widest cursor-not-allowed"
                                >
                                    Locked for Tutors
                                </button>
                            </div>

                            <div className="p-6 bg-orange-50 rounded-3xl border border-orange-100 flex items-start gap-3">
                                <AlertCircle className="text-orange-500 flex-shrink-0" size={18} />
                                <p className="text-[11px] text-orange-700 font-bold leading-relaxed">
                                    As an instructor, you can preview the assignment content here. Student submissions are managed in the "Enrolled Students" tab of the course overview.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderSelectedContent = () => {
        if (!selectedItem) return null;

        switch (selectedItem.type) {
            case 'live-class':
            case 'live_class':
                return renderLiveClass(selectedItem);
            case 'quiz':
                return renderQuiz(selectedItem);
            case 'assignment':
                return renderAssignment(selectedItem);
            default:
                return renderLesson(selectedItem);
        }
    };

    return (
        <DashboardLayout hideSidebar={true} hideHeader={true} allowAdmin={isAdmin}>
            <div className="flex h-screen overflow-hidden bg-white">

                {/* Left Sidebar - Curriculum Selection */}
                <div className="w-96 border-r border-gray-100 flex flex-col bg-gray-50/20 sticky top-0 h-screen overflow-hidden">
                    <div className="p-8 border-b border-gray-100 bg-white space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Learning Portal</span>
                                <h2 className="font-black text-gray-900 text-xl tracking-tight">Curriculum</h2>
                            </div>
                            <Link
                                href={exitHref || `/tutor/courses/${course.id}`}
                                className="w-10 h-10 rounded-2xl bg-gray-50 hover:bg-rose-50 text-gray-400 hover:text-rose-500 flex items-center justify-center transition-all group"
                                title="Exit Classroom"
                            >
                                <XIcon size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                            </Link>
                        </div>
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Search lesson..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/5 rounded-[1.5rem] text-sm font-bold outline-none transition-all placeholder:text-gray-300 shadow-inner"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {filteredCurriculum?.map((module: any, idx: number) => (
                            <div key={module.id} className="space-y-2">
                                <button
                                    onClick={() => toggleModule(module.id)}
                                    className={`w-full flex items-center justify-between p-4 rounded-3xl transition-all group ${expandedModules.has(module.id) ? 'bg-white shadow-xl shadow-gray-200/40 border border-gray-100' : 'hover:bg-white'}`}
                                >
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center text-xs font-black transition-all duration-300 ${expandedModules.has(module.id) ? 'bg-primary text-white shadow-lg shadow-purple-500/20' : 'bg-gray-100 text-gray-400'}`}>
                                            {(idx + 1).toString().padStart(2, '0')}
                                        </div>
                                        <div className="flex flex-col items-start min-w-0">
                                            <span className="text-sm font-black text-gray-900 truncate w-full text-left">{module.title}</span>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{module.items?.length || 0} items</span>
                                        </div>
                                    </div>
                                    <div className={`p-1 rounded-lg transition-colors ${expandedModules.has(module.id) ? 'text-primary' : 'text-gray-300 group-hover:text-gray-500'}`}>
                                        {expandedModules.has(module.id) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                    </div>
                                </button>

                                {expandedModules.has(module.id) && (
                                    <div className="pl-4 space-y-2 animate-in slide-in-from-top-4 duration-300 border-l border-gray-100 ml-5 pt-2">
                                        {module.items?.map((item: any) => (
                                            <button
                                                key={item.id}
                                                onClick={() => setSelectedItem(item)}
                                                className={`w-full flex items-center p-4 rounded-2xl transition-all relative overflow-hidden group ${selectedItem?.id === item.id ? 'bg-primary text-white shadow-xl shadow-purple-900/10' : 'hover:bg-white text-gray-600 hover:shadow-md'}`}
                                            >
                                                {/* Active background glow */}
                                                {selectedItem?.id === item.id && (
                                                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] animate-[shimmer_2s_infinite]" />
                                                )}

                                                <div className="flex items-center gap-4 relative z-10 w-full min-w-0">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${selectedItem?.id === item.id ? 'bg-white/20' : 'bg-gray-50 group-hover:bg-gray-100'}`}>
                                                        {getItemIcon(item.type)}
                                                    </div>
                                                    <div className="flex flex-col items-start min-w-0 w-full overflow-hidden">
                                                        <span className={`text-[9px] font-black uppercase tracking-[0.15em] mb-0.5 block ${selectedItem?.id === item.id ? 'text-purple-200' : 'text-gray-400'}`}>
                                                            {item.type.replace('-', ' ')}
                                                        </span>
                                                        <span className="text-xs font-black truncate w-full block text-left leading-tight">{item.title}</span>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>


                {/* Right Content Area */}
                <div className="flex-1 flex flex-col min-w-0 bg-white">
                    {selectedItem ? (
                        renderSelectedContent()
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-12 text-center bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-white to-gray-50/50">
                            <div className="relative mb-8">
                                <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full scale-150" />
                                <div className="relative w-32 h-32 rounded-[2.5rem] bg-white flex items-center justify-center text-primary border border-primary/10">
                                    <BookOpen size={64} />
                                </div>
                            </div>
                            <div className="space-y-4 max-w-sm">
                                <h3 className="text-3xl font-black text-gray-900">Welcome to Class</h3>
                                <p className="text-gray-500 font-medium text-lg">Select a module from the curriculum on the left to begin your lesson preview.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}

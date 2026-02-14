
"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/student/DashboardLayout";
import {
    ChevronLeft, Play, FileText, CheckSquare, Video, ChevronDown, ChevronUp, ChevronRight,
    Download, ExternalLink, Search, BookOpen, Clock, Calendar, ArrowRight, X as XIcon, CheckCircle2, Circle
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/useToast";
import StudentQuizView from './StudentQuizView';
import StudentAssignmentView from './StudentAssignmentView';

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

interface StudentClassroomClientProps {
    course: any;
    exitHref?: string;
    cohortId?: string | null;
}

export default function StudentClassroomClient({ course, exitHref, cohortId }: StudentClassroomClientProps) {
    const router = useRouter();
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState("");
    const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
    const { showToast } = useToast();

    // Initialize with first item
    useEffect(() => {
        if (course.curriculum && course.curriculum.length > 0) {
            const firstModule = course.curriculum[0];
            if (firstModule.items && firstModule.items.length > 0) {
                setSelectedItem(firstModule.items[0]);
                setExpandedModules(new Set([firstModule.id]));
            }
        }
    }, [course]);

    // Fetch Completed Items
    useEffect(() => {
        const fetchProgress = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            try {
                let url = `/api/student/classroom/progress?courseId=${course.id}`;
                if (cohortId) url += `&cohortId=${cohortId}`;

                const res = await fetch(url, {
                    headers: { 'Authorization': `Bearer ${session.access_token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    const completed = new Set<string>(data.filter((p: any) => p.is_completed).map((p: any) => p.item_id));
                    setCompletedItems(completed);
                }
            } catch (error) {
                console.error('Error fetching progress:', error);
            }
        };

        fetchProgress();
    }, [course.id, cohortId]);

    const toggleComplete = async (itemId: string, currentStatus: boolean) => {
        const newStatus = !currentStatus;

        // Optimistic update
        setCompletedItems(prev => {
            const next = new Set(prev);
            if (newStatus) next.add(itemId);
            else next.delete(itemId);
            return next;
        });

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const res = await fetch('/api/student/classroom/progress', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    courseId: course.id,
                    cohortId: cohortId || null,
                    itemId,
                    isCompleted: newStatus
                })
            });

            if (!res.ok) throw new Error('Failed to update progress');

            if (newStatus) showToast('Lesson marked as completed!', 'success');

        } catch (error) {
            console.error(error);
            showToast('Failed to save progress', 'error');
            // Revert
            setCompletedItems(prev => {
                const next = new Set(prev);
                if (currentStatus) next.add(itemId);
                else next.delete(itemId);
                return next;
            });
        }
    };

    const toggleModule = (moduleId: string) => {
        const newExpanded = new Set(expandedModules);
        if (newExpanded.has(moduleId)) newExpanded.delete(moduleId);
        else newExpanded.add(moduleId);
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

    const renderLesson = (lesson: any) => (
        <div className="flex-1 overflow-y-auto">
            {/* Video Player */}
            <div className="w-full aspect-video bg-black relative shadow-2xl overflow-hidden group">
                {lesson.video_url || lesson.videoPreview ? (
                    <video
                        key={lesson.id}
                        src={lesson.video_url || lesson.videoPreview}
                        poster={lesson.coverPreview}
                        controls
                        className="w-full h-full object-contain"
                        onEnded={() => toggleComplete(lesson.id, completedItems.has(lesson.id))}
                    />
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white/40 space-y-4 bg-slate-900">
                        <Play size={64} className="opacity-20 translate-y-2 group-hover:translate-y-0 transition-transform duration-500" />
                        <p className="font-bold text-lg">No video for this lesson</p>
                    </div>
                )}
            </div>

            <div className="max-w-4xl mx-auto p-8 lg:p-12 space-y-10">
                <div className="flex items-center justify-between">
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
                    </div>

                    <button
                        onClick={() => toggleComplete(lesson.id, completedItems.has(lesson.id))}
                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${completedItems.has(lesson.id)
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                    >
                        {completedItems.has(lesson.id) ? (
                            <>
                                <CheckCircle2 size={20} /> Completed
                            </>
                        ) : (
                            <>
                                <Circle size={20} /> Mark Complete
                            </>
                        )}
                    </button>
                </div>

                <div className="prose prose-purple max-w-none">
                    <p className="text-gray-600 text-lg leading-relaxed font-medium">
                        {lesson.summary || lesson.description || "No description provided."}
                    </p>
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
                                <a key={i} href={file.url} target="_blank" className="flex items-center justify-between p-5 bg-gray-50 rounded-3xl border border-transparent hover:border-primary hover:bg-white transition-all group shadow-sm hover:shadow-xl hover:shadow-purple-900/5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-primary shadow-sm group-hover:scale-110 transition-transform duration-300">
                                            <Download size={24} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-black text-gray-900 truncate">{file.name}</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={18} className="text-gray-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                </a>
                            ))}
                            {lesson.links?.map((link: any, i: number) => {
                                let url = typeof link === 'string' ? link : link.url;
                                if (url && !url.startsWith('http')) url = `https://${url}`;
                                const title = typeof link === 'string' ? 'External Resource' : (link.title || 'External Resource');
                                return (
                                    <a key={i} href={url} target="_blank" className="flex items-center justify-between p-5 bg-gray-50 rounded-3xl border border-transparent hover:border-primary hover:bg-white transition-all group shadow-sm hover:shadow-xl hover:shadow-purple-900/5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-blue-600 shadow-sm group-hover:scale-110 transition-transform duration-300">
                                                <ExternalLink size={24} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-black text-gray-900 truncate">{title}</p>
                                            </div>
                                        </div>
                                        <ChevronRight size={18} className="text-gray-300 group-hover:text-blue-600" />
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
                                        <div className="w-16 h-16 rounded-3xl bg-red-500/20 flex items-center justify-center text-red-500 border border-red-500/30 mx-auto">
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

    const renderContent = () => {
        if (!selectedItem) return null;

        switch (selectedItem.type) {
            case 'live-class':
            case 'live_class':
                return renderLiveClass(selectedItem);
            case 'quiz':
                return <StudentQuizView
                    quiz={selectedItem}
                    courseId={course.id}
                    cohortId={cohortId}
                    onComplete={(score, passed) => {
                        if (passed) toggleComplete(selectedItem.id, false);
                    }}
                />;
            case 'assignment':
                return <StudentAssignmentView
                    assignment={selectedItem}
                    courseId={course.id}
                    cohortId={cohortId}
                    onComplete={() => toggleComplete(selectedItem.id, false)}
                />;
            default:
                return renderLesson(selectedItem);
        }
    };

    return (
        <DashboardLayout hideSidebar={true} hideHeader={true}>
            <div className="flex h-screen overflow-hidden bg-white">
                {/* Left Sidebar */}
                <div className="w-96 border-r border-gray-100 flex flex-col bg-gray-50/20 sticky top-0 h-screen overflow-hidden">
                    <div className="p-8 border-b border-gray-100 bg-white space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Learning Portal</span>
                                <h2 className="font-black text-gray-900 text-xl tracking-tight">Curriculum</h2>
                            </div>
                            <Link href={exitHref || `/student/courses/${course.id}`} className="w-10 h-10 rounded-2xl bg-gray-50 hover:bg-rose-50 text-gray-400 hover:text-rose-500 flex items-center justify-center transition-all group">
                                <XIcon size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                            </Link>
                        </div>
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                            <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent focus:bg-white rounded-[1.5rem] text-sm font-bold outline-none" />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {course.curriculum?.map((module: any, idx: number) => (
                            <div key={module.id} className="space-y-2">
                                <button onClick={() => toggleModule(module.id)} className={`w-full flex items-center justify-between p-4 rounded-3xl transition-all ${expandedModules.has(module.id) ? 'bg-white shadow-xl' : 'hover:bg-white'}`}>
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center text-xs font-black ${expandedModules.has(module.id) ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'}`}>{(idx + 1).toString().padStart(2, '0')}</div>
                                        <span className="text-sm font-black text-gray-900 truncate">{module.title}</span>
                                    </div>
                                    {expandedModules.has(module.id) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </button>
                                {expandedModules.has(module.id) && (
                                    <div className="pl-4 space-y-2 border-l border-gray-100 ml-5 pt-2">
                                        {module.items?.filter((i: any) => i.title.toLowerCase().includes(searchTerm.toLowerCase())).map((item: any) => (
                                            <button key={item.id} onClick={() => setSelectedItem(item)} className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${selectedItem?.id === item.id ? 'bg-primary text-white shadow-xl' : 'hover:bg-white text-gray-600'}`}>
                                                <div className="flex items-center gap-3 min-w-0">
                                                    {getItemIcon(item.type)}
                                                    <span className="text-xs font-black truncate">{item.title}</span>
                                                </div>
                                                {completedItems.has(item.id) && <CheckCircle2 size={16} className="text-emerald-500" />}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col min-w-0 bg-white">
                    {selectedItem ? renderContent() : <div className="flex-1 flex items-center justify-center">Select a lesson</div>}
                </div>
            </div>
        </DashboardLayout>
    );
}

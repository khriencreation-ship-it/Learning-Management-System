'use client';

import { Calendar, Clock, Video, FileText, CheckSquare, Play, ChevronRight, List } from 'lucide-react';
import Link from 'next/link';

interface ScheduleItem {
    id: string;
    title: string;
    type: string;
    date: string;
    time: string;
    courseId: string;
    courseTitle: string;
}

interface WeeklyScheduleProps {
    items: ScheduleItem[];
}

export default function WeeklySchedule({ items }: WeeklyScheduleProps) {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    // Group items by day
    const groupedItems = items.reduce((acc: any, item) => {
        const date = new Date(item.date);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
        if (!acc[dayName]) acc[dayName] = [];
        acc[dayName].push(item);
        return acc;
    }, {});

    const getItemIcon = (type: string) => {
        switch (type) {
            case 'quiz': return <CheckSquare size={18} className="text-emerald-500" />;
            case 'assignment': return <FileText size={18} className="text-orange-500" />;
            case 'live-class':
            case 'live_class': return <Video size={18} className="text-purple-500" />;
            default: return <Play size={18} className="text-blue-500" />;
        }
    };

    if (items.length === 0) {
        return (
            <div className="bg-white rounded-[2.5rem] border border-gray-100 p-10 text-center space-y-4 shadow-sm">
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto text-gray-300">
                    <Calendar size={32} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900">No scheduled content this week</h3>
                    <p className="text-sm text-gray-500">You're all caught up! Check back later for new updates.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-xl shadow-gray-200/50 flex flex-col w-full max-w-full">
            <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gradient-to-r from-white to-gray-50/50">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                        <Calendar size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-gray-900">Schedule for the Week</h2>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">Academic Calendar</p>
                    </div>
                </div>
                <span className="px-4 py-1.5 bg-gray-100 rounded-full text-[10px] font-black text-gray-500 uppercase tracking-widest">
                    {items.length} Activities
                </span>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar max-h-[600px]">
                <div className="divide-y divide-gray-50">
                    {days.map((day) => {
                        const dayItems = groupedItems[day];
                        if (!dayItems) return null;

                        return (
                            <div key={day} className="p-4 md:p-8 space-y-4">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-tighter">{day}</h3>
                                    <div className="h-px flex-1 bg-gray-100" />
                                </div>
                                
                                <div className="grid gap-3 w-full overflow-hidden">
                                    {dayItems.map((item: any) => (
                                        <Link 
                                            key={item.id} 
                                            href={`/student/courses/${item.courseId}/classroom?itemId=${item.id}`}
                                            className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 bg-gray-50/50 rounded-3xl border border-transparent hover:border-primary/20 hover:bg-white hover:shadow-xl hover:shadow-purple-900/5 transition-all gap-4 w-full min-w-0 overflow-hidden"
                                        >
                                            <div className="flex items-center gap-4 min-w-0">
                                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                                                    {getItemIcon(item.type)}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-black text-gray-900 truncate group-hover:text-primary transition-colors">
                                                        {item.title}
                                                    </p>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5 truncate">
                                                        {item.courseTitle}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between sm:justify-end gap-4 text-gray-400 group-hover:text-primary/60 transition-colors">
                                                {/* Lesson: Show Duration */}
                                                {item.type === 'lesson' && item.duration && (
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock size={14} />
                                                        <span className="text-xs font-bold uppercase tracking-wider">{item.duration}</span>
                                                    </div>
                                                )}

                                                {/* Quiz: Show Question Count */}
                                                {(item.type === 'quiz' || item.type === 'quizzes') && item.questionsCount > 0 && (
                                                    <div className="flex items-center gap-1.5">
                                                        <List size={14} />
                                                        <span className="text-xs font-bold uppercase tracking-wider">{item.questionsCount} Questions</span>
                                                    </div>
                                                )}

                                                {/* Live Class: Show Time */}
                                                {(item.type === 'live-class' || item.type === 'live_class') && (
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock size={14} />
                                                        <span className="text-xs font-bold uppercase tracking-wider">{item.time}</span>
                                                    </div>
                                                )}

                                                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                            </div>
                                            

                                        </Link>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            
            <div className="p-6 bg-gray-50/30 border-t border-gray-50">
                <p className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Times are displayed in your local timezone
                </p>
            </div>
        </div>
    );
}

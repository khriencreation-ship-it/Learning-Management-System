import { useState } from 'react';
import { ChevronDown, ChevronUp, PlayCircle, FileText, CheckCircle, Clock, Video } from 'lucide-react';

interface ModuleItem {
    id: string;
    title: string;
    type: 'lesson' | 'quiz' | 'assignment' | 'live-class';
    duration?: number;
    summary?: string;
}

interface Module {
    id: string;
    title: string;
    summary?: string;
    items: ModuleItem[];
}

interface CurriculumModuleProps {
    module: Module;
    index: number;
    courseId?: string;
    isTutor?: boolean;
    isAdmin?: boolean;
}


import Link from 'next/link';

export default function CurriculumModule({ module, index, courseId, isTutor, isAdmin }: CurriculumModuleProps) {
    const [isOpen, setIsOpen] = useState(false);


    const toggleOpen = () => setIsOpen(!isOpen);

    const getItemIcon = (type: string) => {
        switch (type) {
            case 'quiz':
                return <CheckCircle size={15} className="text-emerald-500" />;
            case 'assignment':
                return <FileText size={15} className="text-orange-500" />;
            case 'live-class':
                return <Video size={15} className="text-purple-500" />;
            default: // lesson
                return <PlayCircle size={15} className="text-blue-500" />;
        }
    };

    const getItemTypeLabel = (type: string) => {
        switch (type) {
            case 'quiz': return 'Quiz';
            case 'assignment': return 'Assignment';
            case 'live-class': return 'Live Class';
            default: return 'Lesson';
        }
    };

    return (
        <div className="border border-gray-200 rounded-xl bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            {/* Module Header */}
            <div
                onClick={toggleOpen}
                className="flex items-center justify-between p-2.5 cursor-pointer bg-gray-50/50 hover:bg-gray-50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-md bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-[10px]">
                        {index}
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-900">{module.title}</h3>
                        {module.summary && (
                            <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{module.summary}</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                        <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                            {module.items?.length || 0} Items
                        </span>
                    </div>
                    <button className="text-gray-400">
                        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                </div>
            </div>

            {/* Module Items */}
            {isOpen && (
                <div className="border-t border-gray-100 divide-y divide-gray-100">
                    {module.items && module.items.length > 0 ? (
                        module.items.map((item) => (
                            <div key={item.id} className="p-2 pl-12 hover:bg-gray-50 transition-colors flex items-center justify-between group">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-1 rounded-full bg-gray-100 group-hover:bg-white transition-colors">
                                        {getItemIcon(item.type)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-xs font-semibold text-gray-700">{item.title}</p>
                                            {item.type !== 'lesson' && (
                                                <span className="text-[9px] px-1 py-0.5 rounded bg-gray-100 text-gray-500 uppercase font-bold tracking-tight">
                                                    {getItemTypeLabel(item.type)}
                                                </span>
                                            )}
                                        </div>
                                        {item.summary && (
                                            <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{item.summary}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    {(isTutor || isAdmin) && courseId && item.type === 'assignment' && (
                                        <Link
                                            href={isTutor ? `/tutor/courses/${courseId}/submissions/${item.id}` : `/admin/courses/${courseId}/submissions/${item.id}`}
                                            className="px-3 py-1 bg-orange-50 text-orange-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-orange-100 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all shadow-sm"
                                        >
                                            View Submissions
                                        </Link>
                                    )}
                                    {item.duration && (
                                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                            <Clock size={14} />
                                            <span>{item.duration}m</span>
                                        </div>
                                    )}
                                </div>

                            </div>
                        ))
                    ) : (
                        <div className="p-6 text-center text-sm text-gray-400 italic">
                            No content in this module yet.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

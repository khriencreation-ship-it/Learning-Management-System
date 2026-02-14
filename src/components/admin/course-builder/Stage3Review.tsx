"use client";

import { CheckCircle, BookOpen, Clock, FileText, Video, PlayCircle } from 'lucide-react';

interface Stage3ReviewProps {
    courseData: any;
}

export default function Stage3Review({ courseData }: Stage3ReviewProps) {
    const { topics } = courseData;

    const totalModules = topics.length;
    const totalItems = topics.reduce((acc: number, topic: any) => acc + (topic.lessons?.length || 0), 0);

    // Calculate estimated duration (assuming duration property exists on lessons)
    const totalDuration = topics.reduce((acc: number, topic: any) => {
        return acc + (topic.lessons?.reduce((tAcc: number, item: any) => tAcc + (item.duration || 0), 0) || 0);
    }, 0);

    return (
        <div className="space-y-8">
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={32} className="text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Ready to Save?</h3>
                <p className="text-gray-600 mt-2 max-w-md mx-auto">
                    You have built a curriculum with the following structure. Review it below before saving changes to the database.
                </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
                    <BookOpen size={24} className="mx-auto text-blue-500 mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{totalModules}</p>
                    <p className="text-xs text-gray-500 font-semibold uppercase">Modules</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
                    <FileText size={24} className="mx-auto text-purple-500 mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
                    <p className="text-xs text-gray-500 font-semibold uppercase">Total Items</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
                    <Clock size={24} className="mx-auto text-orange-500 mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{totalDuration}m</p>
                    <p className="text-xs text-gray-500 font-semibold uppercase">Est. Duration</p>
                </div>
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <h4 className="font-bold text-gray-800 text-sm">Curriculum Preview</h4>
                </div>
                <div className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto bg-white">
                    {topics.map((topic: any, i: number) => (
                        <div key={i} className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="w-6 h-6 rounded bg-gray-100 text-gray-600 text-xs font-bold flex items-center justify-center">
                                    {i + 1}
                                </span>
                                <h5 className="font-semibold text-gray-900 text-sm">{topic.title}</h5>
                                <span className="text-xs text-gray-400">({topic.lessons?.length || 0} items)</span>
                            </div>
                            <div className="pl-8 space-y-1">
                                {topic.lessons?.map((item: any, j: number) => (
                                    <div key={j} className="flex items-center gap-2 text-xs text-gray-600">
                                        {item.type === 'quiz' ? <CheckCircle size={12} className="text-emerald-500" /> : <PlayCircle size={12} className="text-blue-400" />}
                                        <span className="truncate">{item.type === 'quiz' ? item.title : item.name || item.title}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                    {topics.length === 0 && (
                        <div className="p-8 text-center text-gray-400 text-sm">
                            No topics added yet.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

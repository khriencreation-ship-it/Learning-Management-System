'use client';

import { useState } from 'react';
import { Sparkles, Image as ImageIcon, ArrowRight, Trophy, Zap, Star } from 'lucide-react';
import AdmissionFlyerGenerator from './AdmissionFlyerGenerator';

interface ActivitiesAndChallengesProps {
    userName: string;
    courseName: string;
}

export default function ActivitiesAndChallenges({ userName, courseName }: ActivitiesAndChallengesProps) {
    const [isFlyerModalOpen, setIsFlyerModalOpen] = useState(false);

    return (
        <div className="mb-10">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-amber-100 text-amber-600 rounded-2xl shadow-sm">
                        <Trophy size={22} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-gray-900 tracking-tight">Activities & Challenges</h2>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-0.5">Boost your presence & progress</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Admission Flyer Challenge */}
                <div className="group relative bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Sparkles size={100} className="text-primary rotate-12" />
                    </div>
                    
                    <div className="relative z-10 flex flex-col h-full">
                        <div className="flex items-start justify-between mb-6">
                            <div className="p-4 bg-primary/10 text-primary rounded-2xl group-hover:scale-110 transition-transform duration-500">
                                <ImageIcon size={32} />
                            </div>
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-lg border border-emerald-100">
                                Featured
                            </span>
                        </div>

                        <div className="mb-8">
                            <h3 className="text-2xl font-black text-gray-900 leading-tight mb-2">
                                Admission <span className="text-primary">Flyer</span>
                            </h3>
                            <p className="text-gray-500 text-sm font-medium leading-relaxed">
                                Create your official admission poster for <span className="font-bold text-gray-800">{courseName}</span> and share it on social media.
                            </p>
                        </div>

                        <button
                            onClick={() => setIsFlyerModalOpen(true)}
                            className="mt-auto group/btn flex items-center justify-center gap-2 w-full py-4 bg-gray-900 text-white font-black rounded-2xl hover:bg-primary transition-all duration-300"
                        >
                            Generate Now
                            <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>

            {isFlyerModalOpen && (
                <AdmissionFlyerGenerator 
                    userName={userName}
                    courseName={courseName}
                    onClose={() => setIsFlyerModalOpen(false)}
                />
            )}
        </div>
    );
}

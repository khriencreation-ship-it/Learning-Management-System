'use client';

import { Radio } from 'lucide-react';

interface RecentBroadcastsProps {
    broadcasts?: any[];
}

export default function RecentBroadcasts({ broadcasts = [] }: RecentBroadcastsProps) {

    return (
        <div className="bg-white p-6 rounded-[30px] shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-50 rounded-xl text-primary">
                        <Radio size={20} />
                    </div>
                    <h3 className="font-bold text-gray-900">Recent Broadcasts</h3>
                </div>
                <button className="text-sm font-semibold text-primary hover:text-purple-700 transition-colors">
                    View All
                </button>
            </div>

            <div className="space-y-4">
                {broadcasts.length > 0 ? (
                    broadcasts.map((item) => (
                        <div key={item.id} className="p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-100 group cursor-pointer">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex flex-col gap-1 flex-1">
                                    <h4 className="font-semibold text-gray-900 group-hover:text-primary transition-colors line-clamp-1">{item.title}</h4>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${item.sender_role === 'admin'
                                            ? 'bg-red-50 text-red-600 border-red-100'
                                            : 'bg-primary/5 text-primary border-primary/10'
                                            }`}>
                                            {item.sender_role === 'admin' ? 'Admin' : 'Tutor'}
                                        </span>
                                        <span className="text-[10px] font-medium text-gray-400 whitespace-nowrap">{item.date}</span>
                                    </div>
                                </div>
                            </div>
                            <p className="text-sm text-gray-500 line-clamp-2">{item.message}</p>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-100">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3 text-gray-400">
                            <Radio size={20} />
                        </div>
                        <p className="text-sm font-medium text-gray-900">No broadcasts yet</p>
                        <p className="text-xs text-gray-500 mt-1 max-w-[200px]">
                            Important announcements will appear here.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

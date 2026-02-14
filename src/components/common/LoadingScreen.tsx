'use client';

import React from 'react';

export default function LoadingScreen() {
    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/80 backdrop-blur-md">
            <div className="relative">
                {/* Main animated ring */}
                <div className="w-20 h-20 rounded-full border-4 border-gray-100 border-t-primary animate-spin shadow-xl shadow-primary/10"></div>

                {/* Pulsing center icon/dot */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 bg-primary rounded-2xl animate-pulse shadow-lg shadow-primary/40"></div>
                </div>

                {/* Outer floating glow */}
                <div className="absolute -inset-4 bg-primary/20 blur-[40px] rounded-full animate-pulse"></div>
            </div>

            <div className="mt-10 flex flex-col items-center space-y-2">
                <h3 className="text-xl font-black text-gray-900 tracking-tight">KHRIEN LMS</h3>
                <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></span>
                </div>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] pl-[0.3em]">Preparing Dashboard</p>
            </div>
        </div>
    );
}

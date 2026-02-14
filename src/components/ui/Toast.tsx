'use client';

import { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
    message: string;
    type: ToastType;
    duration?: number;
    onClose: () => void;
}

export default function Toast({ message, type, duration = 5000, onClose }: ToastProps) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onClose, 300); // Wait for animation to complete
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const typeStyles = {
        success: 'bg-green-500 border-green-600',
        error: 'bg-red-500 border-red-600',
        info: 'bg-blue-500 border-blue-600',
        warning: 'bg-yellow-500 border-yellow-600',
    };

    const icons = {
        success: '✅',
        error: '❌',
        info: 'ℹ️',
        warning: '⚠️',
    };

    return (
        <div
            className={`fixed top-4 right-4 z-50 transition-all duration-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
                }`}
        >
            <div
                className={`${typeStyles[type]} text-white px-6 py-4 rounded-lg shadow-lg border-l-4 flex items-center gap-3 min-w-[300px] max-w-md`}
            >
                <span className="text-2xl">{icons[type]}</span>
                <p className="flex-1 font-medium">{message}</p>
                <button
                    onClick={() => {
                        setIsVisible(false);
                        setTimeout(onClose, 300);
                    }}
                    className="text-white hover:text-gray-200 transition-colors"
                >
                    ✕
                </button>
            </div>
        </div>
    );
}

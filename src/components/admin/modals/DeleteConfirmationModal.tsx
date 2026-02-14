"use client";

import { X, AlertTriangle } from 'lucide-react';

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    itemType?: string;
}

export default function DeleteConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message
}: DeleteConfirmationModalProps) {

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="relative bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl scale-100 transition-transform">
                <button
                    onClick={onClose}
                    className="absolute right-5 top-5 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="flex flex-col items-center text-center">
                    <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-4">
                        <AlertTriangle size={28} />
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
                    <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                        {message}
                    </p>

                    <div className="flex gap-3 w-full">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-lg shadow-red-200"
                        >
                            Remove
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

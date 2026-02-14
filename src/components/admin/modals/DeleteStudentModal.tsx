"use client";

import { X, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

interface DeleteStudentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    student: {
        id: string;
        name: string;
    } | null;
}

export default function DeleteStudentModal({ isOpen, onClose, onSuccess, student }: DeleteStudentModalProps) {
    const [confirmName, setConfirmName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDelete = async () => {
        if (!student) return;

        if (confirmName !== student.name.toUpperCase()) {
            setError('Please type the student full name correctly in CAPITAL letters');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`/api/admin/users?id=${encodeURIComponent(student.id)}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                const data = await res.json();
                console.error('Delete API Error:', data);
                const detailedError = data.details
                    ? `${data.error} (Details: ${data.details})`
                    : (data.error || data.message || `Error ${res.status}`);
                throw new Error(detailedError);
            }

            onSuccess();
            onClose();
            setConfirmName('');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !student) return null;

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className="relative bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl overflow-hidden">
                {/* Danger Pattern Header */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-500 via-orange-500 to-red-500" />

                <button
                    onClick={onClose}
                    className="absolute right-6 top-6 text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-50 rounded-xl transition-all"
                >
                    <X size={20} />
                </button>

                <div className="flex flex-col items-center text-center mt-4">
                    <div className="w-20 h-20 rounded-[2rem] bg-red-50 text-red-600 flex items-center justify-center mb-6 shadow-sm shadow-red-100">
                        <AlertTriangle size={40} className="animate-pulse" />
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Delete Student?</h2>
                    <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                        This action is <span className="text-red-600 font-bold italic">permanent</span>. All data associated with <span className="text-gray-900 font-bold">{student.name}</span> will be removed from the system.
                    </p>

                    <div className="w-full space-y-4 mb-8">
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-left">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Verification Required</p>
                            <p className="text-xs text-gray-600 mb-3">
                                To confirm, please type <span className="font-mono font-bold text-gray-900">{student.name.toUpperCase()}</span> below:
                            </p>
                            <input
                                type="text"
                                placeholder="TYPE NAME IN CAPS"
                                value={confirmName}
                                onChange={(e) => {
                                    setConfirmName(e.target.value);
                                    if (error) setError(null);
                                }}
                                className={`w-full px-4 py-3 rounded-xl border ${error ? 'border-red-500 focus:ring-red-100' : 'border-gray-200 focus:border-red-500 focus:ring-red-50'} focus:outline-none focus:ring-4 transition-all font-mono font-bold text-sm tracking-widest text-center uppercase placeholder:lowercase placeholder:font-sans placeholder:tracking-normal placeholder:font-normal`}
                            />
                        </div>

                        {error && (
                            <p className="text-xs font-bold text-red-500 flex items-center justify-center gap-1.5">
                                <AlertTriangle size={14} />
                                {error}
                            </p>
                        )}
                    </div>

                    <div className="flex w-full gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-6 py-4 rounded-2xl font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 transition-all border border-gray-100"
                        >
                            Back
                        </button>
                        <button
                            disabled={loading || confirmName !== student.name.toUpperCase()}
                            onClick={handleDelete}
                            className="flex-[1.5] px-6 py-4 rounded-2xl font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-red-200 transition-all"
                        >
                            {loading ? 'Deleting...' : 'Delete Permanently'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

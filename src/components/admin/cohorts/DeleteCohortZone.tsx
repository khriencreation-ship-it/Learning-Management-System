"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/ui/Toast';

interface DeleteCohortZoneProps {
    cohort: {
        id: string;
        name: string;
    };
}

export default function DeleteCohortZone({ cohort }: DeleteCohortZoneProps) {
    const router = useRouter();
    const { toasts, removeToast, success, error } = useToast();

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleDeleteCohort = async () => {
        if (deleteConfirmation !== cohort.name.toUpperCase()) {
            error("Cohort name doesn't match!");
            return;
        }

        setIsDeleting(true);
        try {
            const response = await fetch(`/api/admin/cohorts/${cohort.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Failed to delete cohort');

            success('Cohort deleted successfully!');
            router.push('/admin/cohorts');
            router.refresh();
        } catch (err: any) {
            console.error('Error deleting cohort:', err);
            error(err.message || 'Failed to delete cohort');
            setIsDeleting(false);
        }
    };

    return (
        <>
            {/* Toast notifications */}
            {toasts.map((toast) => (
                <Toast
                    key={toast.id}
                    message={toast.message}
                    type={toast.type}
                    onClose={() => removeToast(toast.id)}
                />
            ))}

            <button
                onClick={() => setIsDeleteDialogOpen(true)}
                className="px-6 py-3 bg-red-600/10 text-red-500 border border-red-600/20 hover:bg-red-600/20 rounded-xl backdrop-blur-md font-bold transition-all shadow-lg flex items-center gap-2"
                title="Delete Cohort"
            >
                <Trash2 size={18} />
                <span className="hidden sm:inline">Delete</span>
            </button>

            {/* Delete Confirmation Modal */}
            {mounted && isDeleteDialogOpen && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        onClick={() => !isDeleting && setIsDeleteDialogOpen(false)}
                    />
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-8">
                            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 mb-6">
                                <AlertTriangle size={36} />
                            </div>

                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Delete this cohort?</h3>
                            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                                This action is permanent. To proceed, please type the cohort name <span className="font-bold text-gray-900">"{cohort.name.toUpperCase()}"</span> in the box below.
                            </p>

                            <div className="space-y-4">
                                <input
                                    type="text"
                                    value={deleteConfirmation}
                                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                                    placeholder="Type cohort name in CAPS"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm font-medium transition-all text-gray-900"
                                    disabled={isDeleting}
                                />

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setIsDeleteDialogOpen(false)}
                                        disabled={isDeleting}
                                        className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleDeleteCohort}
                                        disabled={isDeleting || deleteConfirmation !== cohort.name.toUpperCase()}
                                        className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                                    >
                                        {isDeleting ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <Trash2 size={18} />
                                                Delete
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}

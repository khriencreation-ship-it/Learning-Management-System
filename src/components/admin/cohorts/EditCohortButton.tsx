"use client";

import { useState } from 'react';
import { Pencil } from 'lucide-react';
import EditCohortModal from './EditCohortModal';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/ui/Toast';

interface EditCohortButtonProps {
    cohort: {
        _id: string;
        name: string;
        batch: string;
        startDate: string;
        endDate: string;
        description?: string;
        image?: string;
    };
    className?: string; // Allow custom styling
}

export default function EditCohortButton({ cohort, className }: EditCohortButtonProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { toasts, removeToast, success } = useToast();

    // Prepare data
    const modalData = {
        id: cohort._id,
        name: cohort.name,
        batch: cohort.batch,
        startDate: cohort.startDate,
        endDate: cohort.endDate,
        description: cohort.description || '',
        image: cohort.image || '',
    };

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className={`flex items-center gap-2 transition-all ${className || 'p-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 hover:text-gray-900'}`}
                title="Edit Cohort"
            >
                <Pencil size={18} />
                <span className="font-semibold">Edit Cohort</span>
            </button>

            <EditCohortModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => success('Cohort updated successfully!')}
                initialData={modalData}
            />

            {/* Render Toasts */}
            {toasts.map((toast) => (
                <Toast
                    key={toast.id}
                    message={toast.message}
                    type={toast.type}
                    onClose={() => removeToast(toast.id)}
                />
            ))}
        </>
    );
}

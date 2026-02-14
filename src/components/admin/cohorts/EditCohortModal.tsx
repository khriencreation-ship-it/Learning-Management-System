"use client";

import { X, Camera, Image as ImageIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import MediaPickerModal from '../media/MediaPickerModal';

interface EditCohortModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    initialData: {
        id: string;
        name: string;
        batch: string;
        startDate: string;
        endDate: string;
        description?: string;
        image?: string;
    };
}

export default function EditCohortModal({ isOpen, onClose, onSuccess, initialData }: EditCohortModalProps) {
    const router = useRouter();
    const [name, setName] = useState('');
    const [batch, setBatch] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);
    const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Populate form when modal opens or initialData changes
    useEffect(() => {
        if (isOpen && initialData) {
            setName(initialData.name);
            setBatch(initialData.batch);
            setDescription(initialData.description || '');
            setImageUrl(initialData.image || null);

            // Format dates to YYYY-MM-DD for input[type="date"]
            if (initialData.startDate) {
                setStartDate(new Date(initialData.startDate).toISOString().split('T')[0]);
            }
            if (initialData.endDate) {
                setEndDate(new Date(initialData.endDate).toISOString().split('T')[0]);
            }
        }
    }, [isOpen, initialData]);



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // 2. Update cohort (Upload handled by Media Library)
            const res = await fetch(`/api/admin/cohorts/${initialData.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    batch,
                    description,
                    startDate,
                    endDate,
                    image: imageUrl
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to update cohort');
            }

            // Success
            if (onSuccess) {
                onSuccess();
            }
            onClose();
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!mounted || !isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative bg-white rounded-3xl w-full max-w-md p-7 shadow-2xl scale-100 transition-transform max-h-[90vh] overflow-y-auto custom-scrollbar">
                <button
                    onClick={onClose}
                    className="absolute right-6 top-6 text-gray-400 hover:text-gray-600 transition-colors z-10"
                >
                    <X size={24} />
                </button>

                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Edit Cohort</h2>
                    <p className="text-gray-500 mt-1 text-sm">Update cohort details.</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl">
                        {error}
                    </div>
                )}

                <form className="space-y-5" onSubmit={handleSubmit}>
                    {/* Image Upload */}
                    <div className="space-y-4">
                        <label className="text-sm font-semibold text-gray-900">Cohort Cover Image</label>
                        <div
                            onClick={() => setIsMediaPickerOpen(true)}
                            className="aspect-video w-full rounded-2xl border-2 border-dashed border-gray-200 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer overflow-hidden relative group"
                        >
                            {imageUrl ? (
                                <Image
                                    src={imageUrl}
                                    alt="Preview"
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                                    <ImageIcon size={32} className="mb-2" />
                                    <span className="text-xs font-medium">Select from Media Library</span>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-white text-xs font-bold px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-lg">Change Image</span>
                            </div>
                        </div>
                    </div>

                    {/* Cohort Name */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-900">Cohort Name</label>
                        <input
                            type="text"
                            placeholder="e.g. Full Stack Web Development"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-gray-900"
                        />
                    </div>

                    {/* Batch Name */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-900">Batch ID</label>
                        <input
                            type="text"
                            placeholder="e.g. Batch 1"
                            value={batch}
                            onChange={(e) => setBatch(e.target.value)}
                            required
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-gray-900"
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-900">Description</label>
                        <textarea
                            placeholder="Briefly describe what this cohort is about..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none text-gray-900"
                        />
                    </div>

                    {/* Duration / Dates */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-900">Start Date</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                required
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-gray-600"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-900">End Date</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                required
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-gray-600"
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 rounded-xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-3 rounded-xl font-semibold text-white bg-primary hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>

            <MediaPickerModal
                isOpen={isMediaPickerOpen}
                onClose={() => setIsMediaPickerOpen(false)}
                onSelect={(file) => setImageUrl(file.url)}
            />
        </div>,
        document.body
    );
}


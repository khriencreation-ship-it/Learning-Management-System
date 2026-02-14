"use client";

import { X, Image as ImageIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MediaPickerModal from '../media/MediaPickerModal';

interface CreateCourseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function CreateCourseModal({ isOpen, onClose, onSuccess }: CreateCourseModalProps) {
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [tutors, setTutors] = useState<any[]>([]);
    const [selectedTutor, setSelectedTutor] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

    // Fetch Tutors
    useEffect(() => {
        if (isOpen) {
            fetch('/api/admin/tutors')
                .then(res => res.json())
                .then(data => setTutors(data))
                .catch(err => console.error('Failed to fetch tutors', err));
        }
    }, [isOpen]);



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Create course (image handled by Media Library)
            const res = await fetch('/api/admin/courses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    description,
                    instructor: selectedTutor,
                    image: imageUrl
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to create course');
            }

            // Success
            if (onSuccess) onSuccess();
            onClose();

            // Reset form
            // Reset form
            setTitle('');
            setDescription('');
            setImageUrl('');
            setSelectedTutor('');

            router.refresh();
        } catch (err: any) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="relative bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl scale-100 transition-transform max-h-[90vh] overflow-y-auto">
                <button
                    onClick={onClose}
                    className="absolute right-6 top-6 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X size={24} />
                </button>

                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Create New Course</h2>
                    <p className="text-gray-500 mt-1 text-sm">Add a new course to the curriculum.</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl">
                        {error}
                    </div>
                )}

                <form className="space-y-5" onSubmit={handleSubmit}>
                    {/* Image Upload */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-900">Course Image</label>
                        <div
                            className="aspect-video border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors relative overflow-hidden group"
                            onClick={() => setIsMediaPickerOpen(true)}
                        >
                            {imageUrl ? (
                                <img src={imageUrl} alt="Preview" className="w-full h-full object-cover rounded-xl" />
                            ) : (
                                <div className="text-gray-400 py-4 flex flex-col items-center">
                                    <ImageIcon size={32} className="mb-2" />
                                    <p className="text-sm font-medium">Select from Media Library</p>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-white text-xs font-bold px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-lg">Change Image</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-900">Course Title</label>
                        <input
                            type="text"
                            placeholder="e.g. Advanced React Patterns"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-900">Description</label>
                        <textarea
                            placeholder="Brief description of the course..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                        />
                    </div>

                    {/* Tutor Dropdown */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-900">Assign Tutor</label>
                        <select
                            value={selectedTutor}
                            onChange={(e) => setSelectedTutor(e.target.value)}
                            required
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white appearance-none"
                        >
                            <option value="" disabled>Select a tutor...</option>
                            {tutors.map((t: any) => (
                                <option key={t.id} value={t.name}>{t.name}</option>
                            ))}
                        </select>
                    </div>

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
                            {loading ? 'Creating...' : 'Create Course'}
                        </button>
                    </div>
                </form>
            </div>


            <MediaPickerModal
                isOpen={isMediaPickerOpen}
                onClose={() => setIsMediaPickerOpen(false)}
                onSelect={(file) => setImageUrl(file.url)}
            />
        </div>
    );
}

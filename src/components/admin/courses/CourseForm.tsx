"use client";

import { useState, useEffect } from 'react';
import { ArrowLeft, Users, Layers, Plus, Trash2, Image as ImageIcon, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from '@/hooks/useToast';
import RichTextEditor from '@/components/ui/RichTextEditor';
import MediaPickerModal from '../media/MediaPickerModal';
import AddCohortModal from '../cohorts/AddCohortModal';

interface CourseFormProps {
    initialData?: any;
    isEdit?: boolean;
    courseId?: string;
}

export default function CourseForm({ initialData, isEdit = false, courseId }: CourseFormProps) {
    const router = useRouter();
    const { success, error } = useToast();

    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        title: initialData?.title || '',
        description: initialData?.description || '',
        instructor: initialData?.instructor || '',
        image: initialData?.image || ''
    });

    const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
    const [tutors, setTutors] = useState<any[]>([]);

    // Student & Cohort State
    const [cohorts, setCohorts] = useState<any[]>([]);
    const [selectedCohorts, setSelectedCohorts] = useState<string[]>([]);

    const [isAddCohortOpen, setIsAddCohortOpen] = useState(false);

    // Fetch Initial Data
    useEffect(() => {
        // Tutors
        fetch('/api/admin/tutors')
            .then(res => res.json())
            .then(data => setTutors(data))
            .catch(err => console.error('Failed to fetch tutors', err));

        // Cohorts
        fetch('/api/admin/cohorts')
            .then(res => res.json())
            .then(data => setCohorts(data))
            .catch(err => console.error('Failed to fetch cohorts', err));

        if (initialData) {

            if (initialData.course_cohorts) {
                setSelectedCohorts(initialData.course_cohorts.map((c: any) => c.cohort_id));
            }
        }
    }, [initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const endpoint = isEdit ? `/api/admin/courses/${courseId}` : '/api/admin/courses';
            const method = isEdit ? 'PATCH' : 'POST';

            const response = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    ...formData,
                    cohorts: selectedCohorts
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || `Failed to ${isEdit ? 'update' : 'create'} course`);
            }

            success(`Course ${isEdit ? 'updated' : 'created'} successfully!`);

            if (!isEdit) {
                const newCourse = await response.json();
                router.push(`/admin/courses/${newCourse.id}`);
            } else {
                router.push(`/admin/courses/${courseId}`);
            }
            router.refresh();
        } catch (err: any) {
            console.error('Error saving course:', err);
            error(err.message || `Failed to ${isEdit ? 'save' : 'create'} course`);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-30 shadow-sm">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href={isEdit ? `/admin/courses/${courseId}` : '/admin/courses'}
                            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500"
                        >
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">{isEdit ? 'Edit Course' : 'Create New Course'}</h1>
                            <p className="text-xs text-gray-500">{isEdit ? 'Update course details and assignments' : 'Fill in the details to launch a new course'}</p>
                        </div>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className="flex items-center gap-2 bg-purple-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-purple-700 transition-all shadow-lg shadow-purple-200 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSaving ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Save size={18} />
                        )}
                        {isEdit ? 'Save Changes' : 'Create Course'}
                    </button>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-8">
                <form className="space-y-8" onSubmit={handleSubmit}>
                    {/* Basic Info Card */}
                    <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-gray-100 space-y-8">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <span className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center text-sm font-bold">01</span>
                                Basic Information
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 ml-1">Course Thumbnail</label>
                                        <div
                                            className="aspect-video border-2 border-dashed border-gray-200 rounded-3xl flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-all relative overflow-hidden group"
                                            onClick={() => setIsMediaPickerOpen(true)}
                                        >
                                            {formData.image ? (
                                                <Image src={formData.image} alt="Preview" fill className="object-cover" />
                                            ) : (
                                                <div className="text-gray-400 py-4 flex flex-col items-center">
                                                    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                                        <ImageIcon size={24} />
                                                    </div>
                                                    <p className="text-xs font-bold text-gray-500">Pick from Media Library</p>
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <span className="text-white text-xs font-bold px-4 py-2 bg-white/20 backdrop-blur-md rounded-xl">Change Image</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 ml-1">Assign Instructor</label>
                                        <div className="relative">
                                            <select
                                                value={formData.instructor}
                                                onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                                                required
                                                className="w-full px-5 py-4 rounded-2xl border border-gray-200 focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all bg-white appearance-none font-medium text-gray-700"
                                            >
                                                <option value="" disabled>Select an instructor...</option>
                                                {tutors.map((t: any) => (
                                                    <option key={t.id} value={t.name}>{t.name}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                <Plus size={18} className="rotate-45" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 ml-1">Course Title</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Master the Art of UX Design"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            required
                                            className="w-full px-5 py-4 rounded-2xl border border-gray-200 focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all font-bold text-gray-900 placeholder:text-gray-300 placeholder:font-medium"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 ml-1">Course Description</label>
                                        <RichTextEditor
                                            content={formData.description}
                                            onChange={(html) => setFormData({ ...formData, description: html })}
                                            placeholder="Enter a detailed course description..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Enrollment Section - Only visible in Edit mode */}
                    {isEdit && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Cohorts */}
                            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 flex flex-col h-[500px] col-span-1 md:col-span-2">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <Layers size={20} className="text-blue-600" />
                                        Assigned Cohorts
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={() => setIsAddCohortOpen(true)}
                                        className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                                    {selectedCohorts.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {cohorts
                                                .filter(c => selectedCohorts.includes(c.id))
                                                .map(cohort => (
                                                    <div key={cohort.id} className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between group transition-all hover:bg-blue-50/50">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                                                                {cohort.name.charAt(0)}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="font-bold text-gray-900 text-xs truncate">{cohort.name}</p>
                                                                <p className="text-[10px] text-gray-400 truncate">{cohort.batch}</p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedCohorts(prev => prev.filter(id => id !== cohort.id))}
                                                            className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                ))}
                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-center opacity-50 grayscale py-10">
                                            <Layers size={48} className="mb-4 text-gray-300" />
                                            <p className="text-sm font-bold text-gray-400">No cohorts assigned</p>
                                            <p className="text-xs text-gray-400 mt-1">Grant access to entire batches</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </form>
            </div>

            {/* Modals */}

            <AddCohortModal
                isOpen={isAddCohortOpen}
                onClose={() => setIsAddCohortOpen(false)}
                existingCohortIds={selectedCohorts}
                onAdd={(cohortIds) => {
                    setSelectedCohorts(prev => [...new Set([...prev, ...cohortIds])]);
                }}
            />
            <MediaPickerModal
                isOpen={isMediaPickerOpen}
                onClose={() => setIsMediaPickerOpen(false)}
                onSelect={(file) => setFormData({ ...formData, image: file.url })}
            />
        </div>
    );
}

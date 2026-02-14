"use client";

import { X, ArrowLeft, ChevronRight, Save, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Stage1Setup from './Stage1Setup';
import Stage2Content from './Stage2Content';
import Stage3Review from './Stage3Review';
import DashboardLayout from '../DashboardLayout';
import Link from 'next/link';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/ui/Toast';

interface CourseBuilderPageClientProps {
    courseId: string;
    courseTitle: string;
    initialData?: any[];
    courseSettings?: {
        image?: string;
        video?: string;
        description?: string;
        students?: string[];
        cohorts?: string[];
    };
}

export default function CourseBuilderPageClient({ courseId, courseTitle, initialData, courseSettings }: CourseBuilderPageClientProps) {
    const router = useRouter();
    const [currentStage, setCurrentStage] = useState(1);
    const totalStages = 3;

    // Stage 1 states
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoPreview, setVideoPreview] = useState('');
    const [coverImage, setCoverImage] = useState<File | null>(null);
    const [coverImagePreview, setCoverImagePreview] = useState('');
    const [loading, setLoading] = useState(false);
    const { toasts, removeToast, success, error } = useToast();

    // Stage 2 states - Topics and Lessons
    const [topics, setTopics] = useState<any[]>([]);

    useEffect(() => {
        // Load Stage 1 Data
        if (courseSettings) {
            if (courseSettings.image) setCoverImagePreview(courseSettings.image);
            if (courseSettings.video) setVideoPreview(courseSettings.video);
        }

        // Load Stage 2 Data (Curriculum)
        if (initialData) {
            const formattedTopics = initialData.map(module => ({
                ...module,
                lessons: module.module_items || module.items ? (module.module_items || module.items).map((item: any) => {
                    const meta = item.metadata || {};
                    return {
                        ...item,
                        ...meta,
                        id: item.id,
                        name: item.title,
                        description: item.summary,
                        videoPreview: item.video_url || meta.videoPreview,
                        links: meta.links || [],
                        files: meta.files || [],
                        type: item.type === 'live-class' ? 'live_class' : (item.type || 'lesson')
                    };
                }) : []
            }));
            setTopics(formattedTopics);
        }
    }, [initialData, courseSettings]);

    // Fetch students and cohorts


    const handleNext = () => {
        if (currentStage < totalStages) {
            setCurrentStage(currentStage + 1);
        }
    };

    const handleBack = () => {
        if (currentStage > 1) {
            setCurrentStage(currentStage - 1);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            // Helper to upload file to Supabase Storage
            const uploadFile = async (file: File) => {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                const { data, error } = await supabase.storage.from('courses').upload(fileName, file);

                if (error) {
                    console.error('Upload error:', error);
                    throw error;
                }

                const { data: { publicUrl } } = supabase.storage.from('courses').getPublicUrl(fileName);
                return publicUrl;
            };

            // 1. Process Course-level assets
            let finalVideoUrl = videoPreview;
            if (videoFile) {
                try {
                    finalVideoUrl = await uploadFile(videoFile);
                } catch (err) {
                    console.error("Failed to upload course video", err);
                    error("Failed to upload course video. Please try again.");
                    setLoading(false);
                    return;
                }
            }

            let finalImageUrl = coverImagePreview;
            if (coverImage) {
                try {
                    finalImageUrl = await uploadFile(coverImage);
                } catch (err) {
                    console.error("Failed to upload course image", err);
                    error("Failed to upload course image. Please try again.");
                    setLoading(false);
                    return;
                }
            }

            // 2. Process Lesson-level assets (Recursive Upload)
            const processedTopics = [...topics];
            for (let i = 0; i < processedTopics.length; i++) {
                const topic = processedTopics[i];
                if (topic.lessons && Array.isArray(topic.lessons)) {
                    for (let j = 0; j < topic.lessons.length; j++) {
                        const lesson = { ...topic.lessons[j] };

                        // Upload Lesson Video
                        if (lesson.video instanceof File) {
                            console.log(`Uploading video for lesson: ${lesson.name || lesson.title}`);
                            lesson.videoPreview = await uploadFile(lesson.video);
                            lesson.video_url = lesson.videoPreview; // Synchronize
                            lesson.video = null; // Clear file after upload
                        }

                        // Upload Lesson Cover
                        if (lesson.coverImage instanceof File) {
                            console.log(`Uploading cover for lesson: ${lesson.name || lesson.title}`);
                            lesson.coverPreview = await uploadFile(lesson.coverImage);
                            lesson.coverImage = null;
                        }

                        // Upload Lesson Files
                        if (lesson.files && Array.isArray(lesson.files)) {
                            const uploadedFiles = [];
                            for (let k = 0; k < lesson.files.length; k++) {
                                const f = lesson.files[k];
                                if (f instanceof File) {
                                    console.log(`Uploading file ${f.name} for lesson: ${lesson.name || lesson.title}`);
                                    const url = await uploadFile(f);
                                    uploadedFiles.push({ name: f.name, url, size: f.size, type: f.type });
                                } else {
                                    uploadedFiles.push(f); // Keep existing
                                }
                            }
                            lesson.files = uploadedFiles;
                        }

                        // Upload Assignment Attachments
                        if (lesson.attachments && Array.isArray(lesson.attachments)) {
                            const uploadedAttachments = [];
                            for (let k = 0; k < lesson.attachments.length; k++) {
                                const f = lesson.attachments[k];
                                if (f instanceof File) {
                                    console.log(`Uploading attachment ${f.name} for assignment: ${lesson.title}`);
                                    const url = await uploadFile(f);
                                    uploadedAttachments.push({ name: f.name, url, size: f.size, type: f.type });
                                } else {
                                    uploadedAttachments.push(f); // Keep existing
                                }
                            }
                            lesson.attachments = uploadedAttachments;
                        }

                        topic.lessons[j] = lesson;
                    }
                }
            }

            // 3. Transform to API format
            const modules = processedTopics.map((topic, index) => ({
                title: topic.title,
                summary: topic.summary || '',
                lessons: topic.lessons.map((lesson: any) => {
                    const baseItem = {
                        title: lesson.name || lesson.title,
                        type: lesson.type,
                        summary: lesson.description || lesson.summary || '',
                        ...lesson
                    };
                    if (lesson.type === 'live_class' || lesson.type === 'live-class') {
                        baseItem.type = 'live_class';
                    }
                    return baseItem;
                })
            }));

            const payload = {
                modules,
                courseSettings: {
                    image: finalImageUrl,
                    video: finalVideoUrl,
                    description: courseSettings?.description
                }
            };

            console.log('Sending Builder Payload:', payload);

            const response = await fetch(`/api/admin/courses/${courseId}/builder`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            console.log('Builder Save Response Status:', response.status);

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Builder Save Error Details:', errorData);
                throw new Error(errorData.error || 'Failed to save curriculum');
            }

            console.log('Builder Save Success!');
            success('Curriculum saved successfully!');
            router.push(`/admin/courses/${courseId}`);
            router.refresh();
        } catch (err: any) {
            console.error('Error in handleSave:', err);
            error(err.message || 'An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const progress = (currentStage / totalStages) * 100;

    return (
        <DashboardLayout>
            {/* Toast notifications */}
            {toasts.map((toast) => (
                <Toast
                    key={toast.id}
                    message={toast.message}
                    type={toast.type}
                    onClose={() => removeToast(toast.id)}
                />
            ))}
            <div className="relative min-h-[calc(100vh-80px)] bg-slate-50/50">
                {/* Fixed Top Navigation Bar */}
                <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-6">
                        <Link
                            href={`/admin/courses/${courseId}`}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                        >
                            <ArrowLeft size={24} />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 leading-none">Course Builder</h1>
                            <p className="text-sm text-gray-500 mt-1">{courseTitle}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href={`/admin/courses/${courseId}`}
                            className="px-5 py-2.5 rounded-xl font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                            Cancel
                        </Link>
                        {currentStage < totalStages ? (
                            <button
                                onClick={handleNext}
                                className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold flex items-center gap-2 hover:bg-purple-700 transition-all shadow-lg shadow-purple-200"
                            >
                                Next Step
                                <ChevronRight size={18} />
                            </button>
                        ) : (
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold flex items-center gap-2 hover:bg-purple-700 transition-all shadow-lg shadow-purple-200 disabled:opacity-70"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save size={18} />
                                        Complete & Save
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>

                <div className="max-w-5xl mx-auto px-6 py-10">
                    {/* Progress Indicator */}
                    <div className="mb-10">
                        <div className="flex justify-between items-end mb-4">
                            <div className="space-y-1">
                                <span className="text-xs font-bold text-primary uppercase tracking-wider">
                                    Step {currentStage} of {totalStages}
                                </span>
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {currentStage === 1 && "Initial Setup"}
                                    {currentStage === 2 && "Curriculum Content"}
                                    {currentStage === 3 && "Review & Publish"}
                                </h2>
                            </div>
                            <span className="text-sm font-bold text-gray-400">{Math.round(progress)}% Complete</span>
                        </div>
                        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500 ease-out"
                                style={{ width: `${progress}%` }}
                            />
                        </div>

                        {/* Step Labels */}
                        <div className="flex justify-between mt-6">
                            {[
                                { stage: 1, label: 'Setup', desc: 'Basic Info' },
                                { stage: 2, label: 'Content', desc: 'Curriculum' },
                                { stage: 3, label: 'Review', desc: 'Final Check' }
                            ].map((step) => (
                                <div key={step.stage} className="flex flex-col items-center gap-2 flex-1">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${currentStage > step.stage
                                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100'
                                        : currentStage === step.stage
                                            ? 'bg-primary text-white ring-4 ring-purple-100 shadow-lg shadow-purple-100'
                                            : 'bg-white text-gray-400 border border-gray-200'
                                        }`}>
                                        {currentStage > step.stage ? <Check size={16} /> : step.stage}
                                    </div>
                                    <div className="text-center">
                                        <p className={`text-xs font-bold ${currentStage >= step.stage ? 'text-gray-900' : 'text-gray-400'}`}>
                                            {step.label}
                                        </p>
                                        <p className="text-[10px] text-gray-400 font-medium hidden sm:block">{step.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Stage Content */}
                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl shadow-gray-200/40">
                        {currentStage === 1 && (
                            <Stage1Setup
                                videoFile={videoFile}
                                setVideoFile={setVideoFile}
                                videoPreview={videoPreview}
                                setVideoPreview={setVideoPreview}
                                coverImage={coverImage}
                                setCoverImage={setCoverImage}
                                coverImagePreview={coverImagePreview}
                                setCoverImagePreview={setCoverImagePreview}
                            />
                        )}

                        {currentStage === 2 && (
                            <Stage2Content
                                topics={topics}
                                setTopics={setTopics}
                            />
                        )}

                        {currentStage === 3 && (
                            <Stage3Review
                                courseData={{
                                    videoFile,
                                    coverImage,
                                    topics
                                }}
                            />
                        )}
                    </div>

                    {/* Footer Actions (Optional redundant but good UX) */}
                    <div className="mt-8 flex justify-between items-center opacity-70 hover:opacity-100 transition-opacity">
                        <button
                            onClick={handleBack}
                            disabled={currentStage === 1}
                            className="flex items-center gap-2 px-5 py-2.5 font-semibold text-gray-500 hover:text-gray-800 disabled:opacity-0 transition-all"
                        >
                            <ArrowLeft size={18} />
                            Previous Step
                        </button>
                        <p className="text-sm text-gray-400 font-medium italic">
                            Your progress is saved as you navigate through stages.
                        </p>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

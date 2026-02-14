"use client";

import { X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';
import Stage1Setup from '../course-builder/Stage1Setup';
import Stage2Content from '../course-builder/Stage2Content';
import Stage3Review from '../course-builder/Stage3Review';

interface CourseBuilderModalProps {
    isOpen: boolean;
    onClose: () => void;
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

export default function CourseBuilderModal({ isOpen, onClose, courseId, courseTitle, initialData, courseSettings }: CourseBuilderModalProps) {
    const [currentStage, setCurrentStage] = useState(1);
    const totalStages = 3;

    // Stage 1 states
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoPreview, setVideoPreview] = useState('');
    const [coverImage, setCoverImage] = useState<File | null>(null);
    const [coverImagePreview, setCoverImagePreview] = useState('');
    const [students, setStudents] = useState<any[]>([]);
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [cohorts, setCohorts] = useState<any[]>([]);
    const [selectedCohorts, setSelectedCohorts] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    // Stage 2 states - Topics and Lessons
    const [topics, setTopics] = useState<any[]>([]);

    useEffect(() => {
        if (isOpen) {
            // Load Stage 1 Data
            if (courseSettings) {
                if (courseSettings.image) setCoverImagePreview(courseSettings.image);
                if (courseSettings.video) setVideoPreview(courseSettings.video);
                if (courseSettings.students) setSelectedStudents(courseSettings.students);
                if (courseSettings.cohorts) setSelectedCohorts(courseSettings.cohorts);
            }

            // Load Stage 2 Data (Curriculum)
            if (initialData) {
                // Transform initialData (Supabase structure) to TopicManager structure if needed
                // Our Schema: course_modules[{ id, title, summary, items: module_items[{ id, title, type ... }] }]
                // TopicManager expects: { id, title, summary, lessons: [...] }
                const formattedTopics = initialData.map(module => ({
                    ...module,
                    lessons: module.module_items || module.items ? (module.module_items || module.items).map((item: any) => {
                        const meta = item.metadata || {};
                        return {
                            ...item,
                            ...meta, // Spread metadata first (so ID/Title aren't overwritten if collision, though unlikely)
                            id: item.id,
                            name: item.title, // Map title to name for LessonForm
                            description: item.summary, // Map summary to description for LessonForm
                            // Map specific metadata fields if they aren't at top level in DB but are in metadata
                            videoPreview: item.video_url || meta.videoPreview,
                            links: meta.links || [],
                            files: meta.files || [],
                            // Ensure type is set correctly
                            type: item.type === 'live-class' ? 'live_class' : (item.type || 'lesson')
                        };
                    }) : []
                }));
                setTopics(formattedTopics);
            }
        }
    }, [isOpen, initialData, courseSettings]);

    // Fetch students and cohorts
    const fetchData = () => {
        Promise.all([
            fetch('/api/admin/students').then(res => res.json()),
            fetch('/api/admin/cohorts').then(res => res.json())
        ]).then(([studentsData, cohortsData]) => {
            console.log('Fetched students:', studentsData);
            console.log('Fetched cohorts:', cohortsData);
            setStudents(studentsData);
            setCohorts(cohortsData);
        }).catch(err => console.error('Failed to fetch data', err));
    };

    useEffect(() => {
        if (isOpen) {
            fetchData();
        }
    }, [isOpen]);

    // Debug selected students
    useEffect(() => {
        console.log('Selected students:', selectedStudents);
        console.log('Students array:', students);
        console.log('Filtered students:', students.filter(s => selectedStudents.includes(s.id)));
    }, [selectedStudents, students]);

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
            // Transform internal state to API format
            const modules = topics.map((topic, index) => ({
                title: topic.title,
                summary: topic.summary || '',
                lessons: topic.lessons.map((lesson: any) => {
                    // Start with basic mapping
                    const baseItem = {
                        title: lesson.name || lesson.title, // Handle name/title diff
                        type: lesson.type, // 'lesson', 'quiz', 'assignment', 'live_class'
                        summary: lesson.description || lesson.summary || '',
                        ...lesson // Spread all other props (metadata)
                    };

                    // Specific transformations if needed
                    if (lesson.type === 'live_class' || lesson.type === 'live-class') {
                        baseItem.type = 'live_class'; // Backend expects live_class or handles mapping
                    }
                    return baseItem;
                })
            }));

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

            // Handle File Uploads
            let finalVideoUrl = videoPreview; // Default to existing preview (URL)
            if (videoFile) {
                try {
                    finalVideoUrl = await uploadFile(videoFile);
                } catch (err) {
                    console.error("Failed to upload video", err);
                    alert("Failed to upload video. Please try again.");
                    setLoading(false);
                    return;
                }
            }

            let finalImageUrl = coverImagePreview;
            if (coverImage) {
                try {
                    finalImageUrl = await uploadFile(coverImage);
                } catch (err) {
                    console.error("Failed to upload image", err);
                    alert("Failed to upload image. Please try again.");
                    setLoading(false);
                    return;
                }
            }

            const payload = {
                modules,
                courseSettings: {
                    image: finalImageUrl,
                    video: finalVideoUrl,
                    description: courseSettings?.description,
                    students: selectedStudents,
                    cohorts: selectedCohorts
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
                throw new Error('Failed to save curriculum');
            }

            // Success - Reload to refresh data
            console.log('Save successful, reloading page...');
            window.location.reload();

        } catch (error) {
            console.error('Error saving course:', error);
            alert('Failed to save course changes. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const progress = (currentStage / totalStages) * 100;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="relative bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] shadow-2xl scale-100 transition-transform overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-100">
                    <button
                        onClick={onClose}
                        className="absolute right-6 top-6 text-gray-400 hover:text-gray-600 transition-colors z-10"
                    >
                        <X size={24} />
                    </button>
                    <h2 className="text-2xl font-bold text-gray-900">Course Builder</h2>
                    <p className="text-gray-500 mt-1 text-sm">{courseTitle}</p>

                    {/* Progress Bar */}
                    <div className="mt-6">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-semibold text-gray-700">
                                Stage {currentStage} of {totalStages}
                            </span>
                            <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <div className="flex justify-between mt-2">
                            <span className={`text-xs ${currentStage >= 1 ? 'text-primary font-semibold' : 'text-gray-400'}`}>
                                Setup
                            </span>
                            <span className={`text-xs ${currentStage >= 2 ? 'text-primary font-semibold' : 'text-gray-400'}`}>
                                Content
                            </span>
                            <span className={`text-xs ${currentStage >= 3 ? 'text-primary font-semibold' : 'text-gray-400'}`}>
                                Review
                            </span>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
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
                            students={students}
                            selectedStudents={selectedStudents}
                            setSelectedStudents={setSelectedStudents}
                            cohorts={cohorts}
                            selectedCohorts={selectedCohorts}
                            setSelectedCohorts={setSelectedCohorts}
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
                                selectedStudents,
                                selectedCohorts,
                                topics
                            }}
                        />
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 flex justify-between gap-3">
                    <button
                        onClick={handleBack}
                        disabled={currentStage === 1}
                        className="px-5 py-2.5 rounded-xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Back
                    </button>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                        {currentStage < totalStages ? (
                            <button
                                onClick={handleNext}
                                className="px-5 py-2.5 rounded-xl font-semibold text-white bg-primary hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200"
                            >
                                Next
                            </button>
                        ) : (
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="px-5 py-2.5 rounded-xl font-semibold text-white bg-primary hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200 disabled:opacity-70"
                            >
                                {loading ? 'Saving...' : 'Complete'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

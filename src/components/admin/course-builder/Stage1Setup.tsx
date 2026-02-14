"use client";

import { Upload, Image as ImageIcon, Video } from 'lucide-react';
import { useState } from 'react';
import MediaPickerModal from '../media/MediaPickerModal';

interface Stage1SetupProps {
    videoFile: File | null;
    setVideoFile: (file: File | null) => void;
    videoPreview: string;
    setVideoPreview: (preview: string) => void;
    coverImage: File | null;
    setCoverImage: (file: File | null) => void;
    coverImagePreview: string;
    setCoverImagePreview: (preview: string) => void;
    students?: any[];
    selectedStudents?: string[];
    setSelectedStudents?: (ids: string[]) => void;
    cohorts?: any[];
    selectedCohorts?: string[];
    setSelectedCohorts?: (ids: string[]) => void;
}

export default function Stage1Setup({
    videoFile,
    setVideoFile,
    videoPreview,
    setVideoPreview,
    coverImage,
    setCoverImage,
    coverImagePreview,
    setCoverImagePreview,
    students,
    selectedStudents,
    setSelectedStudents,
    cohorts,
    selectedCohorts,
    setSelectedCohorts
}: Stage1SetupProps) {

    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [pickerTarget, setPickerTarget] = useState<'cover' | 'video' | null>(null);

    const openPicker = (target: 'cover' | 'video') => {
        setPickerTarget(target);
        setIsPickerOpen(true);
    };

    const handleMediaSelect = (file: any) => {
        const url = file.url;
        if (pickerTarget === 'cover') {
            setCoverImage(null); // Clear file as we use remote URL
            setCoverImagePreview(url);
        } else if (pickerTarget === 'video') {
            setVideoFile(null); // Clear file as we use remote URL
            setVideoPreview(url);
        }
        setIsPickerOpen(false);
        setPickerTarget(null);
    };



    return (
        <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900">Course Setup</h3>

            {/* Cover Image Upload */}
            <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <ImageIcon size={16} />
                    Course Cover Image
                </label>
                {coverImagePreview ? (
                    <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 flex items-center gap-4">
                        <img src={coverImagePreview} alt="Cover" className="h-32 w-56 object-cover rounded-lg shadow-sm" />
                        <div className="space-y-2">
                            <button
                                type="button"
                                onClick={() => openPicker('cover')}
                                className="block w-full px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors cursor-pointer font-medium text-sm text-center"
                            >
                                Change Image
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setCoverImage(null);
                                    setCoverImagePreview('');
                                }}
                                className="block w-full px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm"
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                ) : (
                    <div
                        onClick={() => openPicker('cover')}
                        className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors relative overflow-hidden group"
                    >
                        <ImageIcon size={32} className="mx-auto mb-2 text-gray-400 group-hover:scale-110 transition-transform" />
                        <p className="text-sm font-medium text-gray-700">Select cover image</p>
                        <p className="text-xs text-gray-500 mt-1">Recommended: 1280x720 (16:9)</p>
                    </div>
                )}
            </div>

            {/* Intro Video Upload */}
            <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Video size={16} />
                    Course Intro Video (Optional)
                </label>
                {videoPreview ? (
                    <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 space-y-3">
                        <video
                            src={videoPreview}
                            controls
                            className="w-full max-h-64 rounded-lg bg-black"
                        />
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setVideoFile(null);
                                    setVideoPreview('');
                                }}
                                className="flex-1 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-semibold text-sm"
                            >
                                Remove Video
                            </button>
                            <button
                                type="button"
                                onClick={() => openPicker('video')}
                                className="flex-1 px-4 py-2 bg-purple-50 text-primary rounded-lg hover:bg-purple-100 transition-colors font-semibold text-sm text-center cursor-pointer"
                            >
                                Replace Video
                            </button>
                        </div>
                    </div>
                ) : (
                    <div
                        onClick={() => openPicker('video')}
                        className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:bg-gray-50 transition-colors relative overflow-hidden cursor-pointer group"
                    >
                        <div className="text-gray-400 py-4">
                            <Video size={32} className="mx-auto mb-2 text-gray-400 opacity-50 group-hover:scale-110 transition-transform" />
                            <p className="text-sm font-medium">Select intro video</p>
                            <p className="text-xs mt-1">MP4, MOV</p>
                        </div>
                    </div>
                )}
            </div>

            <MediaPickerModal
                isOpen={isPickerOpen}
                onClose={() => setIsPickerOpen(false)}
                onSelect={handleMediaSelect}
            />
        </div>
    );
}

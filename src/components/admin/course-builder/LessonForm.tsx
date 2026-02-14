"use client";

import { Upload, FileText, X, Lock, Calendar, Clock, Image as ImageIcon, Video } from 'lucide-react';
import { useState } from 'react';
import MediaPickerModal from '../media/MediaPickerModal';

interface LessonFormProps {
    onSave: (lessonData: any) => void;
    onCancel: () => void;
    initialData?: any;
    isEditing?: boolean;
}

export default function LessonForm({ onSave, onCancel, initialData, isEditing = false }: LessonFormProps) {
    const [lessonName, setLessonName] = useState(initialData?.name || '');
    const [lessonDescription, setLessonDescription] = useState(initialData?.description || '');
    const [lessonVideo, setLessonVideo] = useState<File | null>(initialData?.video || null);
    const [lessonVideoPreview, setLessonVideoPreview] = useState(initialData?.videoPreview || initialData?.video_url || '');
    const [lessonCoverImage, setLessonCoverImage] = useState<File | null>(initialData?.coverImage || null);
    const [lessonCoverPreview, setLessonCoverPreview] = useState(initialData?.coverPreview || initialData?.metadata?.coverPreview || '');
    const [lessonPlaybackHours, setLessonPlaybackHours] = useState(initialData?.playbackHours || '');
    const [lessonPlaybackMinutes, setLessonPlaybackMinutes] = useState(initialData?.playbackMinutes || '');
    const [lessonPlaybackSeconds, setLessonPlaybackSeconds] = useState(initialData?.playbackSeconds || '');
    const [lessonFiles, setLessonFiles] = useState<any[]>(initialData?.files || []);
    const [lessonLinks, setLessonLinks] = useState<string[]>(initialData?.links?.length > 0 ? initialData.links : ['']);

    // Unlock Settings
    const [hasUnlockDate, setHasUnlockDate] = useState(initialData?.hasUnlockDate || false);
    const [unlockDate, setUnlockDate] = useState(initialData?.unlockDate || '');
    const [unlockTime, setUnlockTime] = useState(initialData?.unlockTime || '');

    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [pickerTarget, setPickerTarget] = useState<'video' | 'cover' | 'file' | null>(null);

    const openPicker = (target: 'video' | 'cover' | 'file') => {
        setPickerTarget(target);
        setIsPickerOpen(true);
    };

    const handleMediaSelect = (file: any) => {
        if (pickerTarget === 'video') {
            setLessonVideo(null);
            setLessonVideoPreview(file.url);
        } else if (pickerTarget === 'cover') {
            setLessonCoverImage(null);
            setLessonCoverPreview(file.url);
        } else if (pickerTarget === 'file') {
            const newFile = {
                name: file.filename || file.name || 'Unnamed',
                url: file.url,
                size: file.size || 0,
                type: file.type || file.mime_type
            };
            setLessonFiles(prev => [...prev, newFile]);
        }
        setIsPickerOpen(false);
        setPickerTarget(null);
    };

    const handleMediaSelectMultiple = (files: any[]) => {
        if (pickerTarget === 'file') {
            const newFiles = files.map(file => ({
                name: file.filename || file.name || 'Unnamed',
                url: file.url,
                size: file.size || 0,
                type: file.type || file.mime_type
            }));
            setLessonFiles(prev => [...prev, ...newFiles]);
        }
        setIsPickerOpen(false);
        setPickerTarget(null);
    };

    const handleRemoveFile = (index: number) => {
        setLessonFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleAddLink = () => {
        setLessonLinks([...lessonLinks, '']);
    };

    const handleLinkChange = (index: number, value: string) => {
        const newLinks = [...lessonLinks];
        newLinks[index] = value;
        setLessonLinks(newLinks);
    };

    const handleRemoveLink = (index: number) => {
        setLessonLinks(lessonLinks.filter((_, i) => i !== index));
    };

    const handleSubmit = () => {
        const playbackTime = `${lessonPlaybackHours.padStart(2, '0')}:${lessonPlaybackMinutes.padStart(2, '0')}:${lessonPlaybackSeconds.padStart(2, '0')}`;
        onSave({
            name: lessonName,
            description: lessonDescription,
            video: lessonVideo,
            videoPreview: lessonVideoPreview,
            coverImage: lessonCoverImage,
            coverPreview: lessonCoverPreview,
            playbackTime,
            playbackHours: lessonPlaybackHours,
            playbackMinutes: lessonPlaybackMinutes,
            playbackSeconds: lessonPlaybackSeconds,
            files: lessonFiles,
            links: lessonLinks.filter(link => link.trim()),
            hasUnlockDate,
            unlockDate,
            unlockTime
        });
    };

    return (
        <div className="border-2 border-blue-300 rounded-lg p-4 bg-blue-50 space-y-3">
            <h5 className="font-bold text-gray-900">
                {isEditing ? `Edit ${initialData?.name || 'Lesson'}` : 'New Lesson'}
            </h5>

            <div>
                <label className="text-sm font-semibold text-gray-700">Lesson Name</label>
                <input
                    type="text"
                    value={lessonName}
                    onChange={(e) => setLessonName(e.target.value)}
                    placeholder="e.g. Understanding Components"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
            </div>

            <div>
                <label className="text-sm font-semibold text-gray-700">Description</label>
                <textarea
                    value={lessonDescription}
                    onChange={(e) => setLessonDescription(e.target.value)}
                    placeholder="Lesson description..."
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                />
            </div>

            {/* Video Upload */}
            <div>
                <label className="text-sm font-semibold text-gray-700">Lesson Video</label>
                {lessonVideoPreview ? (
                    <div className="border rounded-lg p-2 bg-white space-y-2">
                        <video
                            src={lessonVideoPreview}
                            poster={lessonCoverPreview || undefined}
                            controls
                            playsInline
                            preload="metadata"
                            className="w-full max-h-48 rounded bg-black"
                            onError={(e) => console.error("Lesson video load error:", e)}
                        />
                        {!lessonCoverPreview && (
                            <button
                                type="button"
                                onClick={() => openPicker('cover')}
                                className="block text-center p-2 border border-dashed rounded cursor-pointer hover:bg-gray-50 w-full"
                            >
                                <ImageIcon size={16} className="mx-auto mb-1 text-gray-400" />
                                <p className="text-xs text-gray-500">Add Thumbnail</p>
                            </button>
                        )}
                        {lessonCoverPreview && (
                            <div className="flex items-center gap-2">
                                <img src={lessonCoverPreview} alt="Thumbnail" className="h-12 w-20 object-cover rounded" />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setLessonCoverImage(null);
                                        setLessonCoverPreview('');
                                    }}
                                    className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded"
                                >
                                    Remove
                                </button>
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={() => {
                                setLessonVideo(null);
                                setLessonVideoPreview('');
                                setLessonCoverImage(null);
                                setLessonCoverPreview('');
                            }}
                            className="w-full text-sm px-3 py-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100"
                        >
                            Remove Video
                        </button>
                    </div>
                ) : (
                    <div
                        onClick={() => openPicker('video')}
                        className="block border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50"
                    >
                        <Video size={24} className="mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-500">Select video from library</p>
                    </div>
                )}
            </div>

            {/* Playback Time */}
            <div>
                <label className="text-sm font-semibold text-gray-700">Video Playback Time</label>
                <div className="grid grid-cols-3 gap-2">
                    <div>
                        <input
                            type="number"
                            value={lessonPlaybackHours}
                            onChange={(e) => setLessonPlaybackHours(e.target.value)}
                            placeholder="HH"
                            min="0"
                            max="99"
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300 text-center"
                        />
                        <p className="text-xs text-gray-500 text-center mt-1">Hours</p>
                    </div>
                    <div>
                        <input
                            type="number"
                            value={lessonPlaybackMinutes}
                            onChange={(e) => setLessonPlaybackMinutes(e.target.value)}
                            placeholder="MM"
                            min="0"
                            max="59"
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300 text-center"
                        />
                        <p className="text-xs text-gray-500 text-center mt-1">Minutes</p>
                    </div>
                    <div>
                        <input
                            type="number"
                            value={lessonPlaybackSeconds}
                            onChange={(e) => setLessonPlaybackSeconds(e.target.value)}
                            placeholder="SS"
                            min="0"
                            max="59"
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300 text-center"
                        />
                        <p className="text-xs text-gray-500 text-center mt-1">Seconds</p>
                    </div>
                </div>
            </div>

            {/* File Upload */}
            <div>
                <label className="text-sm font-semibold text-gray-700">Lesson Files (PDF, DOC, IMG, PPT)</label>
                {lessonFiles.length > 0 && (
                    <div className="space-y-2 mb-2">
                        {lessonFiles.map((file, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 border rounded-lg bg-white">
                                <FileText size={20} className="text-gray-400" />
                                <span className="text-sm flex-1 truncate">
                                    {file.name || file.title || (typeof file.url === 'string' ? file.url.split('/').pop() : 'Unnamed File')}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveFile(index)}
                                    className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100"
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                <button
                    type="button"
                    onClick={() => openPicker('file')}
                    className="block border-2 border-dashed rounded-lg p-3 text-center cursor-pointer hover:bg-gray-50 w-full"
                >
                    <Upload size={20} className="mx-auto mb-1 text-gray-400" />
                    <p className="text-xs text-gray-500">Select files (multiple allowed)</p>
                </button>
            </div>

            {/* Links */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-700">Links</label>
                    <button
                        type="button"
                        onClick={handleAddLink}
                        className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                    >
                        + Add Link
                    </button>
                </div>
                <div className="space-y-2">
                    {lessonLinks.map((link, index) => (
                        <div key={index} className="flex gap-2">
                            <input
                                type="url"
                                value={link}
                                onChange={(e) => handleLinkChange(index, e.target.value)}
                                placeholder="https://example.com"
                                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm"
                            />
                            {lessonLinks.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => handleRemoveLink(index)}
                                    className="px-3 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Unlock Settings */}
            <div className="border border-blue-200 rounded-lg p-3 bg-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Lock size={16} className="text-blue-600" />
                        <label className="text-sm font-semibold text-gray-700">Set Unlock Date</label>
                    </div>
                    <button
                        type="button"
                        onClick={() => setHasUnlockDate(!hasUnlockDate)}
                        className={`w-10 h-5 rounded-full relative transition-colors ${hasUnlockDate ? 'bg-blue-600' : 'bg-gray-300'}`}
                    >
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${hasUnlockDate ? 'left-5.5' : 'left-0.5'}`} style={{ left: hasUnlockDate ? '22px' : '2px' }} />
                    </button>
                </div>

                {hasUnlockDate && (
                    <div className="mt-3 grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-1">
                        <div>
                            <label className="text-xs font-semibold text-gray-700 mb-1 block">Date</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    value={unlockDate}
                                    onChange={(e) => setUnlockDate(e.target.value)}
                                    className="w-full pl-8 pr-3 py-1.5 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm"
                                />
                                <Calendar className="absolute left-2.5 top-2 text-gray-400" size={14} />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-700 mb-1 block">Time</label>
                            <div className="relative">
                                <input
                                    type="time"
                                    value={unlockTime}
                                    onChange={(e) => setUnlockTime(e.target.value)}
                                    className="w-full pl-8 pr-3 py-1.5 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm"
                                />
                                <Clock className="absolute left-2.5 top-2 text-gray-400" size={14} />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex gap-2 pt-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!lessonName.trim()}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50"
                >
                    {isEditing ? 'Update Lesson' : 'Add Lesson'}
                </button>
            </div>
            <MediaPickerModal
                isOpen={isPickerOpen}
                onClose={() => setIsPickerOpen(false)}
                onSelect={handleMediaSelect}
                onSelectMultiple={handleMediaSelectMultiple}
                allowMultiSelect={pickerTarget === 'file'}
            />
        </div>
    );
}

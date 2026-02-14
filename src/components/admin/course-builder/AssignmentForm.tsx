"use client";

import { useState, useRef } from 'react';
import { Upload, X, FileText, Settings, Paperclip, Info, AlertCircle, Calendar, Clock, Lock } from 'lucide-react';
import MediaPickerModal from '../media/MediaPickerModal';

interface AssignmentFormProps {
    onSave: (assignmentData: any) => void;
    onCancel: () => void;
    initialData?: any;
    isEditing?: boolean;
}

type TabType = 'info' | 'attachments' | 'settings';

export default function AssignmentForm({ onSave, onCancel, initialData, isEditing = false }: AssignmentFormProps) {
    const [activeTab, setActiveTab] = useState<TabType>('info');

    // Info State
    const [title, setTitle] = useState(initialData?.title || '');
    const [content, setContent] = useState(initialData?.content || '');

    // Attachment State
    const [attachments, setAttachments] = useState<any[]>(initialData?.attachments || []);

    // Settings State
    const [timeLimit, setTimeLimit] = useState(initialData?.timeLimit || 0);
    const [timeUnit, setTimeUnit] = useState(initialData?.timeUnit || 'weeks');
    const [totalPoints, setTotalPoints] = useState(initialData?.totalPoints || 10);
    const [minPassPoints, setMinPassPoints] = useState(initialData?.minPassPoints || 5);
    const [fileUploadLimit, setFileUploadLimit] = useState(initialData?.fileUploadLimit || 1);
    const [maxFileSize, setMaxFileSize] = useState(initialData?.maxFileSize || 2); // MB
    const [allowResubmission, setAllowResubmission] = useState(initialData?.allowResubmission || false);
    const [maxResubmissionAttempts, setMaxResubmissionAttempts] = useState(initialData?.maxResubmissionAttempts || 1);
    const [hasUnlockDate, setHasUnlockDate] = useState(initialData?.hasUnlockDate || false);
    const [unlockDate, setUnlockDate] = useState(initialData?.unlockDate || '');
    const [unlockTime, setUnlockTime] = useState(initialData?.unlockTime || '');

    // Close Settings (Deadline)
    const [hasCloseDate, setHasCloseDate] = useState(initialData?.hasCloseDate || false);
    const [closeDate, setCloseDate] = useState(initialData?.closeDate || '');
    const [closeTime, setCloseTime] = useState(initialData?.closeTime || '');

    const [isPickerOpen, setIsPickerOpen] = useState(false);

    const handleMediaSelect = (file: any) => {
        const newAttachment = {
            name: file.filename || file.name || 'Unnamed',
            url: file.url,
            size: file.size || 0,
            type: file.type || file.mime_type
        };
        setAttachments(prev => [...prev, newAttachment]);
        setIsPickerOpen(false);
    };

    const handleMediaSelectMultiple = (files: any[]) => {
        const newAttachments = files.map(file => ({
            name: file.filename || file.name || 'Unnamed',
            url: file.url,
            size: file.size || 0,
            type: file.type || file.mime_type
        }));
        setAttachments(prev => [...prev, ...newAttachments]);
        setIsPickerOpen(false);
    };

    const removeAttachment = (index: number) => {
        setAttachments(attachments.filter((_, i) => i !== index));
    };

    const handleSubmit = () => {
        if (!title.trim()) {
            setActiveTab('info');
            return;
        }

        const assignmentData = {
            title,
            content,
            attachments,
            timeLimit,
            timeUnit,
            totalPoints,
            minPassPoints,
            fileUploadLimit,
            maxFileSize,
            allowResubmission,
            maxResubmissionAttempts,
            hasUnlockDate,
            unlockDate,
            unlockTime,
            hasCloseDate,
            closeDate,
            closeTime,
            type: 'assignment'
        };

        onSave(assignmentData);
    };

    const allowedFileTypes = ".pdf,.doc,.docx,.png,.jpg,.jpeg,.mp4,.mp3,.ppt,.pptx,.xls,.xlsx";

    return (
        <div className="border border-orange-200 rounded-xl bg-white shadow-sm overflow-hidden flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 p-4 bg-orange-50/30">
                <h5 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                    <FileText className="text-orange-500" />
                    {isEditing ? 'Edit Assignment' : 'New Assignment'}
                </h5>
                <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
                    <X size={20} />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 bg-white">
                <button
                    onClick={() => setActiveTab('info')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors relative ${activeTab === 'info' ? 'text-orange-600 bg-orange-50/50' : 'text-gray-500 hover:bg-gray-50'
                        }`}
                >
                    <Info size={16} />
                    Info
                    {activeTab === 'info' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-500" />}
                </button>
                <button
                    onClick={() => setActiveTab('attachments')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors relative ${activeTab === 'attachments' ? 'text-orange-600 bg-orange-50/50' : 'text-gray-500 hover:bg-gray-50'
                        }`}
                >
                    <Paperclip size={16} />
                    Attachments
                    {activeTab === 'attachments' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-500" />}
                </button>
                <button
                    onClick={() => setActiveTab('settings')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors relative ${activeTab === 'settings' ? 'text-orange-600 bg-orange-50/50' : 'text-gray-500 hover:bg-gray-50'
                        }`}
                >
                    <Settings size={16} />
                    Settings
                    {activeTab === 'settings' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-500" />}
                </button>
            </div>

            {/* Content Body */}
            <div className="p-6">
                {/* INFO CONTENT */}
                <div className={activeTab === 'info' ? 'block space-y-5' : 'hidden'}>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter Assignment Title"
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Content / Instructions</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Describe the assignment task..."
                            rows={8}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors resize-none"
                        />
                    </div>
                </div>

                {/* ATTACHMENTS CONTENT */}
                <div className={activeTab === 'attachments' ? 'block space-y-5' : 'hidden'}>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Upload Materials</label>
                        <p className="text-sm text-gray-500 mb-4">
                            Allowed formats: Word, PDF, Images (JPG/PNG), Audio (MP3), Video (MP4), PowerPoint, Excel
                        </p>

                        <div
                            onClick={() => setIsPickerOpen(true)}
                            className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-orange-50/30 hover:border-orange-200 transition-all group min-h-[200px]"
                        >
                            <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-sm">
                                <Upload size={24} />
                            </div>
                            <p className="text-base font-semibold text-gray-700">Click to Select from Library</p>
                            <p className="text-xs text-gray-400 mt-1">Choose from your media files</p>
                        </div>

                        {attachments.length > 0 && (
                            <div className="mt-4 space-y-2">
                                <h6 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Attached Files</h6>
                                {attachments.map((file, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm group hover:border-orange-100 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white rounded-md text-orange-500 shadow-sm">
                                                <Paperclip size={16} />
                                            </div>
                                            <span className="font-medium text-gray-700 truncate max-w-[250px]">
                                                {file.name || file.title || (typeof file.url === 'string' ? file.url.split('/').pop() : 'Unnamed Attachment')}
                                            </span>
                                        </div>
                                        <button onClick={() => removeAttachment(idx)} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                                            <X size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* SETTINGS CONTENT */}
                <div className={activeTab === 'settings' ? 'block space-y-6' : 'hidden'}>
                    <div className="bg-orange-50/50 p-6 rounded-xl border border-orange-100 space-y-6">
                        {/* Time Limit Removed as per user request */}

                        {/* Points */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Total Points</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={totalPoints}
                                    onChange={(e) => setTotalPoints(parseInt(e.target.value) || 0)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-orange-500 outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Min Pass Points</label>
                                <input
                                    type="number"
                                    min="0"
                                    max={totalPoints}
                                    value={minPassPoints}
                                    onChange={(e) => setMinPassPoints(parseInt(e.target.value) || 0)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-orange-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="w-full h-px bg-orange-200/50" />

                        {/* Submission Constraints */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <div className="flex items-center gap-1">
                                    <label className="text-sm font-semibold text-gray-700">File Upload Limit</label>
                                    <AlertCircle size={14} className="text-gray-400" />
                                </div>
                                <input
                                    type="number"
                                    min="1"
                                    value={fileUploadLimit}
                                    onChange={(e) => setFileUploadLimit(parseInt(e.target.value) || 1)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-orange-500 outline-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Max File Size (MB)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="1"
                                        value={maxFileSize}
                                        onChange={(e) => setMaxFileSize(parseInt(e.target.value) || 1)}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-orange-500 outline-none pr-10"
                                    />
                                    <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-bold">MB</span>
                                </div>
                            </div>
                        </div>

                        <div className="w-full h-px bg-orange-200/50" />

                        {/* Resubmission */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-semibold text-gray-700">Allow Resubmission</label>
                                <button
                                    type="button"
                                    onClick={() => setAllowResubmission(!allowResubmission)}
                                    className={`w-12 h-6 rounded-full relative transition-colors ${allowResubmission ? 'bg-orange-500' : 'bg-gray-300'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${allowResubmission ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>

                            {allowResubmission && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                    <label className="text-sm font-semibold text-gray-700">Max Attempts</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={maxResubmissionAttempts}
                                        onChange={(e) => setMaxResubmissionAttempts(parseInt(e.target.value) || 1)}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-orange-500 outline-none"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="w-full h-px bg-orange-200/50" />

                        {/* Unlock Settings */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Lock size={16} className="text-orange-600" />
                                    <label className="text-sm font-semibold text-gray-700">Set Unlock Date</label>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setHasUnlockDate(!hasUnlockDate)}
                                    className={`w-12 h-6 rounded-full relative transition-colors ${hasUnlockDate ? 'bg-orange-500' : 'bg-gray-300'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${hasUnlockDate ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>

                            {hasUnlockDate && (
                                <div className="grid grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-1">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700">Date</label>
                                        <div className="relative">
                                            <input
                                                type="date"
                                                value={unlockDate}
                                                onChange={(e) => setUnlockDate(e.target.value)}
                                                className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 focus:border-orange-500 outline-none"
                                            />
                                            <Calendar className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700">Time</label>
                                        <div className="relative">
                                            <input
                                                type="time"
                                                value={unlockTime}
                                                onChange={(e) => setUnlockTime(e.target.value)}
                                                className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 focus:border-orange-500 outline-none"
                                            />
                                            <Clock className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="w-full h-px bg-orange-200/50" />

                        {/* Close Settings (Deadline) */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <AlertCircle size={16} className="text-red-500" />
                                    <label className="text-sm font-semibold text-gray-700">Set Close Date (Deadline)</label>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setHasCloseDate(!hasCloseDate)}
                                    className={`w-12 h-6 rounded-full relative transition-colors ${hasCloseDate ? 'bg-red-500' : 'bg-gray-300'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${hasCloseDate ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>

                            {hasCloseDate && (
                                <div className="grid grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-1">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700">Close Date</label>
                                        <div className="relative">
                                            <input
                                                type="date"
                                                value={closeDate}
                                                onChange={(e) => setCloseDate(e.target.value)}
                                                className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 focus:border-red-500 outline-none"
                                            />
                                            <Calendar className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700">Close Time</label>
                                        <div className="relative">
                                            <input
                                                type="time"
                                                value={closeTime}
                                                onChange={(e) => setCloseTime(e.target.value)}
                                                className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 focus:border-red-500 outline-none"
                                            />
                                            <Clock className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 justify-end p-4 border-t border-gray-100 bg-gray-50/50">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-colors shadow-sm"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!title.trim()}
                    className="px-6 py-2.5 bg-orange-600 text-white rounded-xl hover:bg-orange-700 font-semibold transition-colors shadow-lg shadow-orange-200 disabled:opacity-50 disabled:shadow-none"
                >
                    {isEditing ? 'Update Assignment' : 'Save Assignment'}
                </button>
            </div>
            <MediaPickerModal
                isOpen={isPickerOpen}
                onClose={() => setIsPickerOpen(false)}
                onSelect={handleMediaSelect}
                onSelectMultiple={handleMediaSelectMultiple}
                allowMultiSelect={true}
            />
        </div>
    );
}

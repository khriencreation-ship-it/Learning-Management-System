"use client";

import { useState, useEffect } from 'react';
import { Video, X, Calendar, Clock, Link as LinkIcon, AlertCircle, Loader2, Sparkles, Copy, CheckCircle, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface LiveClassFormProps {
    onSave: (liveClassData: any) => void;
    onCancel: () => void;
    initialData?: any;
    isEditing?: boolean;
}

export default function LiveClassForm({ onSave, onCancel, initialData, isEditing = false }: LiveClassFormProps) {
    const [title, setTitle] = useState(initialData?.title || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [date, setDate] = useState(initialData?.date || '');
    const [time, setTime] = useState(initialData?.time || '');
    const [duration, setDuration] = useState(initialData?.duration || 60);
    const [meetingLink, setMeetingLink] = useState(initialData?.meetingLink || '');
    const [platform, setPlatform] = useState(initialData?.platform || 'google_meet');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generateError, setGenerateError] = useState('');
    const [isGoogleConnected, setIsGoogleConnected] = useState(false);
    const [isCheckingOAuth, setIsCheckingOAuth] = useState(true);
    const [linkCopied, setLinkCopied] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    // Check OAuth status on mount and when platform changes
    useEffect(() => {
        checkGoogleOAuthStatus();
    }, []);

    const checkGoogleOAuthStatus = async () => {
        setIsCheckingOAuth(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                setUserId(user.id);
                const response = await fetch(`/api/auth/google/status?userId=${user.id}`);
                const data = await response.json();
                setIsGoogleConnected(data.connected);
            }
        } catch (error) {
            console.error('Error checking OAuth status:', error);
            setIsGoogleConnected(false);
        } finally {
            setIsCheckingOAuth(false);
        }
    };

    const handleGenerateLink = async () => {
        if (!title.trim() || !date || !time) {
            setGenerateError('Please fill in title, date, and time first');
            return;
        }

        setIsGenerating(true);
        setGenerateError('');

        try {
            const response = await fetch('/api/admin/generate-meet-link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    description,
                    date,
                    time,
                    duration,
                    userId, // Pass userId to handle session tracking issues in dev
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.details || data.error || 'Failed to generate link');
            }

            setMeetingLink(data.meetingLink);
        } catch (error: any) {
            console.error('Error generating link:', error);
            setGenerateError(error.message || 'Failed to generate Google Meet link');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopyLink = () => {
        if (meetingLink) {
            navigator.clipboard.writeText(meetingLink);
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 2000);
        }
    };

    const handleSubmit = () => {
        if (!title.trim() || !date || !time) return;

        // If google_meet and no link, show error
        if (platform === 'google_meet' && !meetingLink) {
            setGenerateError('Please generate a Google Meet link or enter one manually');
            return;
        }

        const liveClassData = {
            title,
            description,
            date,
            time,
            duration,
            meetingLink,
            platform,
            type: 'live_class'
        };

        onSave(liveClassData);
    };

    const isFormValid = title.trim() && date && time && meetingLink;

    return (
        <div className="border border-purple-200 rounded-xl bg-white shadow-sm overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 p-4 bg-purple-50/30">
                <h5 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                    <Video className="text-purple-600" />
                    {isEditing ? 'Edit Live Class' : 'Schedule Live Class'}
                </h5>
                <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
                    <X size={20} />
                </button>
            </div>

            <div className="p-6 space-y-6">
                {/* Main Info */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Class Title *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Introduction to React Hooks"
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief description of the class..."
                            rows={3}
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 resize-none"
                        />
                    </div>
                </div>

                {/* Schedule */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <Calendar size={16} />
                            Date *
                        </label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <Clock size={16} />
                            Time *
                        </label>
                        <input
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Duration (minutes)
                    </label>
                    <input
                        type="number"
                        value={duration}
                        onChange={(e) => setDuration(Number(e.target.value))}
                        min="15"
                        step="15"
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    />
                </div>

                {/* Platform */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Platform
                    </label>
                    <select
                        value={platform}
                        onChange={(e) => setPlatform(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    >
                        <option value="google_meet">Google Meet</option>
                        <option value="zoom">Zoom</option>
                        <option value="other">Other</option>
                    </select>
                </div>

                {/* OAuth Warning for Google Meet */}
                {platform === 'google_meet' && !isCheckingOAuth && !isGoogleConnected && (
                    <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                        <div className="flex items-start gap-3">
                            <AlertCircle size={20} className="text-amber-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-amber-900 mb-1">
                                    Google Account Not Connected
                                </p>
                                <p className="text-xs text-amber-700 mb-2">
                                    To automatically generate Google Meet links, please connect your Google account in Integrations.
                                </p>
                                <Link
                                    href="/admin/integrations"
                                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-amber-300 text-amber-900 rounded-lg hover:bg-amber-50 font-semibold text-xs transition-colors"
                                >
                                    <ExternalLink size={14} />
                                    Go to Integrations
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                {/* Generate Meet Link Button */}
                {platform === 'google_meet' && isGoogleConnected && !meetingLink && (
                    <div>
                        <button
                            onClick={handleGenerateLink}
                            disabled={isGenerating || !title.trim() || !date || !time}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-200"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Generating Link...
                                </>
                            ) : (
                                <>
                                    <Sparkles size={18} />
                                    Generate Google Meet Link
                                </>
                            )}
                        </button>
                        {generateError && (
                            <p className="text-sm text-red-600 mt-2 flex items-center gap-2">
                                <AlertCircle size={14} />
                                {generateError}
                            </p>
                        )}
                    </div>
                )}

                {/* Meeting Link Display/Input */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Meeting Link {platform === 'google_meet' && !isGoogleConnected && '*'}
                    </label>
                    <div className="relative">
                        <input
                            type="url"
                            value={meetingLink}
                            onChange={(e) => setMeetingLink(e.target.value)}
                            placeholder={platform === 'google_meet' && isGoogleConnected ? "Click 'Generate Link' below" : "Enter meeting link manually"}
                            className="w-full px-4 py-2.5 pr-24 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                            readOnly={platform === 'google_meet' && isGoogleConnected && !meetingLink}
                        />
                        {meetingLink && (
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                <button
                                    onClick={handleCopyLink}
                                    className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                    title="Copy link"
                                >
                                    {linkCopied ? <CheckCircle size={16} className="text-green-600" /> : <Copy size={16} />}
                                </button>
                                <a
                                    href={meetingLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                    title="Open link"
                                >
                                    <ExternalLink size={16} />
                                </a>
                            </div>
                        )}
                    </div>
                    {meetingLink && (
                        <p className="text-xs text-green-600 mt-2 flex items-center gap-2">
                            <CheckCircle size={14} />
                            Meeting link ready
                        </p>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-4 bg-gray-50 border-t border-gray-100">
                <button
                    onClick={onCancel}
                    className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={!isFormValid}
                    className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-purple-700 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    title={!isFormValid ? 'Please fill in all required fields and provide a meeting link' : ''}
                >
                    Schedule Session
                </button>
            </div>
        </div>
    );
}

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Folder,
    File as FileIcon,
    Upload,
    Plus,
    ChevronRight,
    MoreVertical,
    Trash2,
    Image as ImageIcon,
    Film,
    FileText,
    Search,
    Loader2,
    ChevronDown,
    CheckSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Folder {
    id: string;
    name: string;
    parent_id: string | null;
}

interface MediaFile {
    id: string;
    filename: string;
    url: string;
    type: string;
    size: number;
    mime_type: string;
    created_at: string;
}

// Add webkitdirectory to InputHTMLAttributes
declare module 'react' {
    interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
        webkitdirectory?: string;
        directory?: string;
    }
}

interface MediaLibraryClientProps {
    onSelect?: (file: MediaFile) => void;
    onMultiSelect?: (files: MediaFile[]) => void;
    isPicker?: boolean;
    allowMultiSelect?: boolean;
}

export default function MediaLibraryClient({
    onSelect,
    onMultiSelect,
    isPicker = false,
    allowMultiSelect = false
}: MediaLibraryClientProps) {
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [breadcrumbs, setBreadcrumbs] = useState<Folder[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [files, setFiles] = useState<MediaFile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0, message: '' });
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [isUploadDropdownOpen, setIsUploadDropdownOpen] = useState(false);

    // Selection State
    const [selectedFolderIds, setSelectedFolderIds] = useState<Set<string>>(new Set());
    const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
    // Auto-enable selection mode if items are selected
    const isSelectionMode = selectedFolderIds.size > 0 || selectedFileIds.size > 0;

    const fileInputRef = useRef<HTMLInputElement>(null);
    const folderInputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // --- Delete Logic ---
    const handleDelete = async (items: { folderIds?: string[], fileIds?: string[] }) => {
        if (!confirm('Are you sure you want to delete these items? This action cannot be undone.')) return;

        setIsLoading(true);
        try {
            if (items.fileIds && items.fileIds.length > 0) {
                await fetch('/api/admin/media', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids: items.fileIds })
                });
            }
            if (items.folderIds && items.folderIds.length > 0) {
                await fetch('/api/admin/folders', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids: items.folderIds })
                });
            }
            // Clear selection
            setSelectedFolderIds(new Set());
            setSelectedFileIds(new Set());
            fetchContents(currentFolderId);
        } catch (error) {
            console.error('Delete failed:', error);
            alert('Failed to delete items');
        } finally {
            setIsLoading(false);
        }
    };

    // --- Selection Logic ---
    const toggleFolderSelection = (id: string) => {
        const next = new Set(selectedFolderIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedFolderIds(next);
    };

    const toggleFileSelection = (id: string) => {
        const next = new Set(selectedFileIds);
        if (next.has(id)) {
            next.delete(id);
        } else {
            if (!allowMultiSelect && isPicker) {
                // If single-select picker, only allow one
                next.clear();
                next.add(id);
            } else {
                next.add(id);
            }
        }
        setSelectedFileIds(next);

        // Notify parent of changes in picker mode
        if (isPicker && onMultiSelect) {
            const selectedFiles = files.filter(f => next.has(f.id));
            onMultiSelect(selectedFiles);
        }
    };

    const fetchContents = useCallback(async (folderId: string | null) => {
        setIsLoading(true);
        // Clear selection on navigate
        setSelectedFolderIds(new Set());
        setSelectedFileIds(new Set());

        try {
            // Fetch Folders
            const foldersRes = await fetch(`/api/admin/folders?parentId=${folderId || 'root'}`);
            if (!foldersRes.ok) throw new Error('Failed to fetch folders');
            const foldersData = await foldersRes.json();
            setFolders(foldersData);

            // Fetch Files
            const filesRes = await fetch(`/api/admin/media?folderId=${folderId || 'root'}`);
            if (!filesRes.ok) throw new Error('Failed to fetch files');
            const filesData = await filesRes.json();
            setFiles(filesData);
        } catch (error) {
            console.error('Error loading media library:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchContents(currentFolderId);
    }, [currentFolderId, fetchContents]);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsUploadDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleCreateFolder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFolderName.trim()) return;

        try {
            const res = await fetch('/api/admin/folders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newFolderName, parentId: currentFolderId })
            });
            if (!res.ok) throw new Error('Failed to create folder');

            setNewFolderName('');
            setIsCreatingFolder(false);
            fetchContents(currentFolderId);
        } catch (error) {
            console.error('Error creating folder:', error);
        }
    };

    const handleFolderClick = (folder: Folder) => {
        if (isSelectionMode) {
            toggleFolderSelection(folder.id);
            return;
        }
        setBreadcrumbs([...breadcrumbs, folder]);
        setCurrentFolderId(folder.id);
    };

    const handleBreadcrumbClick = (index: number) => {
        if (index === -1) {
            setBreadcrumbs([]);
            setCurrentFolderId(null);
        } else {
            const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
            setBreadcrumbs(newBreadcrumbs);
            setCurrentFolderId(newBreadcrumbs[newBreadcrumbs.length - 1].id);
        }
    };

    const uploadFile = async (file: File, folderId: string | null = null) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folderId', folderId || currentFolderId || 'root');

        const res = await fetch('/api/admin/media', {
            method: 'POST',
            body: formData
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Upload failed: ${res.status} ${res.statusText} - ${errorText}`);
        }
        return res.json();
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const filesToUpload = event.target.files;
        if (!filesToUpload || filesToUpload.length === 0) return;

        setIsUploadDropdownOpen(false);
        setIsUploading(true);
        setUploadProgress({ current: 0, total: filesToUpload.length, message: 'Starting upload...' });

        // Process sequentially
        for (let i = 0; i < filesToUpload.length; i++) {
            const file = filesToUpload[i];
            setUploadProgress({ current: i + 1, total: filesToUpload.length, message: `Uploading ${file.name}...` });
            try {
                await uploadFile(file);
            } catch (error) {
                console.error('Error uploading file:', file.name, error);
            }
        }
        setIsUploading(false);
        fetchContents(currentFolderId);

        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleFolderUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const filesToUpload = event.target.files;
        if (!filesToUpload || filesToUpload.length === 0) return;

        setIsUploadDropdownOpen(false);
        setIsUploading(true);
        setUploadProgress({ current: 0, total: filesToUpload.length, message: 'Analyzing folder structure...' });

        // Cache for created folder IDs to avoid redundant API calls
        const folderPathCache = new Map<string, string>(); // Path string -> Folder ID

        // Helper to ensure path exists
        const ensurePath = async (relativePath: string): Promise<string | null> => {
            // relativePath is like "MyFolder/Sub/Image.png" -> we want "MyFolder/Sub"
            const parts = relativePath.split('/');
            parts.pop(); // Remove filename

            if (parts.length === 0) return currentFolderId; // Root relative to upload

            const dirPath = parts.join('/');

            // Check cache first
            if (folderPathCache.has(dirPath)) {
                return folderPathCache.get(dirPath)!;
            }

            // Call API to ensure path exists
            try {
                const res = await fetch('/api/admin/folders/ensure-path', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        path: dirPath,
                        parentId: currentFolderId
                    })
                });

                if (!res.ok) throw new Error('Failed to create folder structure');
                const data = await res.json();

                folderPathCache.set(dirPath, data.folderId);
                return data.folderId;
            } catch (error) {
                console.error('Folder creation failed:', error);
                return null;
            }
        };

        let successCount = 0;

        for (let i = 0; i < filesToUpload.length; i++) {
            const file = filesToUpload[i];
            // webkitRelativePath contains the full path including the folder user selected
            // e.g. "MyFolder/Image.png" or "MyFolder/Sub/Image.png"
            const relativePath = file.webkitRelativePath;

            setUploadProgress({
                current: i + 1,
                total: filesToUpload.length,
                message: `Processing ${file.name}...`
            });

            try {
                let targetFolderId = currentFolderId;
                if (relativePath) {
                    const id = await ensurePath(relativePath);
                    if (id) targetFolderId = id;
                }

                await uploadFile(file, targetFolderId);
                successCount++;
            } catch (error) {
                console.error('Error handling file:', file.name, error);
            }
        }

        setIsUploading(false);
        fetchContents(currentFolderId);

        // Reset input
        if (folderInputRef.current) folderInputRef.current.value = '';
    };

    const getFileIcon = (file: MediaFile) => {
        if (file.type === 'image') return <ImageIcon className="text-purple-500" size={32} />;
        if (file.type === 'video') return <Film className="text-red-500" size={32} />;
        return <FileText className="text-gray-500" size={32} />;
    };

    const totalSelected = selectedFolderIds.size + selectedFileIds.size;

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100 sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Media Library</h1>
                        <p className="text-sm text-gray-500">Manage your course assets</p>
                    </div>
                    {totalSelected > 0 && (
                        <div className="flex items-center gap-3 bg-purple-50 px-4 py-2 rounded-lg border border-purple-100 animate-in fade-in slide-in-from-left-4">
                            <span className="text-sm font-semibold text-purple-700">{totalSelected} selected</span>
                            {!isPicker && (
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDelete({ folderIds: Array.from(selectedFolderIds), fileIds: Array.from(selectedFileIds) })}
                                >
                                    <Trash2 className="w-4 h-4 mr-2" /> Delete Selected
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { setSelectedFolderIds(new Set()); setSelectedFileIds(new Set()); }}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                Cancel
                            </Button>
                        </div>
                    )}
                </div>

                <div className="flex gap-3">
                    {/* Hidden Inputs */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileUpload}
                    />
                    <input
                        ref={folderInputRef}
                        type="file"
                        multiple
                        webkitdirectory=""
                        directory=""
                        className="hidden"
                        onChange={handleFolderUpload}
                    />

                    {/* New Folder Button (kept for manual single folder creation) */}
                    <Button variant="outline" onClick={() => setIsCreatingFolder(true)} disabled={isUploading}>
                        <Plus className="w-4 h-4 mr-2" /> New Folder
                    </Button>

                    {/* Upload Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <Button
                            onClick={() => setIsUploadDropdownOpen(!isUploadDropdownOpen)}
                            disabled={isUploading}
                            className="bg-primary text-white"
                        >
                            {isUploading ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Upload className="w-4 h-4 mr-2" />
                            )}
                            {isUploading ? 'Uploading...' : 'Upload'}
                            {!isUploading && <ChevronDown className="w-4 h-4 ml-2 opacity-70" />}
                        </Button>

                        {isUploadDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in duration-200">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                                >
                                    <FileIcon size={16} /> Upload Files
                                </button>
                                <button
                                    onClick={() => folderInputRef.current?.click()}
                                    className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors border-t border-gray-50"
                                >
                                    <Folder size={16} /> Upload Folder(s)
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Upload Progress Indicator */}
            {isUploading && (
                <div className="bg-purple-50 border border-purple-100 rounded-lg p-4 flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
                    <Loader2 className="text-primary animate-spin" />
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">{uploadProgress.message}</p>
                        <div className="w-full bg-purple-200 rounded-full h-1.5 mt-2 overflow-hidden">
                            <div
                                className="bg-primary h-full transition-all duration-300 rounded-full"
                                style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                            />
                        </div>
                    </div>
                    <span className="text-xs font-bold text-gray-500">
                        {uploadProgress.current}/{uploadProgress.total}
                    </span>
                </div>
            )}

            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm text-gray-600 overflow-x-auto pb-2 scrollbar-none">
                <button
                    onClick={() => handleBreadcrumbClick(-1)}
                    className="hover:text-purple-600 font-medium whitespace-nowrap flex items-center gap-1"
                >
                    <Folder size={14} /> Home
                </button>
                {breadcrumbs.map((crumb, idx) => (
                    <React.Fragment key={crumb.id}>
                        <ChevronRight className="w-4 h-4 flex-shrink-0 text-gray-400" />
                        <button
                            onClick={() => handleBreadcrumbClick(idx)}
                            className="hover:text-purple-600 font-medium whitespace-nowrap"
                        >
                            {crumb.name}
                        </button>
                    </React.Fragment>
                ))}
            </div>

            {/* Creating Folder UI */}
            {isCreatingFolder && (
                <form onSubmit={handleCreateFolder} className="bg-gray-50 p-4 rounded-lg flex items-center gap-4 animate-in fade-in">
                    <Folder className="w-6 h-6 text-yellow-500" />
                    <input
                        type="text"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder="Folder Name"
                        className="bg-white border border-gray-300 rounded-lg px-3 py-2 flex-1 focus:ring-2 focus:ring-primary/20 outline-none"
                        autoFocus
                    />
                    <div className="flex gap-2">
                        <Button type="submit" size="sm">Create</Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => setIsCreatingFolder(false)}>Cancel</Button>
                    </div>
                </form>
            )}

            {/* Content Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 pb-20">
                {/* Folders */}
                {folders.map(folder => {
                    const isSelected = selectedFolderIds.has(folder.id);
                    return (
                        <div
                            key={folder.id}
                            onDoubleClick={() => handleFolderClick(folder)}
                            onClick={(e) => {
                                // Allow selection toggle on single click if meta key pressed or in selection mode
                                if (e.metaKey || e.ctrlKey || isSelectionMode) {
                                    toggleFolderSelection(folder.id);
                                }
                            }}
                            className={`group relative flex flex-col items-center p-4 bg-white rounded-xl border transition-all duration-200 select-none ${isSelected ? 'border-primary ring-2 ring-primary/20 bg-purple-50/50' : 'border-gray-200 hover:border-purple-500 hover:shadow-lg'
                                }`}
                        >
                            {/* Checkbox (Visible on hover or selected) */}
                            {!isPicker && (
                                <div
                                    className={`absolute top-2 left-2 z-10 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                                    onClick={(e) => { e.stopPropagation(); toggleFolderSelection(folder.id); }}
                                >
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center cursor-pointer ${isSelected ? 'bg-primary border-primary' : 'bg-white border-gray-300 hover:border-primary'}`}>
                                        {isSelected && <CheckSquare className="w-3.5 h-3.5 text-white" />}
                                    </div>
                                </div>
                            )}

                            {/* Delete Button (Visible on hover) */}
                            {!isPicker && (
                                <div
                                    className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => { e.stopPropagation(); handleDelete({ folderIds: [folder.id] }); }}
                                >
                                    <div className="w-7 h-7 rounded-full bg-white/90 hover:bg-red-50 border border-gray-200 hover:border-red-200 flex items-center justify-center cursor-pointer text-gray-400 hover:text-red-500 shadow-sm">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </div>
                                </div>
                            )}

                            <Folder className={`w-16 h-16 mb-3 transition-transform duration-300 drop-shadow-sm ${isSelected ? 'text-primary' : 'text-purple-400 group-hover:scale-110'}`} fill="currentColor" fillOpacity={0.1} />
                            <span className={`text-sm font-medium text-center truncate w-full ${isSelected ? 'text-primary' : 'text-gray-700'}`}>{folder.name}</span>
                        </div>
                    );
                })}

                {/* Files */}
                {files.map(file => {
                    const isSelected = selectedFileIds.has(file.id);
                    return (
                        <div
                            key={file.id}
                            onClick={(e) => {
                                if (isPicker) {
                                    toggleFileSelection(file.id);
                                    return;
                                }
                                if (e.metaKey || e.ctrlKey || isSelectionMode) {
                                    toggleFileSelection(file.id);
                                }
                            }}
                            className={`group relative flex flex-col items-center p-3 bg-white rounded-xl border transition-all duration-200 select-none ${isSelected ? 'border-primary ring-2 ring-primary/20 bg-purple-50/50' : 'border-gray-200 hover:border-purple-500 hover:shadow-lg'
                                }`}
                        >
                            {/* Checkbox (Always visible in picker mode if selected or hovered) */}
                            {(isSelected || isPicker) && (
                                <div
                                    className={`absolute top-2 left-2 z-20 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                                    onClick={(e) => { e.stopPropagation(); toggleFileSelection(file.id); }}
                                >
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center cursor-pointer shadow-sm ${isSelected ? 'bg-primary border-primary' : 'bg-white border-gray-300 hover:border-primary'}`}>
                                        {isSelected && <CheckSquare className="w-3.5 h-3.5 text-white" />}
                                    </div>
                                </div>
                            )}

                            {/* Delete Button */}
                            {!isPicker && (
                                <div
                                    className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => { e.stopPropagation(); handleDelete({ fileIds: [file.id] }); }}
                                >
                                    <div className="w-7 h-7 rounded-full bg-white/90 hover:bg-red-50 border border-gray-200 hover:border-red-200 flex items-center justify-center cursor-pointer text-gray-400 hover:text-red-500 shadow-sm">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </div>
                                </div>
                            )}

                            {/* Preview */}
                            <div className="w-full aspect-square mb-3 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center relative group-hover:ring-2 ring-primary/10 transition-all">
                                {file.type === 'image' || file.mime_type?.startsWith('image/') ? (
                                    <img src={file.url} alt={file.filename} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                ) : file.type === 'video' || file.mime_type?.startsWith('video/') ? (
                                    <div className="relative w-full h-full flex items-center justify-center bg-gray-900">
                                        <video src={file.url} className="w-full h-full object-cover opacity-80" />
                                        <Film className="absolute text-white/80 w-10 h-10" />
                                    </div>
                                ) : (
                                    getFileIcon(file)
                                )}

                                {/* Hover Overlay (Select/View Button) */}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none group-hover:pointer-events-auto">
                                    {isPicker ? (
                                        <Button
                                            variant="default"
                                            size="sm"
                                            className="h-8 shadow-xl font-bold px-4 z-10 bg-primary hover:bg-purple-700"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (onSelect) onSelect(file);
                                            }}
                                        >
                                            Select
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="h-8 text-xs z-10"
                                            onClick={(e) => { e.stopPropagation(); window.open(file.url, '_blank'); }}
                                        >
                                            View
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <span className="text-xs text-gray-600 text-center truncate w-full px-1 font-medium group-hover:text-primary" title={file.filename}>
                                {file.filename}
                            </span>
                            <span className="text-[10px] text-gray-400 mt-1">
                                {(file.size / 1024 / 1024).toFixed(1)} MB
                            </span>
                        </div>
                    );
                })}

                {isLoading && (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-400">
                        <Loader2 className="w-10 h-10 animate-spin text-primary mb-2" />
                        <p className="text-sm font-medium">Loading content...</p>
                    </div>
                )}

                {!isLoading && folders.length === 0 && files.length === 0 && !isCreatingFolder && (
                    <div className="col-span-full py-24 flex flex-col items-center text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                        <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm">
                            <Upload className="w-8 h-8 text-gray-300" />
                        </div>
                        <p className="text-lg font-semibold text-gray-600">This folder is empty</p>
                        <p className="text-sm text-gray-400 mt-1">Upload files or create a subfolder to get started</p>
                        <Button variant="outline" className="mt-6" onClick={() => setIsUploadDropdownOpen(true)}>
                            Start Uploading
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

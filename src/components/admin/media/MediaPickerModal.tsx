'use client';

import React, { useState } from 'react';
import { X, File as FileIcon } from 'lucide-react';
import MediaLibraryClient from './MediaLibraryClient';

interface MediaPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect?: (file: any) => void;
    onSelectMultiple?: (files: any[]) => void;
    allowMultiSelect?: boolean;
}

export default function MediaPickerModal({
    isOpen,
    onClose,
    onSelect,
    onSelectMultiple,
    allowMultiSelect = false
}: MediaPickerModalProps) {
    const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="relative bg-white rounded-2xl w-full max-w-5xl h-[85vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-white z-10">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Select Media</h2>
                        <p className="text-sm text-gray-500">Choose from your library</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto bg-gray-50 custom-scrollbar pb-24">
                    <MediaLibraryClient
                        isPicker={true}
                        allowMultiSelect={allowMultiSelect}
                        onSelect={(file) => {
                            if (onSelect) {
                                onSelect(file);
                                onClose();
                            }
                        }}
                        onMultiSelect={setSelectedFiles}
                    />
                </div>

                {/* Selection Footer (Visible in multi-select mode) */}
                {allowMultiSelect && selectedFiles.length > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 px-6 flex justify-between items-center shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] animate-in slide-in-from-bottom-full duration-300 z-50">
                        <div className="flex items-center gap-4">
                            <div className="flex -space-x-3 overflow-hidden">
                                {selectedFiles.slice(0, 5).map((file, i) => (
                                    <div key={file.id} className="inline-block h-10 w-10 rounded-full ring-2 ring-white bg-gray-100 overflow-hidden">
                                        {file.type === 'image' ? (
                                            <img src={file.url} alt="" className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center text-gray-400">
                                                <FileIcon size={16} />
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {selectedFiles.length > 5 && (
                                    <div className="flex items-center justify-center h-10 w-10 rounded-full ring-2 ring-white bg-gray-100 text-[10px] font-bold text-gray-500">
                                        +{selectedFiles.length - 5}
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900">{selectedFiles.length} items selected</p>
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Ready to insert</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    if (onSelectMultiple) {
                                        onSelectMultiple(selectedFiles);
                                        onClose();
                                    }
                                }}
                                className="px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-purple-700 transition-all shadow-lg shadow-primary/20 hover:-translate-y-0.5"
                            >
                                Select {selectedFiles.length} {selectedFiles.length === 1 ? 'Item' : 'Items'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

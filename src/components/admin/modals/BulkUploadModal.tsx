"use client";

import { useState, useRef } from 'react';
import { X, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useRouter } from 'next/navigation';

interface BulkUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    role: 'student' | 'tutor';
}

export default function BulkUploadModal({ isOpen, onClose, onSuccess, role }: BulkUploadModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            parseFile(selectedFile);
            setError(null);
            setUploadResult(null);
        }
    };

    const parseFile = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = e.target?.result;
            if (data) {
                try {
                    const workbook = XLSX.read(data, { type: 'binary' });
                    const sheetName = workbook.SheetNames[0];
                    const sheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(sheet);
                    setPreviewData(jsonData);
                } catch (err) {
                    setError("Failed to parse file. Ensure it is a valid Excel or CSV file.");
                }
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleUpload = async () => {
        if (!previewData.length) return;

        setUploading(true);
        setError(null);

        try {
            // Map keys to normalize data (email, name, phone, etc)
            // We assume headers are somewhat descriptive, but we should do a best-effort mapping
            // or expect specific headers.
            const normalizedData = previewData.map((row: any) => {
                // simple case-insensitive mapping
                const normalized: any = {};
                Object.keys(row).forEach(key => {
                    const lowerKey = key.toLowerCase().trim();
                    if (lowerKey.includes('name')) normalized.name = row[key];
                    else if (lowerKey.includes('email') || lowerKey.includes('mail')) normalized.email = row[key];
                    else if (lowerKey.includes('phone') || lowerKey.includes('mobile')) normalized.phone = row[key];
                    else if (lowerKey.includes('id') && !lowerKey.includes('email')) normalized.id = row[key]; // studentId or tutorId
                    else if (lowerKey.includes('payment') || lowerKey.includes('status')) normalized.paymentStatus = row[key];
                    else if (lowerKey.includes('password')) normalized.password = row[key];
                });
                return normalized;
            });

            const res = await fetch('/api/admin/users/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ users: normalizedData, role }),
            });

            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.error || 'Upload failed');
            }

            setUploadResult(result);
            if (result.stats.success > 0) {
                // Trigger success callback after a short delay or let user close
            }

        } catch (err: any) {
            setError(err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && (droppedFile.name.endsWith('.csv') || droppedFile.name.endsWith('.xlsx'))) {
            setFile(droppedFile);
            parseFile(droppedFile);
            setError(null);
            setUploadResult(null);
        } else {
            setError('Please drop a valid .csv or .xlsx file');
        }
    };

    const downloadTemplate = () => {
        const headers = ['Name', 'Email', 'Phone', 'Payment Status', role === 'student' ? 'Student ID (Optional)' : 'Tutor ID (Optional)'];
        const ws = XLSX.utils.aoa_to_sheet([headers]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template");
        XLSX.writeFile(wb, `${role}_upload_template.xlsx`);
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative bg-white rounded-3xl w-full max-w-2xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
                <button
                    onClick={onClose}
                    className="absolute right-6 top-6 text-gray-400 hover:text-gray-600"
                >
                    <X size={24} />
                </button>

                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Bulk Upload {role === 'student' ? 'Students' : 'Tutors'}
                </h2>
                <p className="text-gray-500 mb-6">Upload a CSV or Excel file to add multiple users at once.</p>

                {/* Upload Area */}
                {!file && (
                    <div
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        className="border-2 border-dashed border-gray-300 rounded-2xl p-10 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
                            <FileSpreadsheet size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Click or Drag file here</h3>
                        <p className="text-sm text-gray-500 mt-1">Supports .csv, .xlsx, .xls</p>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept=".csv, .xlsx, .xls"
                            className="hidden"
                        />
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); downloadTemplate(); }}
                            className="mt-6 text-sm text-primary font-semibold flex items-center gap-2 hover:underline"
                        >
                            <Download size={16} /> Download Template
                        </button>
                    </div>
                )}

                {/* Preview Area */}
                {file && !uploadResult && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                            <div className="flex items-center gap-3">
                                <FileSpreadsheet className="text-green-600" />
                                <div>
                                    <p className="font-semibold text-gray-900">{file.name}</p>
                                    <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB • {previewData.length} rows found</p>
                                </div>
                            </div>
                            <button onClick={() => { setFile(null); setPreviewData([]); }} className="text-gray-400 hover:text-red-500">
                                <X size={20} />
                            </button>
                        </div>

                        {previewData.length > 0 && (
                            <div className="border border-gray-200 rounded-xl overflow-hidden max-h-[300px] overflow-y-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-100 text-gray-600 font-semibold sticky top-0">
                                        <tr>
                                            {Object.keys(previewData[0]).slice(0, 4).map((key) => (
                                                <th key={key} className="px-4 py-3">{key}</th>
                                            ))}
                                            {Object.keys(previewData[0]).length > 4 && <th className="px-4 py-3">...</th>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {previewData.slice(0, 5).map((row, i) => (
                                            <tr key={i}>
                                                {Object.values(row).slice(0, 4).map((val: any, j) => (
                                                    <td key={j} className="px-4 py-2">{val}</td>
                                                ))}
                                                {Object.keys(row).length > 4 && <td className="px-4 py-2">...</td>}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {previewData.length > 5 && (
                                    <p className="p-2 text-center text-xs text-gray-500 bg-gray-50">
                                        And {previewData.length - 5} more rows...
                                    </p>
                                )}
                            </div>
                        )}

                        {error && (
                            <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-xl">
                                <AlertCircle size={20} />
                                <p className="text-sm font-medium">{error}</p>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => { setFile(null); setPreviewData([]); }}
                                className="flex-1 px-4 py-3 rounded-xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpload}
                                disabled={uploading || previewData.length === 0}
                                className="flex-1 px-4 py-3 rounded-xl font-semibold text-white bg-primary hover:bg-purple-700 shadow-lg shadow-purple-200 disabled:opacity-70 flex items-center justify-center gap-2"
                            >
                                {uploading ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
                                {uploading ? 'Importing...' : 'Start Import'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Success/Result View */}
                {uploadResult && (
                    <div className="text-center py-6">
                        <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Import Completed</h3>
                        <div className="flex justify-center gap-6 text-sm mb-6">
                            <div className="text-green-600 font-semibold">
                                {uploadResult.stats.success} Successful
                            </div>
                            <div className="text-red-500 font-semibold">
                                {uploadResult.stats.failed} Failed
                            </div>
                        </div>

                        {uploadResult.stats.errors.length > 0 && (
                            <div className="mb-6 text-left max-h-[200px] overflow-y-auto bg-red-50 p-4 rounded-xl border border-red-100">
                                <p className="text-xs font-bold text-red-700 mb-2 uppercase">Error Log</p>
                                <ul className="space-y-1">
                                    {uploadResult.stats.errors.map((err: string, i: number) => (
                                        <li key={i} className="text-xs text-red-600">• {err}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <button
                            onClick={() => { onSuccess(); onClose(); }}
                            className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-purple-700 transition-all shadow-lg shadow-purple-200"
                        >
                            Done
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

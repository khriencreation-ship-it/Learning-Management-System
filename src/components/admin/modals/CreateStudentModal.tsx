"use client";

import { X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface CreateStudentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    editStudent?: {
        id: string;
        name: string;
        studentId: string;
        email: string;
        phone?: string;
        paymentStatus: string;
    } | null;
}

export default function CreateStudentModal({ isOpen, onClose, onSuccess, editStudent }: CreateStudentModalProps) {
    const router = useRouter();
    const [name, setName] = useState('');
    const [studentId, setStudentId] = useState('STU-');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [paymentStatus, setPaymentStatus] = useState('unpaid');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (editStudent) {
            setName(editStudent.name || '');
            setStudentId(editStudent.studentId || 'STU-');
            setEmail(editStudent.email || '');
            setPhone(editStudent.phone || '');
            setPaymentStatus(editStudent.paymentStatus || 'unpaid');
        } else {
            setName('');
            setStudentId('STU-');
            setEmail('');
            setPhone('');
            setPaymentStatus('unpaid');
        }
    }, [editStudent, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const method = editStudent ? 'PUT' : 'POST';
            const res = await fetch('/api/admin/users', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editStudent?.id,
                    name,
                    studentId,
                    email,
                    phone,
                    paymentStatus,
                    role: 'student',
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || `Failed to ${editStudent ? 'update' : 'create'} student`);
            }

            if (onSuccess) onSuccess();
            onClose();

            if (!editStudent) {
                // Reset only on create
                setName('');
                setStudentId('STU-');
                setEmail('');
                setPhone('');
                setPaymentStatus('unpaid');
            }
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className="relative bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
                <button
                    onClick={onClose}
                    className="absolute right-6 top-6 text-gray-400 hover:text-gray-600"
                >
                    <X size={24} />
                </button>

                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    {editStudent ? 'Edit Student' : 'Create Student'}
                </h2>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl">
                        {error}
                    </div>
                )}

                <form className="space-y-5" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-900">Name</label>
                        <input
                            type="text"
                            placeholder="Student full name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-900">Student ID</label>
                        <input
                            type="text"
                            placeholder="e.g. STU-2026-001"
                            value={studentId}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val.startsWith('STU-')) {
                                    setStudentId(val);
                                } else if (val.length < 4) {
                                    setStudentId('STU-');
                                }
                            }}
                            required
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono tracking-wider"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-900">Email Address</label>
                        <input
                            type="email"
                            placeholder="student@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-900">Phone Number</label>
                        <input
                            type="tel"
                            placeholder="+234..."
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-900">Payment Status</label>
                        <select
                            value={paymentStatus}
                            onChange={(e) => setPaymentStatus(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                        >
                            <option value="unpaid">Unpaid</option>
                            <option value="partial">Partial</option>
                            <option value="paid">Paid</option>
                        </select>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 rounded-xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-3 rounded-xl font-semibold text-white bg-primary hover:bg-purple-700 shadow-lg shadow-purple-200 disabled:opacity-70"
                        >
                            {loading ? (editStudent ? 'Updating...' : 'Creating...') : (editStudent ? 'Update Student' : 'Create Student')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

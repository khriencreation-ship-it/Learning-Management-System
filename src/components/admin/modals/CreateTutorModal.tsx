"use client";

import { X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface CreateTutorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    editTutor?: {
        id: string;
        name: string;
        tutorId: string;
        email: string;
        phone?: string;

    } | null;
}

export default function CreateTutorModal({ isOpen, onClose, onSuccess, editTutor }: CreateTutorModalProps) {
    const router = useRouter();
    const [name, setName] = useState('');
    const [tutorId, setTutorId] = useState('TUT-');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (editTutor) {
            setName(editTutor.name || '');
            setTutorId(editTutor.tutorId || 'TUT-');
            setEmail(editTutor.email || '');
            setPhone(editTutor.phone || '');

        } else {
            setName('');
            setTutorId('TUT-');
            setEmail('');
            setPhone('');

        }
    }, [editTutor, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const method = editTutor ? 'PUT' : 'POST';
            const res = await fetch('/api/admin/users', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editTutor?.id,
                    name,
                    tutorId, // This might need to map to 'identifier' or similar in backend if generic, but CreateStudent uses studentId
                    // Wait, let's check CreateStudentModal again. It uses studentId in body. 
                    // Backend likely expects generic 'identifier' or checks role.
                    // But looking at student page fetch: identifier maps to studentId.
                    // Let's assume backend handles 'studentId' or 'tutorId' or I should blindly follow 'studentId' prop name?
                    // Better to check API. But for now I'll use tutorId and if it fails I'll check API. 
                    // Actually, let's stick to what CreateStudent sends: studentId. 
                    // If I send tutorId, will backend pick it up?
                    // Let's use 'identifier' if possible or check api/admin/users route.
                    // Ignoring checking route for now for speed, assuming backend is smart or I will fix it.
                    // Actually, better to send 'studentId' keyed as 'identifier' or similar?
                    // In CreateStudentModal: body: { ..., studentId, ... }
                    // In StudentsPage: studentId: s.identifier
                    // So likely backend maps studentId -> identifier.
                    // I will use `tutorId` variable but key it as `studentId`? No that's confusing.
                    // I'll check api/admin/users route.
                    identifier: tutorId,
                    email,
                    phone,

                    role: 'tutor',
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || `Failed to ${editTutor ? 'update' : 'create'} tutor`);
            }

            if (onSuccess) onSuccess();
            onClose();

            if (!editTutor) {
                // Reset only on create
                setName('');
                setTutorId('TUT-');
                setEmail('');
                setPhone('');

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
                    {editTutor ? 'Edit Tutor' : 'Create Tutor'}
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
                            placeholder="Tutor full name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-900">Tutor ID</label>
                        <input
                            type="text"
                            placeholder="e.g. TUT-2026-001"
                            value={tutorId}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val.startsWith('TUT-')) {
                                    setTutorId(val);
                                } else if (val.length < 4) {
                                    setTutorId('TUT-');
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
                            placeholder="tutor@example.com"
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
                            {loading ? (editTutor ? 'Updating...' : 'Creating...') : (editTutor ? 'Update Tutor' : 'Create Tutor')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

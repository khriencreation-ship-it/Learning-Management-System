"use client";

import { Plus, Trash2, GraduationCap, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import AddTutorModal from './AddTutorModal';
import DeleteConfirmationModal from '../modals/DeleteConfirmationModal';

import { useRouter } from 'next/navigation';

interface TutorsTabProps {
    cohortId?: string;
    cohortName?: string;
    initialTutors?: any[];
}

export default function TutorsTab({ cohortId, cohortName = "this Cohort", initialTutors = [] }: TutorsTabProps) {
    const router = useRouter();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Delete State
    const [tutorToDelete, setTutorToDelete] = useState<{ id: number, name: string } | null>(null);

    const [tutors, setTutors] = useState<any[]>(initialTutors);

    // Sync state with props on refresh
    useEffect(() => {
        setTutors(initialTutors);
    }, [initialTutors]);

    const filteredTutors = tutors.filter(tutor =>
        tutor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tutor.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tutor.tutorId?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleDeleteClick = (tutor: { id: number, name: string }) => {
        setTutorToDelete(tutor);
    };

    const confirmDelete = async () => {
        if (tutorToDelete) {
            try {
                const res = await fetch(`/api/admin/cohorts/${cohortId}/assign-tutors`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tutorId: tutorToDelete.id }),
                });

                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || 'Failed to remove tutor');
                }

                setTutors(tutors.filter(t => t.id !== tutorToDelete.id && t._id !== tutorToDelete.id));
                router.refresh();
                setTutorToDelete(null);
            } catch (error: any) {
                console.error('Error removing tutor:', error);
                alert(`Failed to remove tutor: ${error.message}`);
            }
        }
    };

    const handleAddTutors = async (tutorIds: string[]) => {
        if (!tutorIds.length || !cohortId) return;

        try {
            const res = await fetch(`/api/admin/cohorts/${cohortId}/assign-tutors`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tutorIds }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to assign tutors');
            }

            // Refresh to get updated list
            router.refresh();
            setIsAddModalOpen(false);
        } catch (error: any) {
            console.error('Error assigning tutors:', error);
            alert(`Failed to add tutors: ${error.message}`);
        }
    };

    return (
        <div className="space-y-6">
            <AddTutorModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAdd={handleAddTutors}
                existingTutorIds={tutors.map(t => t.id)}
            />

            <DeleteConfirmationModal
                isOpen={!!tutorToDelete}
                onClose={() => setTutorToDelete(null)}
                onConfirm={confirmDelete}
                title="Remove Tutor"
                message={`Are you sure you want to remove ${tutorToDelete?.name} from ${cohortName} Cohort?`}
            />

            <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search tutors by name or ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border-2 border-transparent focus:border-primary rounded-xl outline-none transition-colors"
                    />
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 bg-primary text-white px-5 py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200"
                >
                    <Plus size={20} />
                    Add Tutor
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredTutors.length > 0 ? (
                    filteredTutors.map((tutor) => (
                        <div key={tutor.id || tutor._id} className="flex flex-col bg-white p-6 rounded-2xl border border-gray-100 hover:border-gray-200 transition-colors text-center items-center">
                            <div className="w-20 h-20 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 mb-4">
                                <GraduationCap size={40} />
                            </div>
                            <h4 className="font-bold text-gray-900 text-lg">{tutor.name}</h4>
                            <p className="text-gray-400 text-xs font-mono mb-1">{tutor.tutorId}</p>
                            <p className="text-gray-500 text-sm mb-6">{tutor.role || 'Tutor'}</p>

                            <button
                                onClick={() => handleDeleteClick(tutor)}
                                className="w-full py-2.5 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl text-sm font-semibold transition-colors"
                            >
                                Remove from Cohort
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-gray-100 text-gray-500">
                        <div className="flex flex-col items-center">
                            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 mb-2">
                                <GraduationCap size={24} />
                            </div>
                            {searchQuery ? `No tutors found matching "${searchQuery}"` : "No tutors assigned yet."}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

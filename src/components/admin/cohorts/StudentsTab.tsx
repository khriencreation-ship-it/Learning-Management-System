"use client";

import { Search, Plus, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AddStudentModal from './AddStudentModal';
import DeleteConfirmationModal from '../modals/DeleteConfirmationModal';

interface StudentsTabProps {
    cohortId: string;
    cohortName?: string;
    initialStudents?: any[];
}

export default function StudentsTab({ cohortId, cohortName = "this Cohort", initialStudents = [] }: StudentsTabProps) {
    const router = useRouter();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Delete State
    const [studentToDelete, setStudentToDelete] = useState<{ id: number, name: string } | null>(null);

    const [students, setStudents] = useState<any[]>(initialStudents);
    const [isEnrolling, setIsEnrolling] = useState(false);

    // Sync students when initialStudents updates (e.g. after router.refresh)
    useEffect(() => {
        setStudents(initialStudents);
    }, [initialStudents]);

    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.studentId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleDeleteClick = (student: { id: number, name: string }) => {
        setStudentToDelete(student);
    };

    const confirmDelete = async () => {
        if (studentToDelete) {
            try {
                const res = await fetch(`/api/admin/cohorts/${cohortId}/enroll`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ studentId: studentToDelete.id }),
                });

                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || 'Failed to remove student');
                }

                setStudents(students.filter(s => s.id !== studentToDelete.id && s._id !== studentToDelete.id));
                router.refresh();
                setStudentToDelete(null);
            } catch (error: any) {
                console.error('Error removing student:', error);
                alert(`Failed to remove student: ${error.message}`);
            }
        }
    };

    const handleAddStudents = async (studentIds: string[]) => {
        if (!studentIds.length) return;
        setIsEnrolling(true);

        try {
            const res = await fetch(`/api/admin/cohorts/${cohortId}/enroll`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentIds }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to enroll students');
            }

            // Refresh to get updated list
            router.refresh();
            setIsAddModalOpen(false);
        } catch (error: any) {
            console.error('Error enrolling students:', error);
            alert(`Failed to add students: ${error.message}`);
        } finally {
            setIsEnrolling(false);
        }
    };

    return (
        <div className="space-y-6">
            <AddStudentModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAdd={handleAddStudents}
                existingStudentIds={students.map(s => s.id)}
            />

            <DeleteConfirmationModal
                isOpen={!!studentToDelete}
                onClose={() => setStudentToDelete(null)}
                onConfirm={confirmDelete}
                title="Remove Student"
                message={`Are you sure you want to remove ${studentToDelete?.name} from ${cohortName} Cohort?`}
            />

            <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by name or Student ID..."
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
                    Add Student
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                            <th className="px-6 py-4">Student Name</th>
                            <th className="px-6 py-4">Student ID</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredStudents.length > 0 ? (
                            filteredStudents.map((student) => (
                                <tr key={student.id || student._id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                                                {student.name.charAt(0)}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-gray-900">{student.name}</span>
                                                <span className="text-xs text-gray-500">{student.email}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 font-mono text-sm">{student.studentId}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${student.status === 'Active' || student.status === 'active'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-gray-100 text-gray-600'
                                            }`}>
                                            {student.status || 'Active'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleDeleteClick(student)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                    <div className="flex flex-col items-center">
                                        <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 mb-2">
                                            <Search size={24} />
                                        </div>
                                        {searchQuery ? `No students found matching "${searchQuery}"` : "No students enrolled yet."}
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

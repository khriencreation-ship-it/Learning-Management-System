"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Search, Plus, MoreHorizontal, Mail, Phone, User, Eye, Edit2, Trash2, GraduationCap, Upload } from 'lucide-react';
import CreateTutorModal from '../modals/CreateTutorModal';
import DeleteTutorModal from '../modals/DeleteTutorModal';
import BulkUploadModal from '../modals/BulkUploadModal';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/ui/Toast';

interface Tutor {
    id: string;
    name: string;
    tutorId: string;
    email: string;
    phone?: string;
    paymentStatus: string;
    status: string;
}

interface TutorListClientProps {
    initialTutors: Tutor[];
}

export default function TutorListClient({ initialTutors }: TutorListClientProps) {
    const [tutors, setTutors] = useState<Tutor[]>(initialTutors);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
    const [tutorToDelete, setTutorToDelete] = useState<Tutor | null>(null);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const { toasts, removeToast, success } = useToast();

    const filteredTutors = tutors.filter(tutor => {
        if (!tutor) return false;
        const matchesSearch = ((tutor.name || '').toLowerCase()).includes(searchQuery.toLowerCase()) ||
            ((tutor.tutorId || '').toLowerCase()).includes(searchQuery.toLowerCase()) ||
            ((tutor.email || '').toLowerCase()).includes(searchQuery.toLowerCase());

        const matchesFilter = filterStatus === 'all' ||
            ((tutor.paymentStatus || 'unpaid').toLowerCase()) === filterStatus;

        return matchesSearch && matchesFilter;
    });



    const handleRefresh = async () => {
        try {
            const res = await fetch('/api/admin/users?role=tutor');
            if (res.ok) {
                const data = await res.json();
                setTutors(data.map((s: any) => ({
                    id: s.id,
                    name: s.name || 'Unknown',
                    tutorId: s.identifier || 'N/A',
                    email: s.email || 'No Email',
                    phone: s.phone,
                    paymentStatus: s.paymentStatus,
                    status: s.status
                })));
            }
        } catch (err) {
            console.error('Failed to refresh tutors list', err);
        }
    };

    const handleEdit = (tutor: Tutor) => {
        setSelectedTutor(tutor);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedTutor(null);
    };

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Tutor Management</h1>
                    <p className="text-gray-500 mt-1">Manage tutor records, assignments, and status.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsBulkModalOpen(true)}
                        className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-2xl font-bold hover:bg-gray-50 transition-all shadow-sm"
                    >
                        <Upload size={20} className="text-gray-500" />
                        <span className="hidden sm:inline">Import CSV</span>
                    </button>
                    <button
                        onClick={() => {
                            setSelectedTutor(null);
                            setIsModalOpen(true);
                        }}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-purple-700 transition-all shadow-lg shadow-purple-200"
                    >
                        <Plus size={20} />
                        <span className="hidden sm:inline">Add Tutor</span>
                        <span className="sm:hidden">Add</span>
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
                        <GraduationCap size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Tutors</p>
                        <p className="text-2xl font-bold text-gray-900">{tutors.length}</p>
                    </div>
                </div>
            </div>

            {/* Main Content & Table */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
                {/* Table Header / Search */}
                <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name, tutor ID, or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:border-primary/30 focus:ring-4 focus:ring-primary/5 rounded-2xl text-sm transition-all focus:outline-none"
                        />
                    </div>


                </div>

                {/* Table Body */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-8 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Tutor</th>
                                <th className="px-8 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Tutor ID</th>
                                <th className="px-8 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Contact Info</th>
                                <th className="px-8 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredTutors.length > 0 ? (
                                filteredTutors.map((tutor) => (
                                    <tr key={tutor.id} className="group hover:bg-gray-50/50 transition-colors">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-100 to-blue-50 text-primary flex items-center justify-center font-bold text-base border border-white shadow-sm transition-transform group-hover:scale-110">
                                                    {(tutor.name || '?').charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900">{tutor.name}</p>
                                                    <p className="text-xs text-gray-500 mt-0.5">Tutor</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 whitespace-nowrap">
                                            <span className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold tracking-wider">
                                                {tutor.tutorId}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="space-y-1.5">
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Mail size={14} className="text-gray-400" />
                                                    {tutor.email}
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Phone size={14} className="text-gray-400" />
                                                    {tutor.phone || 'N/A'}
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-8 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {/* Hidden view details for now as I don't have tutor details page yet, or I can link to same user details page? */
                                                    /* Linking to /admin/students/${tutor.id} might work if it's generic user page, but URL says students. */
                                                    /* I'll point to /admin/tutors/${tutor.id} but I won't implement that page yet unless user asks. */
                                                    /* Actually, user said 'same functionality' so I should probably have the link. */
                                                }
                                                <Link
                                                    href={`/admin/tutors/${tutor.id}`}
                                                    title="View Details"
                                                    className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                                                >
                                                    <Eye size={18} />
                                                </Link>
                                                <button
                                                    onClick={() => handleEdit(tutor)}
                                                    title="Edit Tutor"
                                                    className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setTutorToDelete(tutor);
                                                        setIsDeleteModalOpen(true);
                                                    }}
                                                    title="Delete Tutor"
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <div className="max-w-xs mx-auto">
                                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Search size={32} className="text-gray-300" />
                                            </div>
                                            <p className="text-gray-900 font-bold">No tutors found</p>
                                            <p className="text-gray-500 text-sm mt-1">Try adjusting your search query or add a new tutor.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Table Footer */}
                <div className="p-6 bg-gray-50/30 border-t border-gray-50 text-center">
                    <p className="text-xs text-gray-400 font-medium">
                        Showing {filteredTutors.length} of {tutors.length} tutors
                    </p>
                </div>
            </div>

            <DeleteTutorModal
                isOpen={isDeleteModalOpen}
                tutor={tutorToDelete}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setTutorToDelete(null);
                }}
                onSuccess={() => {
                    success('Tutor removed from the system');
                    handleRefresh();
                }}
            />

            <CreateTutorModal
                isOpen={isModalOpen}
                editTutor={selectedTutor}
                onClose={handleCloseModal}
                onSuccess={() => {
                    success(selectedTutor ? 'Tutor updated successfully!' : 'Tutor added successfully!');
                    handleRefresh();
                }}
            />

            <BulkUploadModal
                isOpen={isBulkModalOpen}
                onClose={() => setIsBulkModalOpen(false)}
                onSuccess={() => {
                    success('Bulk import completed!');
                    handleRefresh();
                }}
                role="tutor"
            />

            {/* Toast Notifications */}
            {toasts.map((toast) => (
                <Toast
                    key={toast.id}
                    message={toast.message}
                    type={toast.type}
                    onClose={() => removeToast(toast.id)}
                />
            ))}
        </div>
    );
}

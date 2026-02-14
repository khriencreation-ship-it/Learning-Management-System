"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Search, Plus, MoreHorizontal, Mail, Phone, User, CheckCircle2, XCircle, AlertCircle, Eye, Edit2, Trash2, Upload } from 'lucide-react';
import CreateStudentModal from '../modals/CreateStudentModal';
import DeleteStudentModal from '../modals/DeleteStudentModal';
import BulkUploadModal from '../modals/BulkUploadModal';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/ui/Toast';

interface Student {
    id: string;
    name: string;
    studentId: string;
    email: string;
    phone?: string;
    paymentStatus: string;
    status: string;
}

interface StudentListClientProps {
    initialStudents: Student[];
}

export default function StudentListClient({ initialStudents }: StudentListClientProps) {
    const [students, setStudents] = useState<Student[]>(initialStudents);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const { toasts, removeToast, success } = useToast();

    const filteredStudents = students.filter(student => {
        if (!student) return false;
        const matchesSearch = ((student.name || '').toLowerCase()).includes(searchQuery.toLowerCase()) ||
            ((student.studentId || '').toLowerCase()).includes(searchQuery.toLowerCase()) ||
            ((student.email || '').toLowerCase()).includes(searchQuery.toLowerCase());

        const matchesFilter = filterStatus === 'all' ||
            ((student.paymentStatus || 'unpaid').toLowerCase()) === filterStatus;

        return matchesSearch && matchesFilter;
    });

    const getPaymentBadge = (status: string) => {
        const s = (status || 'unpaid').toLowerCase();
        switch (s) {
            case 'paid':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                        <CheckCircle2 size={12} />
                        Paid
                    </span>
                );
            case 'partial':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100">
                        <AlertCircle size={12} />
                        Partial
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-100">
                        <XCircle size={12} />
                        Unpaid
                    </span>
                );
        }
    };

    const handleRefresh = async () => {
        try {
            const res = await fetch('/api/admin/students');
            if (res.ok) {
                const data = await res.json();
                setStudents(data);
            }
        } catch (err) {
            console.error('Failed to refresh students list', err);
        }
    };

    const handleEdit = (student: Student) => {
        setSelectedStudent(student);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedStudent(null);
    };

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Student Management</h1>
                    <p className="text-gray-500 mt-1">Manage student records, enrollment, and payment status.</p>
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
                            setSelectedStudent(null);
                            setIsModalOpen(true);
                        }}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-purple-700 transition-all shadow-lg shadow-purple-200"
                    >
                        <Plus size={20} />
                        <span className="hidden sm:inline">Add Student</span>
                        <span className="sm:hidden">Add</span>
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
                        <User size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Students</p>
                        <p className="text-2xl font-bold text-gray-900">{students.length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <CheckCircle2 size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Fully Paid</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {students.filter(s => (s?.paymentStatus || '').toLowerCase() === 'paid').length}
                        </p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                        <AlertCircle size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Partial Payment</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {students.filter(s => (s?.paymentStatus || '').toLowerCase() === 'partial').length}
                        </p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-600">
                        <XCircle size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Unpaid</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {students.filter(s => {
                                const st = (s?.paymentStatus || '').toLowerCase();
                                return !st || st === 'unpaid';
                            }).length}
                        </p>
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
                            placeholder="Search by name, student ID, or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:border-primary/30 focus:ring-4 focus:ring-primary/5 rounded-2xl text-sm transition-all focus:outline-none"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest hidden sm:block">Filter By:</span>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:border-primary/30 focus:ring-4 focus:ring-primary/5 rounded-2xl text-sm font-bold text-gray-700 transition-all focus:outline-none min-w-[140px]"
                        >
                            <option value="all">All Payments</option>
                            <option value="paid">Paid</option>
                            <option value="partial">Partial</option>
                            <option value="unpaid">Unpaid</option>
                        </select>
                    </div>
                </div>

                {/* Table Body */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-8 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Student</th>
                                <th className="px-8 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Student ID</th>
                                <th className="px-8 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Contact Info</th>
                                <th className="px-8 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Payment Status</th>
                                <th className="px-8 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredStudents.length > 0 ? (
                                filteredStudents.map((student) => (
                                    <tr key={student.id} className="group hover:bg-gray-50/50 transition-colors">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-100 to-blue-50 text-primary flex items-center justify-center font-bold text-base border border-white shadow-sm transition-transform group-hover:scale-110">
                                                    {(student.name || '?').charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900">{student.name}</p>
                                                    <p className="text-xs text-gray-500 mt-0.5">Student</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 whitespace-nowrap">
                                            <span className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold tracking-wider">
                                                {student.studentId}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="space-y-1.5">
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Mail size={14} className="text-gray-400" />
                                                    {student.email}
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Phone size={14} className="text-gray-400" />
                                                    {student.phone || 'N/A'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            {getPaymentBadge(student.paymentStatus)}
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    href={`/admin/students/${student.id}`}
                                                    title="View Details"
                                                    className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                                                >
                                                    <Eye size={18} />
                                                </Link>
                                                <button
                                                    onClick={() => handleEdit(student)}
                                                    title="Edit Student"
                                                    className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setStudentToDelete(student);
                                                        setIsDeleteModalOpen(true);
                                                    }}
                                                    title="Delete Student"
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
                                            <p className="text-gray-900 font-bold">No students found</p>
                                            <p className="text-gray-500 text-sm mt-1">Try adjusting your search query or add a new student.</p>
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
                        Showing {filteredStudents.length} of {students.length} students
                    </p>
                </div>
            </div>

            <DeleteStudentModal
                isOpen={isDeleteModalOpen}
                student={studentToDelete}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setStudentToDelete(null);
                }}
                onSuccess={() => {
                    success('Student removed from the system');
                    handleRefresh();
                }}
            />

            <CreateStudentModal
                isOpen={isModalOpen}
                editStudent={selectedStudent}
                onClose={handleCloseModal}
                onSuccess={() => {
                    success(selectedStudent ? 'Student updated successfully!' : 'Student added successfully!');
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
                role="student"
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

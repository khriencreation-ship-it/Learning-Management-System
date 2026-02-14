
"use client";

import { useState, useEffect } from 'react';
import { Search, Plus, MoreVertical, Trash2, Mail, Phone, Shield } from 'lucide-react';
import AddSubAdminModal from './AddSubAdminModal';

interface SubAdmin {
    id: string;
    name: string;
    email: string;
    phone?: string;
    status?: string;
    role?: string;
    identifier?: string;
    createdAt?: string;
}

export default function SubAdminListClient() {
    const [admins, setAdmins] = useState<SubAdmin[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const fetchAdmins = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/sub-admins');
            if (res.ok) {
                const data = await res.json();
                setAdmins(data);
            }
        } catch (error) {
            console.error('Failed to fetch admins', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdmins();
    }, []);

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to remove "${name}"?`)) return;

        setDeletingId(id);
        try {
            const res = await fetch(`/api/admin/sub-admins/${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchAdmins(); // Refresh
            } else {
                alert('Failed to delete admin');
            }
        } catch (err) {
            alert('Error deleting admin');
        } finally {
            setDeletingId(null);
        }
    };

    const filteredAdmins = admins.filter(admin =>
        admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        admin.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header Actions */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                    <input
                        type="text"
                        placeholder="Search admins..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-gray-900"
                    />
                </div>

                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="w-full md:w-auto px-6 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200 flex items-center justify-center gap-2"
                >
                    <Plus size={20} />
                    Add Sub Admin
                </button>
            </div>

            {/* List */}
            {loading ? (
                <div className="text-center py-20">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">Loading admins...</p>
                </div>
            ) : filteredAdmins.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-[2.5rem] border border-gray-100 border-dashed">
                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-400">
                        <Shield size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">No Admins Found</h3>
                    <p className="text-gray-500 mt-1 max-w-sm mx-auto">
                        {searchQuery ? `No results for "${searchQuery}"` : "Get started by adding your first admin."}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAdmins.map((admin) => (
                        <div key={admin.id} className="group bg-white rounded-[2rem] p-6 border border-gray-100 hover:border-primary/20 hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-300 relative">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center text-primary font-bold text-xl shadow-inner border border-white">
                                        {admin.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg leading-tight">{admin.name}</h3>
                                        <div className="flex gap-2">
                                            {admin.identifier === 'ADMIN-001' ? (
                                                <span className="inline-block px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-bold mt-1">
                                                    Super Admin
                                                </span>
                                            ) : (
                                                <span className="inline-block px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold mt-1">
                                                    Sub Admin
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {admin.identifier !== 'ADMIN-001' && (
                                    <button
                                        onClick={() => handleDelete(admin.id, admin.name)}
                                        disabled={deletingId === admin.id}
                                        className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition-colors disabled:opacity-50"
                                        title="Remove Admin"
                                    >
                                        {deletingId === admin.id ? <div className="w-5 h-5 border-2 border-red-500/20 border-t-red-500 rounded-full animate-spin" /> : <Trash2 size={20} />}
                                    </button>
                                )}
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 group-hover:bg-white border border-transparent group-hover:border-gray-100 transition-colors">
                                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-gray-400 shadow-sm">
                                        <Mail size={16} />
                                    </div>
                                    <span className="text-sm font-medium text-gray-600 truncate">{admin.email}</span>
                                </div>

                                {admin.phone && (
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 group-hover:bg-white border border-transparent group-hover:border-gray-100 transition-colors">
                                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-gray-400 shadow-sm">
                                            <Phone size={16} />
                                        </div>
                                        <span className="text-sm font-medium text-gray-600">{admin.phone}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <AddSubAdminModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={fetchAdmins}
            />
        </div>
    );
}

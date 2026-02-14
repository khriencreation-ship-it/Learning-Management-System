"use client";

import { X, Search, Check, BookOpen } from 'lucide-react';
import { useState, useEffect } from 'react';

interface AddCourseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd?: (courseIds: string[]) => void;
    existingCourseIds?: string[];
}

export default function AddCourseModal({ isOpen, onClose, onAdd, existingCourseIds = [] }: AddCourseModalProps) {
    const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    const [allCourses, setAllCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Fetch courses when modal opens
    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            fetch('/api/admin/courses')
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        setAllCourses(data);
                    } else {
                        console.error('Invalid data format', data);
                        setAllCourses([]);
                    }
                    setLoading(false);
                })
                .catch(err => {
                    console.error('Failed to fetch courses', err);
                    setLoading(false);
                });
        }
    }, [isOpen]);

    const filteredCourses = allCourses.filter(course =>
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.code?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleCourse = (id: string) => {
        if (existingCourseIds.includes(id)) return; // Prevent selection

        if (selectedCourses.includes(id)) {
            setSelectedCourses(selectedCourses.filter(c => c !== id));
        } else {
            setSelectedCourses([...selectedCourses, id]);
        }
    };

    const handleAdd = () => {
        if (onAdd) {
            onAdd(selectedCourses);
        }
        setSelectedCourses([]);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="relative bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Add Courses</h2>
                        <p className="text-gray-500 text-sm">Select courses to assign to this cohort.</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                {/* Search */}
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by title or code..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto space-y-2 mb-6 pr-2">
                    {loading ? (
                        <div className="text-center py-8 text-gray-400">Loading courses...</div>
                    ) : filteredCourses.length > 0 ? (
                        filteredCourses.map((course) => {
                            const isSelected = selectedCourses.includes(course.id);
                            const isAlreadyAdded = existingCourseIds.includes(course.id);

                            return (
                                <div
                                    key={course.id}
                                    onClick={() => toggleCourse(course.id)}
                                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${isAlreadyAdded
                                            ? 'bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed'
                                            : isSelected
                                                ? 'bg-purple-50 border-primary cursor-pointer'
                                                : 'bg-white border-gray-100 hover:bg-gray-50 cursor-pointer'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${isAlreadyAdded
                                                ? 'bg-gray-200 text-gray-500'
                                                : isSelected
                                                    ? 'bg-primary text-white'
                                                    : 'bg-orange-100 text-orange-600'
                                            }`}>
                                            <BookOpen size={20} />
                                        </div>
                                        <div>
                                            <p className={`font-semibold text-sm ${isSelected ? 'text-primary' : 'text-gray-900'}`}>{course.title}</p>
                                            <p className="text-xs text-gray-500 font-mono">{course.code}</p>
                                        </div>
                                    </div>
                                    {isAlreadyAdded ? (
                                        <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-1 rounded">Added</span>
                                    ) : isSelected && (
                                        <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center">
                                            <Check size={14} />
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-8 text-gray-500 text-sm">
                            {searchQuery ? `No courses found matching "${searchQuery}"` : "No courses available."}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <button
                    onClick={handleAdd}
                    className="w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={selectedCourses.length === 0}
                >
                    Add {selectedCourses.length} Courses
                </button>
            </div>
        </div>
    );
}

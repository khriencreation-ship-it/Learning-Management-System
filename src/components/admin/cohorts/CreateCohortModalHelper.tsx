"use client";

import { useState } from 'react';
import { Plus } from 'lucide-react';
import CreateCohortModal from '../CreateCohortModal';

export default function CreateCohortModalHelper() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-2xl font-bold hover:bg-purple-700 transition-all shadow-xl shadow-purple-200 active:scale-95 group"
            >
                <Plus size={22} className="group-hover:rotate-90 transition-transform duration-300" />
                Create New Cohort
            </button>
            <CreateCohortModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
            />
        </>
    );
}

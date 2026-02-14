"use client";

import { useState } from 'react';
import StudentsTab from './StudentsTab';
import CoursesTab from './CoursesTab';
import TutorsTab from './TutorsTab';
import AnnouncementsTab from './AnnouncementsTab';

interface CohortTabsProps {
    cohortId: string;
    cohortName: string;
    description?: string;
    students: any[];
    courses: any[];
    tutors: any[];
}

export default function CohortTabs({ cohortId, cohortName, description, students, courses, tutors }: CohortTabsProps) {
    const [activeTab, setActiveTab] = useState<'about' | 'students' | 'courses' | 'tutors' | 'announcements'>('about');

    return (
        <>
            {/* Tabs Navigation */}
            <div className="flex items-center gap-8 border-b border-gray-200 mb-8 px-4 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('about')}
                    className={`pb-4 text-sm font-semibold transition-colors relative whitespace-nowrap ${activeTab === 'about' ? 'text-primary' : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    About Cohort
                    {activeTab === 'about' && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('students')}
                    className={`pb-4 text-sm font-semibold transition-colors relative ${activeTab === 'students' ? 'text-primary' : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Students
                    {activeTab === 'students' && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('courses')}
                    className={`pb-4 text-sm font-semibold transition-colors relative ${activeTab === 'courses' ? 'text-primary' : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Courses
                    {activeTab === 'courses' && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('tutors')}
                    className={`pb-4 text-sm font-semibold transition-colors relative ${activeTab === 'tutors' ? 'text-primary' : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Tutors
                    {activeTab === 'tutors' && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('announcements')}
                    className={`pb-4 text-sm font-semibold transition-colors relative ${activeTab === 'announcements' ? 'text-primary' : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Announcements
                    {activeTab === 'announcements' && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full" />
                    )}
                </button>
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
                {activeTab === 'about' && (
                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">About {cohortName}</h3>
                        {description ? (
                            <div className="prose prose-purple max-w-none text-gray-600 leading-relaxed">
                                <p>{description}</p>
                            </div>
                        ) : (
                            <div className="text-gray-400 italic">No description available for this cohort.</div>
                        )}
                    </div>
                )}
                {activeTab === 'students' && <StudentsTab cohortId={cohortId} cohortName={cohortName} initialStudents={students} />}
                {activeTab === 'courses' && <CoursesTab cohortId={cohortId} cohortName={cohortName} initialCourses={courses} />}
                {activeTab === 'tutors' && <TutorsTab cohortId={cohortId} cohortName={cohortName} initialTutors={tutors} />}
                {activeTab === 'announcements' && <AnnouncementsTab cohortId={cohortId} cohortName={cohortName} />}
            </div>
        </>
    );
}

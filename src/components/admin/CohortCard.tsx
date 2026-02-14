import Link from 'next/link';
import Image from 'next/image';
import { Users, Calendar, ArrowRight, BookOpen, GraduationCap } from 'lucide-react';

interface CohortCardProps {
    id: string;
    name: string;
    batch: string;
    image?: string;
    description?: string;
    startDate: string;
    endDate: string;
    status: 'Active' | 'Upcoming' | 'Completed';
    students: number;
    courses: number;
    tutors: number;
}

export default function CohortCard({
    id,
    name,
    batch,
    image,
    description,
    startDate,
    endDate,
    status,
    students,
    courses,
    tutors,
    linkPrefix = '/admin/cohorts'
}: CohortCardProps & { linkPrefix?: string }) {
    const statusConfig = {
        Active: { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
        Upcoming: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
        Completed: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500' },
    };

    const style = statusConfig[status as keyof typeof statusConfig] || statusConfig.Upcoming;

    return (
        <Link href={`${linkPrefix}/${id}`} className="group bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden border border-gray-100 h-full flex flex-col block">
            {/* Cover Image */}
            <div className="relative h-40 w-full overflow-hidden">
                {image ? (
                    <Image
                        src={image}
                        alt={name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-purple-100 to-blue-50 flex items-center justify-center">
                        <Users size={40} className="text-primary/20" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                <div className={`absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md border border-white/20 shadow-lg ${style.bg} ${style.text}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                    {status}
                </div>
            </div>

            <div className="p-6 flex-1 flex flex-col">
                {/* Header */}
                <div className="mb-6">
                    <h3 className="text-xl font-bold text-gray-900 leading-tight group-hover:text-primary transition-colors">{name}</h3>
                    <p className="text-gray-500 text-sm mt-1 font-medium">{batch}</p>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-6 mb-8 mt-auto">
                    {/* Date Range */}
                    <div className="col-span-2 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                            <Calendar size={20} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Duration</p>
                            <p className="text-sm font-semibold text-gray-900 truncate">
                                {startDate} - {endDate}
                            </p>
                        </div>
                    </div>

                    {/* Students */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500 shrink-0">
                            <Users size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Students</p>
                            <p className="text-sm font-semibold text-gray-900">{students}</p>
                        </div>
                    </div>

                    {/* Courses */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                            <BookOpen size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Courses</p>
                            <p className="text-sm font-semibold text-gray-900">{courses}</p>
                        </div>
                    </div>

                    {/* Tutors */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center text-pink-500 shrink-0">
                            <GraduationCap size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Tutors</p>
                            <p className="text-sm font-semibold text-gray-900">{tutors}</p>
                        </div>
                    </div>
                </div>

                {/* Button */}
                <div
                    className="w-full py-3 bg-slate-900 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 group-hover:bg-primary transition-colors duration-300"
                >
                    View Details
                    <ArrowRight size={16} />
                </div>
            </div>
        </Link>
    );
}

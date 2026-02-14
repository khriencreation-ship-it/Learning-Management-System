import { Bell, Search } from 'lucide-react';
import Image from 'next/image';

export default function TopBar() {
    return (
        <header className="flex items-center justify-between mb-8 pt-2">
            <h1 className="text-2xl font-bold text-gray-900">Courses</h1>

            <div className="flex items-center gap-4">
                {/* Streak Badge */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full border border-gray-100 shadow-sm">
                    <span className="text-orange-500 text-lg">🔥</span>
                    <span className="text-sm font-semibold text-gray-700">3 days</span>
                </div>

                {/* Notification */}
                <button className="relative p-2 bg-white rounded-full border border-gray-100 shadow-sm hover:bg-gray-50">
                    <Bell size={20} className="text-gray-600" />
                    <span className="absolute top-0 right-0 w-4 h-4 bg-black text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white">
                        2
                    </span>
                </button>

                {/* Profile */}
                <div className="w-10 h-10 rounded-full bg-yellow-200 overflow-hidden border-2 border-white shadow-sm cursor-pointer">
                    {/* Placeholder Avatar */}
                    <div className="w-full h-full flex items-center justify-center text-yellow-700 font-bold">
                        JD
                    </div>
                </div>
            </div>
        </header>
    );
}

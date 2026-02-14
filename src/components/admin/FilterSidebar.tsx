import { X, Search } from 'lucide-react';

export default function FilterSidebar() {
    return (
        <aside className="w-80 bg-white border-l border-gray-100 p-6 hidden xl:block h-screen sticky top-0 overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-lg font-bold text-gray-900">Filters</h2>
                <button className="text-gray-400 hover:text-gray-600">
                    <X size={20} />
                </button>
            </div>

            {/* Filter Group: Language */}
            <div className="mb-8">
                <div className="flex gap-2 mb-4">
                    <span className="px-3 py-1.5 rounded-full bg-gray-50 text-gray-600 text-sm font-medium border border-gray-100 cursor-pointer hover:bg-gray-100">
                        Intermediate
                        <X size={14} className="inline ml-1" />
                    </span>
                    <span className="px-3 py-1.5 rounded-full bg-gray-50 text-gray-600 text-sm font-medium border border-gray-100 cursor-pointer hover:bg-gray-100">
                        English
                        <X size={14} className="inline ml-1" />
                    </span>
                </div>
                <div className="flex gap-2">
                    <span className="px-3 py-1.5 rounded-full bg-gray-50 text-gray-600 text-sm font-medium border border-gray-100 cursor-pointer hover:bg-gray-100">
                        6+ months
                        <X size={14} className="inline ml-1" />
                    </span>
                </div>
            </div>

            {/* Filter Group: Difficulty */}
            <div className="mb-8">
                <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Difficulty Level</h3>
                <div className="space-y-3">
                    <Checkbox label="Beginner" />
                    <Checkbox label="Intermediate" checked />
                    <Checkbox label="Advanced" />
                </div>
            </div>

            {/* Filter Group: Duration */}
            <div className="mb-8">
                <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Course Duration</h3>
                <div className="space-y-3">
                    <Checkbox label="Less than 1 month" />
                    <Checkbox label="1-3 months" />
                    <Checkbox label="3+ months" />
                    <Checkbox label="6+ months" checked />
                </div>
            </div>

            {/* Filter Group: Popularity */}
            <div className="mb-8">
                <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Popularity</h3>
                <div className="space-y-3">
                    <Checkbox label="Most Enrolled" />
                    <Checkbox label="Highest Rated" />
                    <Checkbox label="Trending" />
                </div>
            </div>

            {/* Filter Group: Language */}
            <div className="mb-8">
                <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Language</h3>
                <div className="space-y-3">
                    <Checkbox label="English" checked />
                    <Checkbox label="Spanish" />
                    <Checkbox label="German" />
                </div>
            </div>

        </aside>
    );
}

function Checkbox({ label, checked = false }: { label: string; checked?: boolean }) {
    return (
        <label className="flex items-center gap-3 cursor-pointer group">
            <div
                className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${checked ? 'bg-black border-black' : 'border-gray-200 group-hover:border-gray-300'
                    }`}
            >
                {checked && <div className="w-2 h-2 bg-white rounded-sm" />}
            </div>
            <span className={`text-sm ${checked ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>{label}</span>
        </label>
    );
}

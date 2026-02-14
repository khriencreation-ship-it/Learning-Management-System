import { LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    color: 'blue' | 'purple' | 'green' | 'orange';
}

export default function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
    const colorStyles = {
        blue: { bg: 'bg-blue-50', text: 'text-blue-600', iconBg: 'bg-blue-100' },
        purple: { bg: 'bg-purple-50', text: 'text-purple-600', iconBg: 'bg-purple-100' },
        green: { bg: 'bg-green-50', text: 'text-green-600', iconBg: 'bg-green-100' },
        orange: { bg: 'bg-orange-50', text: 'text-orange-600', iconBg: 'bg-orange-100' },
    };

    const style = colorStyles[color];

    return (
        <div className=" p-6 rounded-xl rounded-[2rem] bg-white shadow-sm border border-gray-100 flex items-center justify-between transition-transform hover:scale-[1.02] duration-200">
            <div>
                <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
                <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
            </div>
            <div className={`p-4 rounded-xl ${style.bg}`}>
                <Icon size={24} className={style.text} />
            </div>
        </div>
    );
}

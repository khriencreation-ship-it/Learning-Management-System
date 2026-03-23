import React from 'react';
import { ShieldCheck, AlertTriangle, ShieldAlert } from 'lucide-react';

interface ScoreCardProps {
    score: number;
    verdict: string;
    confidence: "High" | "Medium";
}

export const ScoreCard: React.FC<ScoreCardProps> = ({ score, verdict, confidence }) => {
    const getColors = () => {
        if (score > 60) return { text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: ShieldAlert, colorName: 'red' };
        if (score > 30) return { text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: AlertTriangle, colorName: 'amber' };
        return { text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: ShieldCheck, colorName: 'emerald' };
    };

    const { text, bg, border, icon: Icon, colorName } = getColors();

    return (
        <div className={`p-6 rounded-2xl border ${border} ${bg} flex flex-col items-center justify-center text-center transition-all hover:shadow-md`}>
            <div className="relative mb-4">
                <div className={`w-24 h-24 rounded-full border-4 border-${colorName}-200 flex items-center justify-center bg-white shadow-inner`}>
                    <span className={`text-3xl font-bold ${text}`}>{score}<span className="text-sm opacity-60">/100</span></span>
                </div>
                <div className="absolute -bottom-2 -right-2 p-1.5 bg-white rounded-full shadow-sm border border-gray-100">
                    <Icon className={`w-5 h-5 ${text}`} />
                </div>
            </div>

            <h3 className={`text-xl font-bold mb-1 ${text}`}>{verdict}</h3>
            <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Confidence Level:</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${confidence === 'High' ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-700'}`}>
                    {confidence}
                </span>
            </div>
        </div>
    );
};

import React from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface FlagsListProps {
    flags: string[];
}

export const FlagsList: React.FC<FlagsListProps> = ({ flags }) => {
    return (
        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 h-full">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 px-1 flex items-center gap-2">
                Detection Flags
            </h4>

            {flags.length > 0 ? (
                <ul className="space-y-2">
                    {flags.map((flag, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-100">
                            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>{flag}</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center space-y-2">
                    <div className="p-3 bg-emerald-100 rounded-full">
                        <CheckCircle className="w-6 h-6 text-emerald-600" />
                    </div>
                    <p className="text-xs font-medium text-emerald-700">No suspicious patterns detected.</p>
                    <p className="text-[10px] text-gray-400 leading-tight">The content exhibits natural human-like variation.</p>
                </div>
            )}
        </div>
    );
};

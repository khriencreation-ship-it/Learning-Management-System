
'use client';

import { useState, useEffect } from 'react';
import {
    Zap,
    ShieldAlert,
    ShieldCheck,
    BarChart3,
    AlertTriangle,
    RefreshCw,
    Info,
    CheckCircle2,
    XCircle,
    Activity,
    BrainCircuit,
    Sparkles,
    Type,
    FileText,
    History,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface AIPlagiarismCheckerProps {
    studentId: string;
    assignmentId: string;
    initialText?: string;
    availableSources?: { label: string, value: string }[];
    availableFiles?: { name: string, url: string }[];
}

interface AnalysisResult {
    final_score: number;
    verdict: "Likely Human Written" | "Uncertain - Needs Review" | "Likely AI Generated";
    confidence_level: "High" | "Medium";
    breakdown: {
        perplexity_score: number;
        burstiness_score: number;
        vocabulary_score: number;
        filler_phrase_score: number;
        stylistic_score: number;
    };
    flags: string[];
    total_word_count: number;
    analyzed_at: string;
}

export default function AIPlagiarismChecker({
    studentId,
    assignmentId,
    initialText = "",
    availableSources = [],
    availableFiles = []
}: AIPlagiarismCheckerProps) {
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [extracting, setExtracting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [inputText, setInputText] = useState(initialText);
    const [isEditing, setIsEditing] = useState(!initialText);
    const [showHistory, setShowHistory] = useState(false);

    useEffect(() => {
        fetchPreviousResult();
    }, [studentId, assignmentId]);

    useEffect(() => {
        if (initialText && !inputText) {
            setInputText(initialText);
        }
    }, [initialText]);

    const fetchPreviousResult = async () => {
        try {
            const res = await fetch(`/api/analyze?student_id=${studentId}&assignment_id=${assignmentId}`);
            if (res.ok) {
                const data = await res.json();
                setResult(data);
                if (data && initialText !== inputText) {
                    // If we have a result, don't force edit mode if there's content
                    setIsEditing(false);
                }
            }
        } catch (err) {
            console.error('Failed to fetch previous analysis:', err);
        }
    };

    const handleFileExtract = async (fileUrl: string, fileName: string) => {
        if (!fileUrl.toLowerCase().endsWith('.pdf') && !fileUrl.toLowerCase().endsWith('.docx')) {
            setError('Auto-extraction currently only supports PDF and DOCX files. For other formats, please copy and paste the text.');
            return;
        }

        setExtracting(true);
        setError(null);
        try {
            const res = await fetch('/api/analyze/extract', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: fileUrl })
            });

            if (!res.ok) throw new Error('Failed to extract text from file');

            const data = await res.json();
            if (data.text) {
                setInputText(data.text);
                setIsEditing(true);
            }
        } catch (err: any) {
            setError('Extraction failed. You may need to copy the text manually.');
            console.error(err);
        } finally {
            setExtracting(false);
        }
    };

    const runAnalysis = async () => {
        const words = inputText.trim().split(/\s+/).filter(Boolean);
        if (words.length < 20) {
            setError('Content is too short for a reliable AI analysis Scan. (Min 20 words required)');
            return;
        }

        setLoading(true);
        setScanning(true);
        setError(null);

        // Simulated delay for "AI-like" experience
        await new Promise(r => setTimeout(r, 2000));

        try {
            const session = await supabase.auth.getSession();
            const token = session.data.session?.access_token;

            const res = await fetch('/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    student_id: studentId,
                    assignment_id: assignmentId,
                    text: inputText,
                    submission_source: "manual_input"
                })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Analysis failed');
            }

            const data = await res.json();
            setResult(data);
            setIsEditing(false);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
            setScanning(false);
        }
    };

    const getVerdictColor = (verdict: string) => {
        switch (verdict) {
            case "Likely Human Written": return "text-emerald-400";
            case "Uncertain - Needs Review": return "text-amber-400";
            case "Likely AI Generated": return "text-rose-400";
            default: return "text-white";
        }
    };

    const getProgressColor = (score: number) => {
        if (score < 30) return "stroke-emerald-500";
        if (score < 60) return "stroke-amber-500";
        return "stroke-rose-500";
    };

    const getBgProgressColor = (score: number) => {
        if (score < 30) return "bg-emerald-500";
        if (score < 60) return "bg-amber-500";
        return "bg-rose-500";
    };

    if (scanning) {
        return (
            <div className="p-12 bg-gray-900 border border-white/10 rounded-[2.5rem] flex flex-col items-center justify-center space-y-8 animate-pulse relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-purple-500/10" />
                <div className="w-24 h-24 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                <div className="space-y-2 text-center relative z-10">
                    <h3 className="text-xl font-black text-white tracking-tight flex items-center justify-center gap-2">
                        <BrainCircuit className="text-primary animate-pulse" />
                        AI Pattern Analysis
                    </h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Decoding linguistic fingerprints...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-900 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl transition-all duration-500">
            {/* Input Selection Area */}
            {isEditing ? (
                <div className="p-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h3 className="text-xl font-black text-white tracking-tight leading-none">Content Integrity Scan</h3>
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Select text source or paste content below</p>
                        </div>
                        {result && (
                            <button
                                onClick={() => setIsEditing(false)}
                                className="text-[10px] text-gray-400 hover:text-white font-black uppercase tracking-widest flex items-center gap-2"
                            >
                                <XCircle size={14} />
                                Cancel
                            </button>
                        )}
                    </div>

                    {(availableSources.length > 0 || availableFiles.length > 0) && (
                        <div className="flex flex-wrap gap-2">
                            {availableSources.map((source, i) => (
                                <button
                                    key={`source-${i}`}
                                    onClick={() => setInputText(source.value)}
                                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2"
                                >
                                    <Type size={12} className="text-primary" />
                                    Use {source.label}
                                </button>
                            ))}
                            {availableFiles.map((file, i) => (
                                <button
                                    key={`file-${i}`}
                                    onClick={() => handleFileExtract(file.url, file.name)}
                                    disabled={extracting}
                                    className="px-4 py-2 bg-primary/5 border border-primary/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-primary hover:text-white hover:bg-primary/20 transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    {extracting ? (
                                        <RefreshCw size={12} className="animate-spin" />
                                    ) : (
                                        <FileText size={12} />
                                    )}
                                    Scan {file.name.length > 15 ? file.name.substring(0, 15) + '...' : file.name}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="relative group">
                        <div className="absolute top-4 left-4 text-primary opacity-50 group-focus-within:opacity-100 transition-opacity">
                            <Type size={18} />
                        </div>
                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Paste student text here for AI detection analysis..."
                            className="w-full min-h-[160px] bg-white/[0.03] border border-white/10 focus:border-primary/50 focus:ring-4 focus:ring-primary/5 rounded-3xl p-6 pl-12 text-sm font-medium text-white outline-none transition-all placeholder:text-gray-700 leading-relaxed"
                        />
                        <div className="absolute bottom-4 right-4 text-[9px] font-black text-gray-600 uppercase tracking-widest">
                            {inputText.split(/\s+/).filter(Boolean).length} Words
                        </div>
                    </div>

                    {error && (
                        <div className="px-6 py-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-300 animate-in fade-in slide-in-from-top-2">
                            <AlertTriangle size={16} />
                            <p className="text-[11px] font-bold">{error}</p>
                        </div>
                    )}

                    <button
                        onClick={runAnalysis}
                        disabled={loading || inputText.length < 50}
                        className="w-full flex items-center justify-center gap-3 py-5 bg-primary hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] group"
                    >
                        <Sparkles size={18} className="group-hover:rotate-12 transition-transform" />
                        Initiate AI Analysis
                    </button>
                </div>
            ) : result ? (
                <div className="animate-in fade-in duration-700">
                    {/* Result Header */}
                    <div className="p-8 border-b border-white/5 bg-white/[0.02] flex flex-col md:flex-row md:items-center justify-between gap-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                            <BrainCircuit size={120} />
                        </div>

                        <div className="flex items-center gap-6 relative z-10">
                            <div className="relative w-24 h-24">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle
                                        cx="48"
                                        cy="48"
                                        r="42"
                                        fill="transparent"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        className="text-white/5"
                                    />
                                    <circle
                                        cx="48"
                                        cy="48"
                                        r="42"
                                        fill="transparent"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        strokeDasharray={263.9}
                                        strokeDashoffset={263.9 - (263.9 * result.final_score) / 100}
                                        strokeLinecap="round"
                                        className={`${getProgressColor(result.final_score)} transition-all duration-1000 ease-out`}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-2xl font-black text-white leading-none">{result.final_score}%</span>
                                    <span className="text-[8px] font-black text-gray-500 uppercase tracking-tighter">AI Probability</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <h4 className={`text-2xl font-black tracking-tight ${getVerdictColor(result.verdict)}`}>
                                    {result.verdict}
                                </h4>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                                    <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest flex items-center gap-1.5">
                                        <Activity size={12} className="text-primary" />
                                        Confidence: <span className="text-white">{result.confidence_level}</span>
                                    </span>
                                    <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest flex items-center gap-1.5">
                                        <Info size={12} className="text-primary" />
                                        {result.total_word_count} Words Analyzed
                                    </span>
                                    <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest flex items-center gap-1.5">
                                        <History size={12} />
                                        {new Date(result.analyzed_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 relative z-10">
                            <button
                                onClick={() => setIsEditing(true)}
                                className="px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all"
                            >
                                <RefreshCw size={14} />
                                New Scan
                            </button>
                        </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-5 divide-x divide-white/5 border-b border-white/5">
                        {[
                            { label: 'Complexity', val: result.breakdown.perplexity_score },
                            { label: 'Variation', val: result.breakdown.burstiness_score },
                            { label: 'Vocabulary', val: result.breakdown.vocabulary_score },
                            { label: 'Simplicity', val: result.breakdown.filler_phrase_score },
                            { label: 'Style Match', val: result.breakdown.stylistic_score }
                        ].map((m, i) => (
                            <div key={i} className="p-6 space-y-2 group hover:bg-white/[0.01] transition-colors">
                                <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">{m.label}</p>
                                <div className="flex items-end gap-1">
                                    <p className="text-lg font-black text-white leading-none">{m.val}</p>
                                    <span className="text-[10px] text-gray-600 mb-0.5">%</span>
                                </div>
                                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${getBgProgressColor(m.val)} transition-all duration-1000`}
                                        style={{ width: `${m.val}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Analyzed Text Toggle */}
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className="w-full p-4 hover:bg-white/[0.02] flex items-center justify-between text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5 transition-colors"
                    >
                        <span className="flex items-center gap-2">
                            <FileText size={14} className="text-primary" />
                            View Analyzed Excerpt
                        </span>
                        {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    {showHistory && (
                        <div className="p-8 bg-black/20 border-b border-white/5 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="p-6 bg-white/[0.02] rounded-3xl border border-white/5 text-xs text-gray-400 font-medium italic leading-relaxed max-h-[200px] overflow-y-auto">
                                "{inputText}"
                            </div>
                        </div>
                    )}

                    {/* Status Feedback */}
                    <div className={`p-8 ${result.flags.length > 0 ? 'bg-rose-500/5' : 'bg-emerald-500/5'} transition-all`}>
                        {result.flags.length > 0 ? (
                            <div className="space-y-4">
                                <h5 className="text-[10px] text-rose-400 font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                    <ShieldAlert size={14} />
                                    Detected Anomalies
                                </h5>
                                <div className="flex flex-wrap gap-3">
                                    {result.flags.map((f, i) => (
                                        <span key={i} className="px-4 py-2 bg-rose-500/10 border border-rose-500/20 text-rose-200 text-xs font-bold rounded-xl flex items-center gap-2">
                                            <AlertTriangle size={12} className="text-rose-500" />
                                            {f}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4 text-emerald-400">
                                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center shadow-inner shadow-emerald-500/10">
                                    <ShieldCheck size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest">Verification Complete</p>
                                    <p className="text-[10px] text-emerald-400/60 font-medium">Linguistic markers suggest natural, human-written patterns.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : null}
        </div>
    );
}

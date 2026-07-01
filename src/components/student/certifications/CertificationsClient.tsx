'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import DashboardLayout from '@/components/student/DashboardLayout';
import { Award, BookOpen, Layers, CheckCircle2, XCircle, ChevronDown, ChevronUp, Download, Printer, Settings, RefreshCw, Sparkles, HelpCircle, Eye } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function CertificationsClient() {
    const [courses, setCourses] = useState<any[]>([]);
    const [studentName, setStudentName] = useState('Student');
    const [loading, setLoading] = useState(true);
    const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);

    // Modal state for certificate generator
    const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
    const [certImage, setCertImage] = useState<HTMLImageElement | null>(null);

    // Customization Settings
    const [yOffset, setYOffset] = useState(51.0); // vertical position percentage (from top)
    const [fontSize, setFontSize] = useState(120);  // font size in px
    const [fontFamily, setFontFamily] = useState('Alex Brush'); // font family
    const [fontStyle, setFontStyle] = useState('normal'); // italic or normal
    const [textColor, setTextColor] = useState('#4c1d95'); // Royal Purple

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [fontsReady, setFontsReady] = useState(false);

    // Load custom fonts dynamically from Google Fonts
    useEffect(() => {
        const link = document.createElement('link');
        link.href = 'https://fonts.googleapis.com/css2?family=Alex+Brush&family=Great+Vibes&family=Playfair+Display:ital,wght@0,600;1,600&family=Montserrat:wght@600&family=Parisienne&display=swap';
        link.rel = 'stylesheet';
        document.head.appendChild(link);

        // Check if fonts API is supported and trigger loading
        if (typeof document !== 'undefined' && 'fonts' in document) {
            document.fonts.load('120px "Alex Brush"').then(() => {
                setFontsReady(true);
            });
            document.fonts.ready.then(() => {
                setFontsReady(true);
            });
        } else {
            // Fallback for older browsers
            setTimeout(() => setFontsReady(true), 1500);
        }

        return () => {
            try {
                document.head.removeChild(link);
            } catch (e) {
                // ignore if already removed
            }
        };
    }, []);

    // Load courses and profile
    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) return;

                const res = await fetch('/api/student/certifications', {
                    headers: { 'Authorization': `Bearer ${session.access_token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    setCourses(data.courses || []);
                    setStudentName(data.studentName || 'Student');
                }
            } catch (error) {
                console.error('Failed to fetch certifications details:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Preload certificate template image when component mounts
    useEffect(() => {
        const img = new Image();
        img.src = '/Blue Modern Certificate of Completion.jpg';
        img.onload = () => {
            setCertImage(img);
        };
        img.onerror = (e) => {
            console.error('Failed to load certificate template image:', e);
        };
    }, []);

    // Redraw canvas on preview settings change
    useEffect(() => {
        if (!canvasRef.current || !certImage || !selectedCourse) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clean & draw base template
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(certImage, 0, 0, canvas.width, canvas.height);

        // Name text rendering settings
        ctx.fillStyle = textColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Set dynamic font details
        const stylePrefix = fontStyle === 'italic' ? 'italic ' : '';
        ctx.font = `${stylePrefix}${fontSize}px "${fontFamily}", cursive, serif`;

        // Calculate dynamic coordinates (high-res canvas is 2000 x 1414)
        const x = canvas.width / 2;
        const y = canvas.height * (yOffset / 100);

        ctx.fillText(studentName, x, y);
    }, [certImage, selectedCourse, yOffset, fontSize, fontFamily, fontStyle, textColor, studentName, fontsReady]);

    // Statistics computation
    const stats = useMemo(() => {
        const total = courses.length;
        const earned = courses.filter(c => c.isEligible).length;
        const inProgress = total - earned;
        const avgProgress = total > 0 
            ? Math.round(courses.reduce((acc, c) => acc + c.progress, 0) / total) 
            : 0;

        return { total, earned, inProgress, avgProgress };
    }, [courses]);

    // Handle Certificate Customizer Open
    const openCustomizer = (course: any) => {
        setSelectedCourse(course);
        // Default settings resets
        setYOffset(51.0);
        setFontSize(120);
        setFontFamily('Alex Brush');
        setFontStyle('normal');
        setTextColor('#4c1d95'); // Royal Purple
    };

    // Download high-resolution image
    const handleDownload = (format: 'png' | 'jpeg') => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
        const extension = format === 'jpeg' ? 'jpg' : 'png';
        const dataUrl = canvas.toDataURL(mimeType, 1.0);

        const link = document.createElement('a');
        link.download = `Certificate_${selectedCourse.code || 'Completion'}_${studentName.replace(/\s+/g, '_')}.${extension}`;
        link.href = dataUrl;
        link.click();
    };

    // Trigger Print
    const handlePrint = () => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const dataUrl = canvas.toDataURL('image/png');

        const windowPrint = window.open('', '_blank');
        if (windowPrint) {
            windowPrint.document.write(`
                <html>
                    <head>
                        <title>Print Certificate - ${selectedCourse.title}</title>
                        <style>
                            body { margin: 0; display: flex; align-items: center; justify-content: center; height: 100vh; background-color: #f3f4f6; }
                            img { max-width: 100%; max-height: 100%; object-fit: contain; }
                            @media print {
                                body { background-color: transparent; }
                                @page { size: landscape; margin: 0; }
                                img { width: 100%; height: 100%; object-fit: contain; }
                            }
                        </style>
                    </head>
                    <body onload="window.print();window.close();">
                        <img src="${dataUrl}" />
                    </body>
                </html>
            `);
            windowPrint.document.close();
        }
    };

    return (
        <DashboardLayout isLoading={loading}>
            <div className="max-w-6xl mx-auto py-6 space-y-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-2">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
                            <Award className="text-purple-600 w-10 h-10" />
                            Certifications
                        </h1>
                        <p className="text-gray-500 font-medium text-lg">
                            Earn and generate your professional certificates as you pass 70% course progress.
                        </p>
                    </div>
                </div>

                {/* Stats Dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-5 group hover:shadow-md transition-all">
                        <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                            <Award size={28} />
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Earned Certs</p>
                            <h3 className="text-3xl font-bold text-gray-900">{stats.earned}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-5 group hover:shadow-md transition-all">
                        <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                            <RefreshCw size={28} className={stats.inProgress > 0 ? "animate-spin-slow" : ""} />
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">In Progress</p>
                            <h3 className="text-3xl font-bold text-gray-900">{stats.inProgress}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-5 group hover:shadow-md transition-all">
                        <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                            <BookOpen size={28} />
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Total Enrolled</p>
                            <h3 className="text-3xl font-bold text-gray-900">{stats.total}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-5 group hover:shadow-md transition-all">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                            <Sparkles size={28} />
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Avg Progress</p>
                            <h3 className="text-3xl font-bold text-gray-900">{stats.avgProgress}%</h3>
                        </div>
                    </div>
                </div>

                {/* Courses Listing */}
                {courses.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 border-dashed text-center shadow-sm">
                        <div className="w-20 h-20 rounded-full bg-purple-50 flex items-center justify-center text-purple-300 mb-6">
                            <Award size={40} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No Enrolled Courses</h3>
                        <p className="text-gray-500 max-w-sm">
                            You are not enrolled in any courses that generate certifications yet.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {courses.map((course) => {
                            const isExpanded = expandedCourseId === course.id;
                            return (
                                <div 
                                    key={course.id} 
                                    className="bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden"
                                >
                                    {/* Card Header & Thumbnail */}
                                    <div className="p-6 flex gap-5 items-start">
                                        <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-purple-50 flex-shrink-0 border border-purple-100 flex items-center justify-center text-purple-400">
                                            {course.image ? (
                                                <img 
                                                    src={course.image} 
                                                    alt={course.title} 
                                                    className="w-full h-full object-cover" 
                                                />
                                            ) : (
                                                <BookOpen size={36} />
                                            )}
                                        </div>
                                        <div className="space-y-1 min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                    {course.code || 'COURSE'}
                                                </span>
                                                <span className="text-[10px] font-semibold text-gray-400">
                                                    by {course.instructor || 'Tutor'}
                                                </span>
                                            </div>
                                            <h3 className="text-xl font-extrabold text-gray-900 leading-snug truncate" title={course.title}>
                                                {course.title}
                                            </h3>
                                            <p className="text-xs text-gray-400 font-medium truncate">
                                                {course.description || 'No description available.'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Progress Metrics & Bar */}
                                    <div className="px-6 py-4 bg-gray-50/50 border-t border-b border-gray-100/50 space-y-3">
                                        <div className="flex justify-between items-center text-xs">
                                            <div className="flex items-center gap-1.5 font-bold text-gray-500">
                                                <span>Progress:</span>
                                                <span className={`${course.progress >= 70 ? 'text-emerald-600' : 'text-purple-600'} text-sm font-black`}>
                                                    {course.progress}%
                                                </span>
                                            </div>
                                            <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                                                {course.completedCount} / {course.totalItems} Items
                                            </span>
                                        </div>
                                        <div className="relative w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-500 ease-out ${
                                                    course.progress >= 70 
                                                        ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' 
                                                        : 'bg-gradient-to-r from-purple-500 to-indigo-500'
                                                }`}
                                                style={{ width: `${Math.min(100, course.progress)}%` }}
                                            />
                                            {/* Target threshold indicator */}
                                            <div 
                                                className="absolute top-0 bottom-0 w-0.5 bg-gray-300/80 cursor-help"
                                                style={{ left: '70%' }}
                                                title="70% Passing Threshold"
                                            />
                                        </div>

                                        {/* Status message */}
                                        <div className="flex items-center justify-between pt-1">
                                            {course.isEligible ? (
                                                <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                                                    <CheckCircle2 size={13} />
                                                    {course.isBypassed ? 'Exempted Account (Developer Bypass)' : 'Eligible for certificate!'}
                                                </p>
                                            ) : (
                                                <p className="text-[11px] font-bold text-gray-400 flex items-center gap-1">
                                                    <XCircle size={13} className="text-purple-300" />
                                                    Need {course.remainingNeeded} more item{course.remainingNeeded > 1 ? 's' : ''} for 70% threshold.
                                                </p>
                                            )}

                                            {/* Toggle Breakdown */}
                                            <button
                                                onClick={() => setExpandedCourseId(isExpanded ? null : course.id)}
                                                className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-0.5 py-0.5 px-2 hover:bg-purple-50 rounded-lg transition-all"
                                            >
                                                <span>Breakdown</span>
                                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Expandable Progress Details */}
                                    {isExpanded && (
                                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 max-h-64 overflow-y-auto space-y-4 transition-all duration-300">
                                            <div className="flex justify-between items-center">
                                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">
                                                    Course Curriculum & Completion
                                                </h4>
                                                <span className="text-[10px] text-gray-400 font-bold bg-white px-2 py-0.5 rounded-md border border-gray-100 shadow-2xs">
                                                    Passing Mark: 70%
                                                </span>
                                            </div>
                                            
                                            {course.curriculum.length === 0 ? (
                                                <p className="text-xs text-gray-400 italic text-center py-4">No module items found in this course.</p>
                                            ) : (
                                                <div className="space-y-4">
                                                    {course.curriculum.map((mod: any) => (
                                                        <div key={mod.id} className="space-y-1.5">
                                                            <h5 className="text-xs font-bold text-gray-700 truncate">
                                                                {mod.title}
                                                            </h5>
                                                            <div className="space-y-1">
                                                                {mod.items.map((item: any) => (
                                                                    <div 
                                                                        key={item.id} 
                                                                        className="flex items-center justify-between text-xs py-1.5 px-3 bg-white rounded-xl border border-gray-100 hover:border-purple-100 transition-colors shadow-2xs"
                                                                    >
                                                                        <div className="flex items-center gap-2 truncate">
                                                                            <span className={`w-1.5 h-1.5 rounded-full ${
                                                                                item.type === 'quiz' ? 'bg-amber-400' : item.type === 'assignment' ? 'bg-blue-400' : 'bg-purple-400'
                                                                            }`} />
                                                                            <span className="text-gray-600 font-medium truncate" title={item.title}>
                                                                                {item.title}
                                                                            </span>
                                                                            <span className="text-[9px] font-bold text-gray-400 uppercase bg-gray-50 px-1 rounded-sm">
                                                                                {item.type}
                                                                            </span>
                                                                        </div>
                                                                        {item.isCompleted ? (
                                                                            <span className="text-[10px] font-extrabold text-emerald-600 flex items-center gap-0.5">
                                                                                <CheckCircle2 size={12} />
                                                                                Done
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-[10px] font-bold text-gray-400 flex items-center gap-0.5">
                                                                                <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                                                                                Pending
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Action Button */}
                                    <div className="p-6 mt-auto">
                                        {course.isEligible ? (
                                            <button
                                                onClick={() => openCustomizer(course)}
                                                className="w-full py-3.5 px-6 rounded-2xl text-sm font-bold text-white shadow-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 hover:scale-[1.01] hover:shadow-purple-200 transition-all duration-300 flex items-center justify-center gap-2 group"
                                            >
                                                <Award size={18} className="group-hover:rotate-12 transition-transform" />
                                                <span>Generate Certificate Now</span>
                                            </button>
                                        ) : (
                                            <div className="space-y-2">
                                                <button
                                                    disabled
                                                    className="w-full py-3.5 px-6 rounded-2xl text-sm font-bold bg-gray-100 text-gray-400 cursor-not-allowed flex items-center justify-center gap-2"
                                                >
                                                    <Award size={18} className="opacity-40" />
                                                    <span>Generate Certificate</span>
                                                </button>
                                                <p className="text-[10px] font-medium text-center text-purple-400">
                                                    Complete the course progress up to 70% to enable certificate generation.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Certificate Customizer Modal */}
                {selectedCourse && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[100] p-4 overflow-y-auto">
                        <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl border border-gray-100 overflow-hidden my-8 flex flex-col md:flex-row max-h-[90vh]">
                            {/* Canvas Preview Area */}
                            <div className="flex-1 bg-slate-900/95 p-6 flex flex-col items-center justify-center border-r border-slate-800 relative min-h-[320px] md:min-h-0">
                                <div className="absolute top-4 left-6 flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                                    <span className="text-xs font-bold text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
                                        <Eye size={13} />
                                        Certificate Real-time Preview
                                    </span>
                                </div>

                                <div className="w-full flex items-center justify-center overflow-auto max-h-[60vh] max-w-full p-4 mt-6">
                                    {/* HTML5 Canvas (high res 2000x1414, scaled responsive via style) */}
                                    <canvas
                                        ref={canvasRef}
                                        width={2000}
                                        height={1414}
                                        className="w-full max-w-2xl aspect-[1.414] rounded-xl shadow-2xl bg-white border border-slate-700/50 object-contain"
                                    />
                                </div>
                                <div className="text-[10px] text-slate-500 font-medium mt-3 text-center">
                                    * Renders at 2000x1414 high resolution for print quality download.
                                </div>
                            </div>

                            {/* Adjustment Side Control Panel */}
                            <div className="w-full md:w-96 p-8 flex flex-col overflow-y-auto max-h-[90vh] bg-white">
                                <div className="flex justify-between items-start pb-6 border-b border-gray-100">
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-extrabold text-gray-900 flex items-center gap-1.5">
                                            <Settings size={20} className="text-purple-600" />
                                            Certificate Info
                                        </h3>
                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                                            {selectedCourse.code} • {selectedCourse.title}
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => setSelectedCourse(null)}
                                        className="text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-xl p-2 transition-all"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="space-y-6 py-6 flex-1">
                                    {/* Name Field Info */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Student Name</label>
                                        <input
                                            type="text"
                                            value={studentName}
                                            readOnly
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-400 cursor-not-allowed outline-none select-none shadow-2xs"
                                            placeholder="Student Name"
                                        />
                                        <p className="text-[10px] text-gray-400 font-medium">
                                            * Autoloaded from your profile.
                                        </p>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="space-y-3 pt-6 border-t border-gray-100 mt-auto">
                                    <button
                                        onClick={() => handleDownload('jpeg')}
                                        className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg hover:shadow-purple-100 flex items-center justify-center gap-2 hover:scale-[1.01] transition-all cursor-pointer"
                                    >
                                        <Download size={16} />
                                        <span>Download Certificate (JPG)</span>
                                    </button>
                                    <button
                                        onClick={() => handleDownload('png')}
                                        className="w-full py-3 px-4 rounded-2xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                                    >
                                        <Download size={16} className="text-gray-400" />
                                        <span>Download High-Quality PNG</span>
                                    </button>
                                    <button
                                        onClick={handlePrint}
                                        className="w-full py-3 px-4 rounded-2xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                                    >
                                        <Printer size={16} className="text-gray-400" />
                                        <span>Print Certificate</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

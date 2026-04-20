'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Upload, Download, RefreshCw, Smartphone, Check, Sparkles } from 'lucide-react';
import { drawRoundedImage } from '@/utils/canvasUtils';

interface AdmissionFlyerGeneratorProps {
    userName: string;
    courseName: string;
    onClose: () => void;
}

export default function AdmissionFlyerGenerator({ userName, courseName, onClose }: AdmissionFlyerGeneratorProps) {
    const [image, setImage] = useState<string | null>(null);
    const [generating, setGenerating] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPreviewUrl(null); // Reset preview to show the new raw photo
            const reader = new FileReader();
            reader.onload = (event) => {
                setImage(event.target?.result as string);
            };
            reader.readAsDataURL(file);
            if (e.target) e.target.value = ''; // Allow picking the same file twice
        }
    };

    const generateFlyer = async () => {
        if (!image || !canvasRef.current) return;
        setGenerating(true);

        try {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // 1. Load Template
            const templateImg = new Image();
            templateImg.src = '/The Genesis Cohort.jpg';
            await new Promise((resolve, reject) => {
                templateImg.onload = resolve;
                templateImg.onerror = () => reject(new Error('Failed to load template'));
            });

            // Set canvas size to template size
            canvas.width = templateImg.width;
            canvas.height = templateImg.height;

            // Draw Template
            ctx.drawImage(templateImg, 0, 0);

            // 2. Clear the purple area slightly if needed, or just overlay
            // Visual coordinates based on the template (approx %):
            const cw = canvas.width;
            const ch = canvas.height;

            // Student Photo Area (the purple rectangle)
            // Approx Left: 15%, Top: 37%, Width: 70%, Height: 44%
            const photoX = cw * 0.165;
            const photoY = ch * 0.375;
            const photoW = cw * 0.67;
            const photoH = ch * 0.435;

            // 3. Load and Draw Student Image
            const studentImg = new Image();
            studentImg.src = image;
            await new Promise((resolve, reject) => {
                studentImg.onload = resolve;
                studentImg.onerror = reject;
            });

            // Draw student image into the purple box - using 'Smart Cover' mode to prevent black space
            drawRoundedImage(ctx, studentImg, photoX, photoY, photoW, photoH, 20);

            // 4. Draw Name in Orange Box
            const nameY = ch * 0.81;
            const nameH = ch * 0.082;
            
            ctx.save();
            ctx.fillStyle = '#ffffff';
            // Scale down font and use Bricolage Grotesque with 700 weight
            const fontSize = Math.floor(ch * 0.042); 
            ctx.font = `700 ${fontSize}px "Bricolage Grotesque", sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Add a subtle shadow for better depth
            ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            ctx.shadowBlur = 8;
            ctx.shadowOffsetY = 2;
            
            ctx.fillText(userName.toUpperCase(), cw * 0.5, nameY + (nameH / 2) + 5);
            ctx.restore();

            // 5. Dynamic Course Correction (Optional)
            // If the course isn't "AI foundations...", we could overlay a patch, 
            // but for now let's assume this template is for "The Genesis Cohort".
            
            setPreviewUrl(canvas.toDataURL('image/png', 0.9));
        } catch (error) {
            console.error('Error generating flyer:', error);
            alert('Failed to generate flyer. Please try a different image.');
        } finally {
            setGenerating(false);
        }
    };

    const downloadFlyer = async () => {
        if (!previewUrl) return;

        const fileName = `Khrien_Admission_${userName.replace(/\s+/g, '_')}.png`;

        // Modern browsers / Mobile: Use Web Share API if supported (especially helpful for iOS)
        if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare) {
            try {
                const response = await fetch(previewUrl);
                const blob = await response.blob();
                const file = new File([blob], fileName, { type: 'image/png' });

                if (navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: 'My Khrien Academy Admission Flyer',
                        text: 'Check out my official admission flyer from Khrien Academy! 🚀',
                    });
                    return; // Successfully handled by share sheet
                }
            } catch (err) {
                console.error('Sharing failed:', err);
                // Fallback to traditional download if share fails or is cancelled
            }
        }

        // Desktop / Fallback: Standard anchor download
        const link = document.createElement('a');
        link.download = fileName;
        link.href = previewUrl;
        link.click();
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
                onClick={onClose}
            />
            
            <div className="relative bg-white rounded-[40px] w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in duration-300 h-[90vh]">
                <button 
                    onClick={onClose}
                    className="absolute right-6 top-6 z-10 p-2 bg-white/10 hover:bg-white/20 text-white md:text-gray-400 md:hover:text-gray-600 rounded-full transition-all"
                >
                    <X size={24} />
                </button>

                <div className="md:w-3/5 bg-gray-900 flex items-center justify-center p-8 overflow-hidden border-b md:border-b-0 md:border-r border-white/10">
                    <div className="relative aspect-[3/4] w-full max-w-[450px] shadow-2xl rounded-2xl overflow-hidden border-4 border-white/20 bg-black">
                        {previewUrl ? (
                            <img src={previewUrl} alt="Flyer Preview" className="w-full h-full object-contain animate-in fade-in zoom-in duration-500" />
                        ) : image ? (
                            <div className="w-full h-full relative">
                                <img src={image} alt="Uploaded photo" className="w-full h-full object-cover opacity-50" />
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-6">
                                    <div className="w-16 h-16 bg-primary/20 backdrop-blur-md rounded-full flex items-center justify-center mb-4 border border-primary/30">
                                        <Check size={32} className="text-primary" />
                                    </div>
                                    <p className="font-black text-xl mb-1">Photo Loaded!</p>
                                    <p className="text-sm text-white/60">Click "Apply Photo" below to generate your official flyer.</p>
                                </div>
                                {generating && (
                                    <div className="absolute inset-0 bg-primary/20 backdrop-blur-md flex flex-col items-center justify-center text-white">
                                        <RefreshCw className="animate-spin mb-4" size={48} />
                                        <p className="font-black text-lg">Creating Flyer...</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-white/40 gap-4 bg-white/5 border-2 border-dashed border-white/20 rounded-2xl">
                                <Smartphone size={64} />
                                <div className="text-center p-4">
                                    <p className="font-black text-xl">Flyer Ready</p>
                                    <p className="text-sm">Upload your photo to see the magic!</p>
                                </div>
                            </div>
                        )}
                        <canvas ref={canvasRef} className="hidden" />
                    </div>
                </div>

                <div className="md:w-2/5 p-8 md:p-12 overflow-y-auto bg-white flex flex-col">
                    <div className="space-y-8 flex-1">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="text-primary" size={20} />
                                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Genesis Cohort</span>
                            </div>
                            <h2 className="text-3xl font-black text-gray-900 leading-tight">
                                Official <span className="text-primary">Admission</span> Flyer
                            </h2>
                            <p className="text-gray-500 font-medium mt-2">
                                We've designed a special template for your cohort. Just add your photo and download!
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="block">
                                <span className="text-sm font-black text-gray-900 uppercase tracking-widest">1. Select your photo</span>
                                <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="mt-2 group cursor-pointer relative overflow-hidden rounded-3xl border-2 border-dashed border-gray-200 hover:border-primary transition-all p-10 flex flex-col items-center justify-center gap-3 bg-gray-50/50"
                                >
                                    <div className="p-4 bg-white shadow-sm rounded-2xl text-gray-400 group-hover:text-primary transition-all">
                                        <Upload size={32} />
                                    </div>
                                    <span className="text-sm font-bold text-gray-900">
                                        {image ? 'Change Photo' : 'Click to upload'}
                                    </span>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef}
                                        className="hidden" 
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                            <p className="text-[10px] font-black text-amber-600 uppercase tracking-wider mb-1">Preview Info</p>
                            <p className="text-sm font-bold text-amber-900">{userName} — {courseName}</p>
                        </div>
                    </div>

                    <div className="pt-8 space-y-4">
                        {!previewUrl ? (
                            <button
                                onClick={generateFlyer}
                                disabled={!image || generating}
                                className={`w-full py-5 rounded-[24px] font-black text-lg shadow-xl transition-all flex items-center justify-center gap-3 ${
                                    !image || generating 
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-primary text-white hover:bg-purple-700 shadow-primary/20 transform active:scale-95'
                                }`}
                            >
                                {generating ? <RefreshCw className="animate-spin" /> : <Check />}
                                {generating ? 'Processing...' : 'Apply Photo to Template'}
                            </button>
                        ) : (
                            <div className="space-y-3">
                                <button
                                    onClick={downloadFlyer}
                                    className="w-full py-5 bg-emerald-500 text-white rounded-[24px] font-black text-lg shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 transform active:scale-95"
                                >
                                    <Download size={24} />
                                    Save / Share My Flyer
                                </button>
                                
                                <p className="text-[11px] text-center text-gray-400 font-bold px-4 leading-relaxed">
                                    <Smartphone size={12} className="inline mr-1" />
                                    iPhone user? You can also long-press the image to save it directly to your photos.
                                </p>
                            </div>
                        )}
                        
                        {previewUrl && (
                            <button
                                onClick={() => {
                                    setPreviewUrl(null);
                                    setImage(null);
                                }}
                                className="w-full py-3 text-gray-500 font-bold hover:text-gray-700 transition-all text-sm"
                            >
                                Pick another photo
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

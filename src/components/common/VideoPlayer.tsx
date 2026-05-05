"use client";

import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, RotateCcw, FastForward } from 'lucide-react';

interface VideoPlayerProps {
    src: string;
    poster?: string;
    onTimeUpdate?: (e: any) => void;
    onLoadedMetadata?: (e: any) => void;
    onSeeked?: (e: any) => void;
    onEnded?: () => void;
    className?: string;
}

export default function VideoPlayer({
    src,
    poster,
    onTimeUpdate,
    onLoadedMetadata,
    onSeeked,
    onEnded,
    className = ""
}: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isHls, setIsHls] = useState(false);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const hlsUrl = src.includes('.m3u8') || src.includes('bunnycdn.com') || src.includes('b-cdn.net');
        setIsHls(hlsUrl);

        let hls: Hls | null = null;

        if (hlsUrl) {
            if (Hls.isSupported()) {
                hls = new Hls({
                    capLevelToPlayerSize: true,
                    autoStartLoad: true,
                });
                hls.loadSource(src);
                hls.attachMedia(video);
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    if (onLoadedMetadata) {
                        onLoadedMetadata({ target: video });
                    }
                });

                // Error handling for smoother playback
                hls.on(Hls.Events.ERROR, (event, data) => {
                    if (data.fatal) {
                        switch (data.type) {
                            case Hls.ErrorTypes.NETWORK_ERROR:
                                hls?.startLoad();
                                break;
                            case Hls.ErrorTypes.MEDIA_ERROR:
                                hls?.recoverMediaError();
                                break;
                            default:
                                break;
                        }
                    }
                });
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                // Native HLS support (Safari)
                video.src = src;
            }
        } else {
            // Standard MP4 - Only update if src changed
            if (video.src !== src) {
                video.src = src;
            }
        }

        return () => {
            if (hls) {
                hls.destroy();
            }
        };
    }, [src]);

    return (
        <div className={`relative group bg-black rounded-xl overflow-hidden shadow-2xl ${className}`}>
            <video
                ref={videoRef}
                poster={poster}
                controls
                controlsList="nodownload"
                disablePictureInPicture
                onContextMenu={(e) => e.preventDefault()}
                playsInline
                className="w-full h-full object-contain"
                onTimeUpdate={onTimeUpdate}
                onLoadedMetadata={onLoadedMetadata}
                onSeeked={onSeeked}
                onEnded={onEnded}
            />
            
            {/* Premium Overlay Hint (Optional - but adds to the look) */}
            <div className="absolute top-4 right-4 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full animate-pulse ${isHls ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">
                        {isHls ? 'Adaptive HD' : 'Direct Play'}
                    </span>
                </div>
            </div>
        </div>
    );
}
